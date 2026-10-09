import base64
import hashlib
import json
import os
import posixpath
import re
import time
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import urljoin, urlparse

from cryptography.hazmat.primitives.asymmetric import ec, utils
from cryptography.hazmat.primitives import hashes
import requests
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import RDF, XSD

from shacl_validation import validate_turtle
from solid_catalog import (
    CATALOG_DOC,
    DEFAULT_TIMEOUT_SECONDS,
    DCAT,
    DCAT_ACCESS_URL,
    DCAT_CATALOG_CLASS,
    DCAT_CONTACT_POINT,
    DCAT_DATASET,
    DCAT_DATASET_LINK,
    DCAT_DISTRIBUTION,
    DCAT_DOWNLOAD_URL,
    DCAT_MEDIA_TYPE,
    DCAT_THEME,
    DCTERMS_ACCESS_RIGHTS,
    DCTERMS_CONFORMS_TO,
    DCTERMS_CREATOR,
    DCTERMS_DESCRIPTION,
    DCTERMS_IDENTIFIER,
    DCTERMS_ISSUED,
    DCTERMS_MODIFIED,
    DCTERMS_PUBLISHER,
    DCTERMS_TITLE,
    FOAF,
    FOAF_NAME,
    VCARD_EMAIL,
    VCARD_HAS_EMAIL,
    VCARD_VALUE,
    CatalogLoadError,
    _document_url,
    _format_candidates,
    _pod_root_from_web_id,
    _response_text,
    _resource_by_type,
    _validate_fetch_url,
)

DATASET_CONTAINER = "catalog/ds/"
RECORDS_CONTAINER = "catalog/records/"
DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/"
LDP = Namespace("http://www.w3.org/ns/ldp#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
SDM = Namespace("https://w3id.org/solid-dataspace-manager#")
ACL = Namespace("http://www.w3.org/ns/auth/acl#")

ACL_ACCESS_TO = URIRef(f"{ACL}accessTo")
ACL_AGENT = URIRef(f"{ACL}agent")
ACL_AGENT_CLASS = URIRef(f"{ACL}agentClass")
ACL_AUTHORIZATION = URIRef(f"{ACL}Authorization")
ACL_CONTROL = URIRef(f"{ACL}Control")
ACL_MODE = URIRef(f"{ACL}mode")
ACL_READ = URIRef(f"{ACL}Read")
ACL_WRITE = URIRef(f"{ACL}Write")
DCAT_CATALOG_RECORD = URIRef(f"{DCAT}CatalogRecord")
FOAF_AGENT = URIRef(f"{FOAF}Agent")
FOAF_PRIMARY_TOPIC = URIRef(f"{FOAF}primaryTopic")
SDM_CHANGELOG = URIRef(f"{SDM}changeLog")
SDM_CHANGE_EVENT = URIRef(f"{SDM}ChangeEvent")
VCARD_FN = URIRef(f"{VCARD}fn")
VCARD_FAMILY_NAME = URIRef(f"{VCARD}family-name")
VCARD_GIVEN_NAME = URIRef(f"{VCARD}given-name")


@dataclass
class ServiceAuth:
    authorization_header: str = ""
    access_token: str = ""
    dpop_private_key: Optional[Any] = None
    dpop_header: str = ""
    web_id: str = ""


class SolidServiceClient:
    def __init__(self):
        self.auth = _resolve_service_auth()
        self.warnings: list[str] = []
        configured_web_id = os.getenv("CATALOG_SERVICE_WEBID", "").strip()
        if configured_web_id and self.auth.web_id and configured_web_id != self.auth.web_id:
            self.warnings.append(
                "Configured CATALOG_SERVICE_WEBID does not match the authenticated token WebID."
            )
        auth_required = os.getenv("CATALOG_SERVICE_AUTH_REQUIRED", "true").lower()
        if not self.auth.authorization_header and auth_required not in {"0", "false", "no"}:
            raise CatalogLoadError(
                "Catalog service credentials are not configured. Set "
                "CATALOG_SERVICE_CLIENT_ID and CATALOG_SERVICE_CLIENT_SECRET, "
                "or CATALOG_SERVICE_AUTHORIZATION_HEADER.",
                status_code=503,
            )

    def request(
        self,
        method: str,
        url: str,
        *,
        headers: Optional[dict[str, str]] = None,
        data: Optional[bytes] = None,
    ) -> requests.Response:
        _validate_fetch_url(url)
        request_headers = dict(headers or {})
        if self.auth.authorization_header:
            request_headers["Authorization"] = self.auth.authorization_header
        if self.auth.dpop_private_key:
            request_headers["DPoP"] = _build_dpop_proof(
                self.auth.dpop_private_key,
                method,
                url,
                access_token=self.auth.access_token,
            )
        elif self.auth.dpop_header:
            request_headers["DPoP"] = self.auth.dpop_header
        try:
            return requests.request(
                method,
                url,
                headers=request_headers,
                data=data,
                timeout=DEFAULT_TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise CatalogLoadError(
                f"Solid request failed for {url}: {error}",
                status_code=502,
            ) from error


def _resolve_service_auth() -> ServiceAuth:
    dpop_header = (
        os.getenv("CATALOG_SERVICE_DPOP_HEADER")
        or os.getenv("CATALOG_SERVICE_DPOP")
        or ""
    )
    explicit = os.getenv("CATALOG_SERVICE_AUTHORIZATION_HEADER") or os.getenv(
        "CATALOG_SERVICE_AUTH_HEADER"
    )
    if explicit:
        return ServiceAuth(authorization_header=explicit, dpop_header=dpop_header)

    access_token = os.getenv("CATALOG_SERVICE_ACCESS_TOKEN")
    if access_token:
        token_type = os.getenv("CATALOG_SERVICE_TOKEN_TYPE", "Bearer")
        return ServiceAuth(
            authorization_header=f"{token_type} {access_token}",
            access_token=access_token,
            dpop_header=dpop_header,
            web_id=_token_web_id(access_token),
        )

    client_id = os.getenv("CATALOG_SERVICE_CLIENT_ID")
    client_secret = os.getenv("CATALOG_SERVICE_CLIENT_SECRET")
    if not client_id or not client_secret:
        return ServiceAuth(dpop_header=dpop_header)

    token_url = os.getenv("CATALOG_SERVICE_TOKEN_URL")
    issuer = os.getenv("CATALOG_SERVICE_OIDC_ISSUER")
    if not token_url and issuer:
        token_url = _discover_token_endpoint(issuer)
    if not token_url:
        raise CatalogLoadError(
            "Set CATALOG_SERVICE_TOKEN_URL or CATALOG_SERVICE_OIDC_ISSUER for "
            "client-credentials authentication.",
            status_code=503,
        )

    dpop_private_key = ec.generate_private_key(ec.SECP256R1())
    token_type, token = _fetch_client_credentials_token(
        token_url=token_url,
        client_id=client_id,
        client_secret=client_secret,
        scope=os.getenv("CATALOG_SERVICE_SCOPE", "webid"),
        dpop_private_key=dpop_private_key,
    )
    return ServiceAuth(
        authorization_header=f"{token_type} {token}",
        access_token=token,
        dpop_private_key=dpop_private_key,
        web_id=_token_web_id(token),
    )


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _public_jwk(private_key: Any) -> dict[str, str]:
    public_numbers = private_key.public_key().public_numbers()
    return {
        "kty": "EC",
        "crv": "P-256",
        "x": _b64url(public_numbers.x.to_bytes(32, "big")),
        "y": _b64url(public_numbers.y.to_bytes(32, "big")),
    }


def _dpop_htu(url: str) -> str:
    parsed = urlparse(url)
    return parsed._replace(fragment="").geturl()


def _build_dpop_proof(
    private_key: Any,
    method: str,
    url: str,
    *,
    access_token: Optional[str] = None,
) -> str:
    header = {
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": _public_jwk(private_key),
    }
    payload = {
        "htu": _dpop_htu(url),
        "htm": method.upper(),
        "iat": int(time.time()),
        "jti": str(uuid.uuid4()),
    }
    if access_token:
        payload["ath"] = _b64url(hashlib.sha256(access_token.encode("utf-8")).digest())

    signing_input = ".".join(
        [
            _b64url(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")),
            _b64url(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")),
        ]
    ).encode("ascii")
    der_signature = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
    r, s = utils.decode_dss_signature(der_signature)
    raw_signature = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return f"{signing_input.decode('ascii')}.{_b64url(raw_signature)}"


def _decode_jwt_claims(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) < 2:
        return {}
    try:
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = base64.urlsafe_b64decode(payload.encode("ascii")).decode("utf-8")
        claims = json.loads(decoded)
        return claims if isinstance(claims, dict) else {}
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _token_web_id(token: str) -> str:
    return str(_decode_jwt_claims(token).get("webid") or "")


def _discover_token_endpoint(issuer: str) -> str:
    issuer_url = issuer.rstrip("/")
    config_url = f"{issuer_url}/.well-known/openid-configuration"
    _validate_fetch_url(config_url)
    try:
        response = requests.get(
            config_url,
            headers={"Accept": "application/json"},
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise CatalogLoadError(
            f"OIDC discovery failed for {issuer_url}: {error}",
            status_code=502,
        ) from error
    if not response.ok:
        raise CatalogLoadError(
            f"OIDC discovery failed for {issuer_url}: HTTP {response.status_code}",
            status_code=502,
        )
    token_endpoint = response.json().get("token_endpoint")
    if not token_endpoint:
        raise CatalogLoadError("OIDC discovery did not return token_endpoint.", status_code=502)
    return str(token_endpoint)


def _fetch_client_credentials_token(
    *,
    token_url: str,
    client_id: str,
    client_secret: str,
    scope: str,
    dpop_private_key: Optional[Any] = None,
) -> tuple[str, str]:
    _validate_fetch_url(token_url)
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }
    if dpop_private_key:
        headers["DPoP"] = _build_dpop_proof(dpop_private_key, "POST", token_url)
    try:
        response = requests.post(
            token_url,
            data={"grant_type": "client_credentials", "scope": scope},
            headers=headers,
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise CatalogLoadError(
            f"Token request failed for {token_url}: {error}",
            status_code=502,
        ) from error
    if not response.ok:
        raise CatalogLoadError(
            f"Token request failed for {token_url}: HTTP {response.status_code}",
            status_code=503,
        )
    payload = response.json()
    token = payload.get("access_token")
    token_type = payload.get("token_type", "DPoP" if dpop_private_key else "Bearer")
    if not token:
        raise CatalogLoadError("Token response did not contain access_token.", status_code=503)
    return str(token_type), str(token)


def _now_datetime() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def _datetime_literal(value: Any, *, default_now: bool = False) -> Literal:
    if isinstance(value, datetime):
        date_value = value
    elif value:
        raw_value = str(value)
        try:
            date_value = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
        except ValueError:
            return Literal(raw_value, datatype=XSD.dateTime)
    elif default_now:
        date_value = _now_datetime()
    else:
        date_value = _now_datetime()

    if date_value.tzinfo is None:
        date_value = date_value.replace(tzinfo=timezone.utc)
    return Literal(date_value.isoformat(), datatype=XSD.dateTime)


def _safe_segment(value: Optional[str], fallback: str = "dataset") -> str:
    raw = (value or "").strip() or fallback
    normalized = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", normalized.lower())
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-._")
    return normalized[:120] or f"{fallback}-{uuid.uuid4()}"


def _uuid_identifier(value: Optional[str]) -> str:
    raw = str(value or "").strip()
    if not raw:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(raw))
    except ValueError as error:
        raise CatalogLoadError("identifier must be a UUID. Omit it to generate one.", 400) from error


def _is_http(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except (TypeError, ValueError):
        return False


def _theme_iri(value: str) -> str:
    if value.startswith("http://") or value.startswith("https://"):
        return value
    slug = re.sub(r"\s+", "-", value.strip().lower())
    return f"{DEFAULT_THEME_NS}{slug}"


def _bind_common_prefixes(graph: Graph) -> None:
    graph.bind("acl", ACL)
    graph.bind("dcat", DCAT)
    graph.bind("dcterms", "http://purl.org/dc/terms/")
    graph.bind("foaf", FOAF)
    graph.bind("vcard", VCARD)
    graph.bind("ldp", LDP)
    graph.bind("sdm", SDM)
    graph.bind("xsd", XSD)


def _add_local_ldp_resource(graph: Graph, owner_web_id: str, target_url: str) -> None:
    if not target_url:
        return
    pod_root = _pod_root_from_web_id(owner_web_id)
    if not target_url.startswith(pod_root):
        return
    target_ref = URIRef(target_url)
    graph.add((target_ref, RDF.type, URIRef(f"{LDP}Resource")))
    if target_url.endswith("/"):
        graph.add((target_ref, RDF.type, URIRef(f"{LDP}Container")))


def _literal_value(graph: Graph, subject: URIRef, predicate: URIRef) -> str:
    for value in graph.objects(subject, predicate):
        if isinstance(value, Literal):
            return str(value)
        if isinstance(value, URIRef):
            return str(value)
    return ""


def _email_from_profile_node(graph: Graph, value: Any) -> str:
    if isinstance(value, URIRef):
        raw = str(value)
        if raw.startswith("mailto:"):
            return raw.replace("mailto:", "", 1)
        nested = _literal_or_uri_value(graph, value, VCARD_VALUE)
        return nested.replace("mailto:", "", 1) if nested.startswith("mailto:") else nested
    if isinstance(value, Literal):
        raw = str(value)
        return raw.replace("mailto:", "", 1) if raw.startswith("mailto:") else raw
    return ""


def _literal_or_uri_value(graph: Graph, subject: URIRef, predicate: URIRef) -> str:
    for value in graph.objects(subject, predicate):
        if isinstance(value, Literal):
            return str(value)
        if isinstance(value, URIRef):
            return str(value)
    return ""


def _load_owner_profile_defaults(
    client: SolidServiceClient,
    owner_web_id: str,
) -> dict[str, str]:
    graph, _ = _read_graph_with_etag(client, _document_url(owner_web_id))
    if graph is None:
        return {"publisher": "", "contact_point": ""}

    profile_ref = URIRef(owner_web_id)
    name = (
        _literal_value(graph, profile_ref, VCARD_FN)
        or _literal_value(graph, profile_ref, FOAF_NAME)
    )
    if not name:
        name = " ".join(
            part
            for part in [
                _literal_value(graph, profile_ref, VCARD_GIVEN_NAME),
                _literal_value(graph, profile_ref, VCARD_FAMILY_NAME),
            ]
            if part
        ).strip()

    email = ""
    for value in graph.objects(profile_ref, VCARD_HAS_EMAIL):
        email = _email_from_profile_node(graph, value)
        if email:
            break
    if not email:
        for value in graph.objects(profile_ref, VCARD_EMAIL):
            email = _email_from_profile_node(graph, value)
            if email:
                break

    return {"publisher": name, "contact_point": email}


def _build_dataset_graph(
    *,
    owner_web_id: str,
    dataset_doc_url: str,
    identifier: str,
    payload: dict[str, Any],
) -> Graph:
    dataset_url = f"{dataset_doc_url}#it"
    dataset_ref = URIRef(dataset_url)
    graph = Graph()
    _bind_common_prefixes(graph)

    access_url = str(payload.get("access_url_dataset") or "").strip()
    if not _is_http(access_url) and not payload.get("distributions"):
        raise CatalogLoadError("access_url_dataset must be an absolute http(s) URL.", 400)

    access_type = str(payload.get("distribution_access_type") or "download").strip().lower()
    if access_type not in {"download", "access"}:
        raise CatalogLoadError("distribution_access_type must be 'download' or 'access'.", 400)
    if access_type == "access" and not payload.get("is_public", True):
        raise CatalogLoadError("dcat:accessURL links are supported only for public datasets.", 400)

    graph.add((dataset_ref, RDF.type, DCAT_DATASET))
    graph.add((dataset_ref, DCTERMS_IDENTIFIER, Literal(identifier)))
    graph.add((dataset_ref, DCTERMS_TITLE, Literal(str(payload.get("title") or ""))))
    graph.add((dataset_ref, DCTERMS_DESCRIPTION, Literal(str(payload.get("description") or ""))))
    graph.add((dataset_ref, DCTERMS_ISSUED, _datetime_literal(payload.get("issued"), default_now=True)))
    graph.add((dataset_ref, DCTERMS_MODIFIED, _datetime_literal(payload.get("modified"), default_now=True)))
    graph.add((dataset_ref, DCTERMS_PUBLISHER, Literal(str(payload.get("publisher") or ""))))
    graph.add((dataset_ref, DCTERMS_CREATOR, URIRef(owner_web_id)))
    graph.add(
        (
            dataset_ref,
            DCTERMS_ACCESS_RIGHTS,
            Literal("public" if payload.get("is_public", True) else "restricted"),
        )
    )

    contact_point = str(payload.get("contact_point") or "").strip()
    if contact_point:
        contact_ref = URIRef(f"{dataset_doc_url}#contact")
        graph.add((contact_ref, VCARD_FN, Literal(str(payload.get("publisher") or ""))))
        graph.add((contact_ref, VCARD_HAS_EMAIL, URIRef(f"mailto:{contact_point}")))
        graph.add((dataset_ref, DCAT_CONTACT_POINT, contact_ref))

    theme = str(payload.get("theme") or "").strip()
    if theme:
        graph.add((dataset_ref, DCAT_THEME, URIRef(_theme_iri(theme))))

    supplied = payload.get("distributions") or [{
        "downloadURL": access_url if access_type == "download" else "",
        "accessURL": access_url if access_type == "access" else "",
        "mediaType": payload.get("file_format"),
        "conformsTo": payload.get("conformsTo") or ([payload["access_url_semantic_model"]] if payload.get("access_url_semantic_model") else []),
    }]
    for index, distribution in enumerate(supplied):
        download = str(distribution.get("downloadURL") or "").strip()
        media_type = str(distribution.get("mediaType") or "").strip()
        models = distribution.get("conformsTo") or []
        if not _is_http(download):
            raise CatalogLoadError("Every distribution requires a direct HTTP(S) downloadURL.", 400)
        if urlparse(download).path.endswith("/"):
            raise CatalogLoadError("Solid containers must be cataloged as a Dataset Series.", 400)
        if not media_type or not models or not isinstance(models, list):
            raise CatalogLoadError("Every distribution requires mediaType and at least one model/schema IRI.", 400)
        distribution_ref = URIRef(f"{dataset_doc_url}#dist{index or ''}")
        graph.add((distribution_ref, RDF.type, DCAT.Distribution))
        graph.add((dataset_ref, DCAT_DISTRIBUTION, distribution_ref))
        graph.add((distribution_ref, DCAT_DOWNLOAD_URL, URIRef(download)))
        graph.add((distribution_ref, DCAT_MEDIA_TYPE, URIRef(media_type) if _is_http(media_type) else Literal(media_type)))
        access = distribution.get("accessURL")
        if access:
            if not _is_http(access):
                raise CatalogLoadError("accessURL must be an absolute HTTP(S) URL.", 400)
            graph.add((distribution_ref, DCAT_ACCESS_URL, URIRef(access)))
        for model in models:
            if not isinstance(model, str) or not urlparse(model).scheme or re.search(r'[<>"{}|^`\\\s]', model):
                raise CatalogLoadError("Model/schema references must be absolute IRIs.", 400)
            graph.add((distribution_ref, DCTERMS_CONFORMS_TO, URIRef(model)))
        _add_local_ldp_resource(graph, owner_web_id, download)
    record_ref = URIRef(dataset_doc_url)
    graph.add((record_ref, RDF.type, DCAT_CATALOG_RECORD))
    graph.add((record_ref, FOAF_PRIMARY_TOPIC, dataset_ref))
    graph.add((record_ref, DCTERMS_MODIFIED, _datetime_literal(None, default_now=True)))
    return graph


def build_dataset_turtle(
    *,
    owner_web_id: str,
    dataset_doc_url: str,
    identifier: str,
    payload: dict[str, Any],
) -> str:
    graph = _build_dataset_graph(
        owner_web_id=owner_web_id,
        dataset_doc_url=dataset_doc_url,
        identifier=identifier,
        payload=payload,
    )
    turtle = graph.serialize(format="turtle")
    conforms, results_text = validate_turtle(turtle, base_uri=dataset_doc_url)
    if not conforms:
        raise CatalogLoadError(
            f"Dataset metadata does not conform to the catalog SHACL shape: {results_text}",
            status_code=422,
        )
    return turtle


def _parse_graph_response(response: requests.Response, url: str) -> Graph:
    graph = Graph()
    last_error: Optional[Exception] = None
    for rdf_format in _format_candidates(response.headers.get("Content-Type", ""), response.url or url):
        try:
            graph.parse(data=_response_text(response), publicID=response.url or url, format=rdf_format)
            return graph
        except Exception as error:
            last_error = error
    raise CatalogLoadError(
        f"Failed to parse RDF from {url}: {last_error}",
        status_code=422,
    )


def _solid_status_to_api_status(status_code: int) -> int:
    if status_code in {401, 403, 404, 409, 412}:
        return 409 if status_code in {409, 412} else status_code
    return 502


def _raise_for_solid_response(response: requests.Response, method: str, url: str) -> None:
    if response.ok:
        return
    raise CatalogLoadError(
        f"Solid {method} {url} failed: HTTP {response.status_code}",
        status_code=_solid_status_to_api_status(response.status_code),
    )


def _ensure_container(client: SolidServiceClient, container_url: str) -> None:
    container_url = container_url if container_url.endswith("/") else f"{container_url}/"
    head = client.request("HEAD", container_url)
    if head.ok:
        return
    if head.status_code not in {404, 405}:
        _raise_for_solid_response(head, "HEAD", container_url)

    response = client.request(
        "PUT",
        container_url,
        headers={
            "Content-Type": "text/turtle",
            "Link": '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
        },
        data=b"",
    )
    if response.status_code in {200, 201, 204, 409, 412}:
        return
    _raise_for_solid_response(response, "PUT", container_url)


def _write_metadata_turtle(client, url, turtle, *, create_only=False, etag=None):
    """Create profile metadata with POST, update it with a conditional N3 patch."""
    existing, current_etag = _read_graph_with_etag(client, url)
    if existing is None:
        parent = urljoin(url, "./")
        slug = posixpath.basename(urlparse(url).path)
        response = client.request("POST", parent, headers={"Content-Type": "text/turtle", "Slug": slug}, data=turtle.encode("utf-8"))
        _raise_for_solid_response(response, "POST", parent)
        location = response.headers.get("Location") or response.headers.get("location")
        if not location or urljoin(parent, location) != url:
            raise CatalogLoadError("The Pod did not create the requested stable metadata URL.", 422)
        return
    if create_only:
        raise CatalogLoadError("The catalog entry already exists.", 409)
    updated = Graph().parse(data=turtle, publicID=url, format="turtle")
    removed = set(existing) - set(updated)
    inserted = set(updated) - set(existing)
    if not removed and not inserted:
        return
    from rdflib import BNode
    if any(isinstance(term, BNode) for triple in removed | inserted for term in triple):
        raise CatalogLoadError("Changing legacy blank-node metadata requires stable resource IRIs.", 422)
    def triples(values):
        return "\n".join(" ".join(term.n3() for term in triple) + " ." for triple in sorted(values, key=str))
    deletes, inserts = triples(removed), triples(inserted)
    patch = f"@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n_:patch a solid:InsertDeletePatch; solid:where {{ {deletes} }}; solid:deletes {{ {deletes} }}; solid:inserts {{ {inserts} }}."
    headers = {"Content-Type": "text/n3"}
    if etag or current_etag:
        headers["If-Match"] = etag or current_etag
    response = client.request("PATCH", url, headers=headers, data=patch.encode("utf-8"))
    _raise_for_solid_response(response, "PATCH", url)


def _read_graph_with_etag(
    client: SolidServiceClient,
    url: str,
) -> tuple[Optional[Graph], Optional[str]]:
    response = client.request(
        "GET",
        url,
        headers={
            "Accept": "text/turtle, application/ld+json;q=0.9, application/rdf+xml;q=0.8, */*;q=0.1"
        },
    )
    if response.status_code == 404:
        return None, None
    _raise_for_solid_response(response, "GET", url)
    return _parse_graph_response(response, url), response.headers.get("ETag")


def _upsert_catalog_link(
    client: SolidServiceClient,
    *,
    catalog_doc_url: str,
    catalog_url: str,
    dataset_url: str,
    owner_web_id: str,
    payload: dict[str, Any],
) -> Optional[str]:
    for attempt in range(4):
        graph, etag = _read_graph_with_etag(client, catalog_doc_url)
        if graph is None:
            graph = Graph()
            _bind_common_prefixes(graph)
        elif not etag or not re.fullmatch(r'"[^"\r\n]*"', etag):
            raise CatalogLoadError("The shared catalog requires a strong ETag for safe updates.", 422)

        catalog_ref = _resource_by_type(graph, catalog_url, [DCAT_CATALOG_CLASS])
        graph.add((catalog_ref, RDF.type, DCAT_CATALOG_CLASS))
        if not list(graph.objects(catalog_ref, DCTERMS_TITLE)):
            graph.add((catalog_ref, DCTERMS_TITLE, Literal("Solid Dataspace Catalog")))
        if not list(graph.objects(catalog_ref, DCAT_CONTACT_POINT)):
            graph.add((catalog_ref, DCAT_CONTACT_POINT, URIRef(owner_web_id)))
        graph.set((catalog_ref, DCTERMS_MODIFIED, _datetime_literal(None, default_now=True)))
        graph.add((catalog_ref, DCAT_DATASET_LINK, URIRef(dataset_url)))
        graph.add((catalog_ref, DCAT.record, URIRef(_document_url(dataset_url))))

        try:
            _write_metadata_turtle(
                client,
                catalog_doc_url,
                graph.serialize(format="turtle"),
                create_only=False,
                etag=etag,
            )
        except CatalogLoadError as error:
            if error.status_code == 409 and attempt < 3:
                continue
            raise
        return None


def _make_public_readable(
    client: SolidServiceClient,
    *,
    resource_url: str,
    owner_web_id: str,
) -> Optional[str]:
    doc_url = _document_url(resource_url)
    acl_url = f"{doc_url}.acl"
    try:
        graph, etag = _read_graph_with_etag(client, acl_url)
        if graph is None:
            graph = Graph()
            _bind_common_prefixes(graph)

        public_auth = URIRef(f"{acl_url}#public-read")
        graph.add((public_auth, RDF.type, ACL_AUTHORIZATION))
        graph.add((public_auth, ACL_ACCESS_TO, URIRef(doc_url)))
        graph.add((public_auth, ACL_AGENT_CLASS, FOAF_AGENT))
        graph.add((public_auth, ACL_MODE, ACL_READ))

        owner_auth = URIRef(f"{acl_url}#owner")
        graph.add((owner_auth, RDF.type, ACL_AUTHORIZATION))
        graph.add((owner_auth, ACL_ACCESS_TO, URIRef(doc_url)))
        graph.add((owner_auth, ACL_AGENT, URIRef(owner_web_id)))
        for mode in [ACL_READ, ACL_WRITE, ACL_CONTROL]:
            graph.add((owner_auth, ACL_MODE, mode))

        headers = {"Content-Type": "text/turtle"}
        if etag:
            headers["If-Match"] = etag
        response = client.request("PUT", acl_url, headers=headers,
                                  data=graph.serialize(format="turtle").encode("utf-8"))
        _raise_for_solid_response(response, "PUT", acl_url)
        return None
    except CatalogLoadError as error:
        return f"Could not set public read access for {doc_url}: {error.message}"


def _is_owner_pod_resource(owner_web_id: str, resource_url: str) -> bool:
    if not resource_url:
        return False
    try:
        return resource_url.startswith(_pod_root_from_web_id(owner_web_id))
    except (TypeError, ValueError):
        return False


def _sync_linked_resource_access(
    client: SolidServiceClient,
    *,
    owner_web_id: str,
    payload: dict[str, Any],
) -> list[str]:
    if not payload.get("is_public", True):
        return []

    warnings = []
    linked_urls = [
        str(payload.get("access_url_dataset") or "").strip(),
        str(payload.get("access_url_semantic_model") or "").strip(),
    ]
    for distribution in payload.get("distributions") or []:
        linked_urls.append(distribution.get("downloadURL") or "")
        linked_urls.extend(distribution.get("conformsTo") or [])
    linked_urls.extend(payload.get("conformsTo") or [])
    for linked_url in dict.fromkeys(url for url in linked_urls if url):
        if not _is_owner_pod_resource(owner_web_id, linked_url):
            continue
        warning = _make_public_readable(
            client,
            resource_url=linked_url,
            owner_web_id=owner_web_id,
        )
        if warning:
            warnings.append(warning)
    return warnings


def create_dataset(payload: dict[str, Any]) -> dict[str, Any]:
    owner_web_id = str(payload.get("owner_web_id") or payload.get("webid") or "").strip()
    if not owner_web_id:
        raise CatalogLoadError("ownerWebId is required.", 400)
    _validate_fetch_url(owner_web_id)

    identifier = _uuid_identifier(payload.get("identifier"))
    pod_root = _pod_root_from_web_id(owner_web_id)
    catalog_doc_url = urljoin(pod_root, CATALOG_DOC)
    catalog_url = f"{catalog_doc_url}#it"
    dataset_doc_url = urljoin(pod_root, f"{DATASET_CONTAINER}{identifier}.ttl")
    dataset_url = f"{dataset_doc_url}#it"
    record_doc_url = dataset_doc_url

    client = SolidServiceClient()
    warnings = list(client.warnings)
    profile_defaults = _load_owner_profile_defaults(client, owner_web_id)
    if not str(payload.get("publisher") or "").strip() and profile_defaults["publisher"]:
        payload["publisher"] = profile_defaults["publisher"]
    if not str(payload.get("contact_point") or "").strip() and profile_defaults["contact_point"]:
        payload["contact_point"] = profile_defaults["contact_point"]

    dataset_turtle = build_dataset_turtle(
        owner_web_id=owner_web_id,
        dataset_doc_url=dataset_doc_url,
        identifier=identifier,
        payload=payload,
    )
    _ensure_container(client, urljoin(pod_root, "catalog/"))
    _ensure_container(client, urljoin(pod_root, DATASET_CONTAINER))
    overwrite = bool(payload.get("overwrite", False))
    _write_metadata_turtle(client, dataset_doc_url, dataset_turtle, create_only=not overwrite)
    catalog_warning = _upsert_catalog_link(
        client,
        catalog_doc_url=catalog_doc_url,
        catalog_url=catalog_url,
        dataset_url=dataset_url,
        owner_web_id=owner_web_id,
        payload=payload,
    )
    if catalog_warning:
        warnings.append(catalog_warning)
    for doc_url in [catalog_doc_url, dataset_doc_url]:
        warning = _make_public_readable(
            client,
            resource_url=doc_url,
            owner_web_id=owner_web_id,
        )
        if warning:
            warnings.append(warning)
    warnings.extend(
        _sync_linked_resource_access(
            client,
            owner_web_id=owner_web_id,
            payload=payload,
        )
    )

    return {
        "status": "created" if not overwrite else "upserted",
        "identifier": identifier,
        "ownerWebId": owner_web_id,
        "serviceWebId": os.getenv("CATALOG_SERVICE_WEBID", ""),
        "authenticatedWebId": client.auth.web_id,
        "catalogUrl": catalog_url,
        "catalogDocUrl": _document_url(catalog_url),
        "datasetUrl": dataset_url,
        "datasetDocUrl": dataset_doc_url,
        "recordDocUrl": record_doc_url,
        "warnings": warnings,
    }

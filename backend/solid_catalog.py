import os
from typing import Any, Optional
from urllib.parse import urljoin, urlparse

from semantic_fetch import PublicRdfFetcher, FetchError, document_url
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import RDF

DCAT = Namespace("http://www.w3.org/ns/dcat#")
DCTERMS = Namespace("http://purl.org/dc/terms/")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
PIM = Namespace("http://www.w3.org/ns/pim/space#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
SDP = Namespace("http://purl.org/sdp/terms#")
LEGACY_SDP = Namespace("https://w3id.org/solid-dcat-profile#")
LDP = Namespace("http://www.w3.org/ns/ldp#")

CATALOG_DOC = "catalog/cat.ttl"
DEFAULT_TIMEOUT_SECONDS = float(os.getenv("CATALOG_FETCH_TIMEOUT_SECONDS", "10"))

DCAT_CATALOG_CLASS = URIRef(f"{DCAT}Catalog")
DCAT_CATALOG_LINK = URIRef(f"{DCAT}catalog")
DCAT_DATA_SERVICE = URIRef(f"{DCAT}DataService")
DCAT_DATASET = URIRef(f"{DCAT}Dataset")
DCAT_DATASET_SERIES = URIRef(f"{DCAT}DatasetSeries")
DCAT_DATASET_LINK = URIRef(f"{DCAT}dataset")
DCAT_DATASET_SERIES_LINK = URIRef(f"{DCAT}datasetSeries")
DCAT_CONTACT_POINT = URIRef(f"{DCAT}contactPoint")
DCAT_DISTRIBUTION = URIRef(f"{DCAT}distribution")
DCAT_DOWNLOAD_URL = URIRef(f"{DCAT}downloadURL")
DCAT_ACCESS_URL = URIRef(f"{DCAT}accessURL")
DCAT_MEDIA_TYPE = URIRef(f"{DCAT}mediaType")
DCAT_THEME = URIRef(f"{DCAT}theme")
DCAT_SERIES_MEMBER = URIRef(f"{DCAT}seriesMember")
DCAT_IN_SERIES = URIRef(f"{DCAT}inSeries")
LEGACY_DCAT_CONFORMS_TO = URIRef(f"{DCAT}conformsTo")
LDP_CONTAINS = URIRef(f"{LDP}contains")

DCTERMS_IDENTIFIER = URIRef(f"{DCTERMS}identifier")
DCTERMS_TITLE = URIRef(f"{DCTERMS}title")
DCTERMS_DESCRIPTION = URIRef(f"{DCTERMS}description")
DCTERMS_ISSUED = URIRef(f"{DCTERMS}issued")
DCTERMS_MODIFIED = URIRef(f"{DCTERMS}modified")
DCTERMS_PUBLISHER = URIRef(f"{DCTERMS}publisher")
DCTERMS_CREATOR = URIRef(f"{DCTERMS}creator")
DCTERMS_ACCESS_RIGHTS = URIRef(f"{DCTERMS}accessRights")
DCTERMS_CONFORMS_TO = URIRef(f"{DCTERMS}conformsTo")
DCTERMS_FORMAT = URIRef(f"{DCTERMS}format")

FOAF_NAME = URIRef(f"{FOAF}name")
PIM_STORAGE = URIRef(f"{PIM}storage")
SDP_CATALOG = URIRef(f"{SDP}catalog")
VCARD_HAS_EMAIL = URIRef(f"{VCARD}hasEmail")
VCARD_HAS_URL = URIRef(f"{VCARD}hasURL")
VCARD_EMAIL = URIRef(f"{VCARD}email")
VCARD_VALUE = URIRef(f"{VCARD}value")


class CatalogLoadError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _is_http_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except (TypeError, ValueError):
        return False


def _validate_fetch_url(url: str) -> None:
    try:
        document_url(url)
    except FetchError as error:
        raise CatalogLoadError(str(error), status_code=400) from error

    allowlist = [
        host.strip().lower()
        for host in os.getenv("CATALOG_FETCH_HOST_ALLOWLIST", "").split(",")
        if host.strip()
    ]
    if not allowlist:
        return

    hostname = (urlparse(url).hostname or "").lower()
    if hostname not in allowlist:
        raise CatalogLoadError("Catalog host is not allowed.", status_code=400)


def _document_url(resource_url: str) -> str:
    return resource_url.split("#", 1)[0]


def _pod_root_from_web_id(web_id: str) -> str:
    parsed = urlparse(web_id)
    segments = [segment for segment in parsed.path.split("/") if segment]
    try:
        profile_index = segments.index("profile")
        base_segments = segments[:profile_index]
    except ValueError:
        base_segments = segments
    base_path = f"/{'/'.join(base_segments)}/" if base_segments else "/"
    return f"{parsed.scheme}://{parsed.netloc}{base_path}"


def _default_catalog_url(web_id: str) -> str:
    return f"{_pod_root_from_web_id(web_id)}{CATALOG_DOC}#it"


def _fetch_graph(url: str) -> Graph:
    """Read public metadata with bounded, pinned transport and no service fallback."""
    def check_target(target):
        try:
            _validate_fetch_url(target)
        except CatalogLoadError as error:
            raise FetchError(error.message, kind="policy", status_code=error.status_code) from error
    try:
        return PublicRdfFetcher(timeout=DEFAULT_TIMEOUT_SECONDS, url_policy=check_target).get(url).graph
    except FetchError as error:
        raise CatalogLoadError(str(error), status_code=error.status_code) from error


def _first_object(graph: Graph, subject: URIRef, predicate: URIRef) -> Optional[Any]:
    return next(graph.objects(subject, predicate), None)


def _first_uri(graph: Graph, subject: URIRef, predicate: URIRef) -> str:
    value = _first_object(graph, subject, predicate)
    return str(value) if isinstance(value, URIRef) else ""


def _first_literal(graph: Graph, subject: URIRef, predicate: URIRef) -> str:
    for value in graph.objects(subject, predicate):
        if isinstance(value, Literal):
            return str(value)
        if isinstance(value, URIRef):
            return str(value)
    return ""


def _uri_values(graph: Graph, subject: URIRef, predicate: URIRef) -> list[str]:
    return [str(value) for value in graph.objects(subject, predicate) if isinstance(value, URIRef)]


def _resource_by_type(graph: Graph, resource_url: str, rdf_types: list[URIRef]) -> URIRef:
    candidates = [URIRef(resource_url)]
    doc_url = _document_url(resource_url)
    if "#" not in resource_url:
        candidates.append(URIRef(f"{doc_url}#it"))

    for candidate in candidates:
        if any((candidate, RDF.type, rdf_type) in graph for rdf_type in rdf_types):
            return candidate

    for rdf_type in rdf_types:
        subject = next(graph.subjects(RDF.type, rdf_type), None)
        if isinstance(subject, URIRef):
            return subject

    raise CatalogLoadError("No resource with the required RDF type was found.", status_code=422)


def _resolve_catalog_url_from_profile(web_id: str) -> str:
    _validate_fetch_url(web_id)
    graph = _fetch_graph(_document_url(web_id))
    web_id_ref = URIRef(web_id)
    profile_catalog = (
        _first_uri(graph, web_id_ref, SDP_CATALOG)
        or _first_uri(graph, web_id_ref, LEGACY_SDP.catalog)
        or _first_uri(graph, web_id_ref, DCAT_CATALOG_LINK)
    )
    if profile_catalog:
        return profile_catalog

    storage = _first_uri(graph, web_id_ref, PIM_STORAGE)
    if storage:
        return urljoin(storage if storage.endswith("/") else f"{storage}/", CATALOG_DOC) + "#it"

    return _default_catalog_url(web_id)


def resolve_catalog_url(web_id: Optional[str] = None, catalog_url: Optional[str] = None) -> str:
    if catalog_url:
        _validate_fetch_url(catalog_url)
        return catalog_url
    if web_id:
        return _resolve_catalog_url_from_profile(web_id)
    raise CatalogLoadError("Either webId or catalogUrl is required.", status_code=400)


def load_catalog(web_id: Optional[str] = None, catalog_url: Optional[str] = None) -> dict:
    resolved_catalog_url = resolve_catalog_url(web_id=web_id, catalog_url=catalog_url)
    doc_url = _document_url(resolved_catalog_url)
    graph = _fetch_graph(doc_url)
    catalog_subject = _resource_by_type(graph, resolved_catalog_url, [DCAT_CATALOG_CLASS])
    dataset_urls = list(
        dict.fromkeys(
            _uri_values(graph, catalog_subject, DCAT_DATASET_LINK)
            + _uri_values(graph, catalog_subject, DCAT_DATASET_SERIES_LINK)
            + _uri_values(graph, catalog_subject, DCAT.service)
        )
    )

    # Record-only catalogs are valid discovery entry points. The storage path
    # is not part of the profile; only the legacy fallback assumes catalog/ds/.
    record_graphs = {}
    errors = []
    records = _uri_values(graph, catalog_subject, DCAT.record)
    if len(records) > 1000:
        raise CatalogLoadError("Catalog metadata document limit reached.", 422)
    for record in records:
        record_doc = _document_url(record)
        try:
            if record_doc not in record_graphs:
                record_graphs[record_doc] = graph if any(graph.triples((URIRef(record), None, None))) else _fetch_graph(record_doc)
            record_graph = record_graphs[record_doc]
        except CatalogLoadError as error:
            errors.append({"url": record_doc, "status": error.status_code, "detail": error.message})
            continue
        try:
            subject = _resource_by_type(record_graph, record, [DCAT.CatalogRecord])
            dataset_urls.extend(_uri_values(record_graph, subject, FOAF.primaryTopic))
        except CatalogLoadError as error:
            errors.append({"url": record_doc, "status": error.status_code, "detail": error.message})
    for candidate in _container_dataset_urls(doc_url):
        if candidate in dataset_urls:
            continue
        try:
            candidate_graph = _fetch_graph(_document_url(candidate))
            if (URIRef(candidate), RDF.type, DCAT_DATA_SERVICE) in candidate_graph:
                continue
            dataset_urls.append(candidate)
        except CatalogLoadError:
            continue
    dataset_urls = list(dict.fromkeys(dataset_urls))
    return {
        "catalogUrl": str(catalog_subject),
        "catalogDocUrl": doc_url,
        "webId": web_id or "",
        "title": _first_literal(graph, catalog_subject, DCTERMS_TITLE),
        "description": _first_literal(graph, catalog_subject, DCTERMS_DESCRIPTION),
        "contactPoint": _first_uri(graph, catalog_subject, DCAT_CONTACT_POINT),
        "datasets": dataset_urls,
        "datasetCount": len(dataset_urls),
        "records": records,
        "errors": errors,
    }


def _container_dataset_urls(catalog_doc_url: str) -> list[str]:
    ds_container_url = urljoin(catalog_doc_url, "ds/")
    try:
        graph = _fetch_graph(ds_container_url)
    except CatalogLoadError:
        return []
    dataset_urls = []
    for value in graph.objects(None, LDP_CONTAINS):
        if not isinstance(value, URIRef):
            continue
        doc_url = str(value)
        if doc_url.endswith(".ttl"):
            dataset_urls.append(f"{doc_url}#it")
    return dataset_urls


def _identifier_from_url(resource_url: str) -> str:
    path = urlparse(_document_url(resource_url)).path.rstrip("/")
    name = path.rsplit("/", 1)[-1]
    return name.rsplit(".", 1)[0] if name else resource_url


def _publisher_value(graph: Graph, dataset_subject: URIRef) -> str:
    publisher = _first_object(graph, dataset_subject, DCTERMS_PUBLISHER)
    if isinstance(publisher, Literal):
        return str(publisher)
    if isinstance(publisher, URIRef):
        return (
            _first_literal(graph, publisher, FOAF_NAME)
            or _first_literal(graph, publisher, DCTERMS_TITLE)
            or str(publisher)
        )
    return ""


def _email_value(graph: Graph, contact_subject: URIRef) -> str:
    for predicate in [VCARD_HAS_EMAIL, VCARD_EMAIL, VCARD_VALUE]:
        for value in graph.objects(contact_subject, predicate):
            if isinstance(value, URIRef):
                raw = str(value)
                return raw.replace("mailto:", "", 1) if raw.startswith("mailto:") else raw
            if isinstance(value, Literal):
                return str(value)
    return ""


def _contact_point_value(graph: Graph, dataset_subject: URIRef) -> str:
    contact = _first_object(graph, dataset_subject, DCAT_CONTACT_POINT)
    if isinstance(contact, URIRef):
        contact_url = _first_uri(graph, contact, VCARD_HAS_URL)
        return _email_value(graph, contact) or contact_url or str(contact)
    if isinstance(contact, Literal):
        return str(contact)
    publisher = _first_object(graph, dataset_subject, DCTERMS_PUBLISHER)
    if isinstance(publisher, URIRef):
        return _email_value(graph, publisher)
    return ""


def _distribution_values(graph: Graph, dataset_subject: URIRef) -> list[dict]:
    legacy_models = _uri_values(graph, dataset_subject, DCTERMS_CONFORMS_TO) + _uri_values(graph, dataset_subject, LEGACY_DCAT_CONFORMS_TO)
    values = []
    for distribution in graph.objects(dataset_subject, DCAT_DISTRIBUTION):
        if not isinstance(distribution, URIRef):
            continue
        values.append({
            "url": str(distribution),
            "downloadURL": _first_uri(graph, distribution, DCAT_DOWNLOAD_URL),
            "accessURL": _first_uri(graph, distribution, DCAT_ACCESS_URL),
            "mediaType": _first_literal(graph, distribution, DCAT_MEDIA_TYPE) or _first_literal(graph, distribution, DCTERMS_FORMAT),
            "conformsTo": _uri_values(graph, distribution, DCTERMS_CONFORMS_TO) or legacy_models,
        })
    return values


def _distribution_value(graph: Graph, dataset_subject: URIRef) -> tuple[str, str, str]:
    values = _distribution_values(graph, dataset_subject)
    primary = next((item for item in values if item["downloadURL"] or item["accessURL"]), {})
    return primary.get("downloadURL") or primary.get("accessURL", ""), "download" if primary.get("downloadURL") else "access", primary.get("mediaType", "")


def _is_public(graph: Graph, dataset_subject: URIRef) -> bool:
    access_rights = _first_literal(graph, dataset_subject, DCTERMS_ACCESS_RIGHTS).lower()
    if not access_rights:
        return True
    return "restricted" not in access_rights and "private" not in access_rights


def load_dataset(dataset_url: str) -> dict:
    _validate_fetch_url(dataset_url)
    graph = _fetch_graph(_document_url(dataset_url))
    visited = set()
    target = dataset_url
    while True:
        if target in visited or len(visited) >= 32:
            raise CatalogLoadError("Cyclic or excessive CatalogRecord links.", status_code=422)
        visited.add(target)
        target_ref = URIRef(target)
        declared = set(graph.objects(target_ref, RDF.type))
        if declared:
            if declared.intersection({DCAT_DATASET, DCAT_DATASET_SERIES, DCAT_DATA_SERVICE}):
                dataset_subject = target_ref
                break
            if DCAT.CatalogRecord not in declared:
                raise CatalogLoadError("Requested resource is not a Dataset, DatasetSeries or CatalogRecord.", status_code=422)
            record = target_ref
        else:
            if "#" in target:
                if any(graph.triples((target_ref, None, None))):
                    raise CatalogLoadError("Requested resource has no Dataset, DatasetSeries or CatalogRecord type.", status_code=422)
                raise CatalogLoadError("Requested dataset fragment was not found.", status_code=404)
            records = list(graph.subjects(RDF.type, DCAT.CatalogRecord))
            if not records:
                dataset_subject = _resource_by_type(graph, target, [DCAT_DATASET, DCAT_DATASET_SERIES, DCAT_DATA_SERVICE])
                break
            record = records[0]
        topics = list(graph.objects(record, FOAF.primaryTopic))
        if len(topics) != 1 or not isinstance(topics[0], URIRef):
            raise CatalogLoadError("CatalogRecord requires one primaryTopic IRI.", status_code=422)
        target = str(topics[0])
        if _document_url(target) != _document_url(str(record)):
            graph = _fetch_graph(_document_url(target))
    rdf_types = set(graph.objects(dataset_subject, RDF.type))
    is_series = DCAT_DATASET_SERIES in rdf_types or any(
        graph.objects(dataset_subject, DCAT_SERIES_MEMBER)
    )
    for distribution in list(graph.objects(dataset_subject, DCAT_DISTRIBUTION)):
        if isinstance(distribution, URIRef) and not any(graph.triples((distribution, None, None))):
            graph += _fetch_graph(_document_url(str(distribution)))
    distributions = _distribution_values(graph, dataset_subject)
    semantic_models = list(dict.fromkeys(model for item in distributions for model in item["conformsTo"]))
    access_url, access_type, media_type = _distribution_value(graph, dataset_subject)
    semantic_model = (
        next(iter(semantic_models), "")
        or _first_uri(graph, dataset_subject, DCTERMS_CONFORMS_TO)
        or _first_uri(graph, dataset_subject, LEGACY_DCAT_CONFORMS_TO)
    )

    return {
        "identifier": _first_literal(graph, dataset_subject, DCTERMS_IDENTIFIER)
        or _identifier_from_url(str(dataset_subject)),
        "title": _first_literal(graph, dataset_subject, DCTERMS_TITLE),
        "description": _first_literal(graph, dataset_subject, DCTERMS_DESCRIPTION),
        "issued": _first_literal(graph, dataset_subject, DCTERMS_ISSUED),
        "modified": _first_literal(graph, dataset_subject, DCTERMS_MODIFIED),
        "publisher": _publisher_value(graph, dataset_subject),
        "contact_point": _contact_point_value(graph, dataset_subject),
        "is_public": _is_public(graph, dataset_subject),
        "access_url_dataset": access_url,
        "distribution_access_type": access_type,
        "access_url_semantic_model": semantic_model,
        "distributions": distributions,
        "semanticModels": semantic_models or ([semantic_model] if semantic_model else []),
        "file_format": media_type,
        "theme": _first_uri(graph, dataset_subject, DCAT_THEME)
        or _first_literal(graph, dataset_subject, DCAT_THEME),
        "webid": _first_uri(graph, dataset_subject, DCTERMS_CREATOR),
        "datasetUrl": str(dataset_subject),
        "datasetDocUrl": _document_url(str(dataset_subject)),
        "datasetType": "service" if DCAT_DATA_SERVICE in rdf_types else "series" if is_series else "dataset",
        **({"endpointURL": _first_uri(graph, dataset_subject, DCAT.endpointURL), "endpointDescription": _first_uri(graph, dataset_subject, DCAT.endpointDescription), "servesDataset": _uri_values(graph, dataset_subject, DCAT.servesDataset), "authentication": _first_literal(graph, dataset_subject, URIRef("https://w3id.org/solid-dataspace/catalog-api#authentication")) or "public"} if DCAT_DATA_SERVICE in rdf_types else {}),
        "seriesMembers": _uri_values(graph, dataset_subject, DCAT_SERIES_MEMBER),
        "inSeries": _uri_values(graph, dataset_subject, DCAT_IN_SERIES),
    }


def load_catalog_datasets(
    web_id: Optional[str] = None,
    catalog_url: Optional[str] = None,
) -> tuple[dict, list[dict], list[dict]]:
    catalog = load_catalog(web_id=web_id, catalog_url=catalog_url)
    datasets = []
    errors = list(catalog.get("errors", []))

    pending = list(catalog["datasets"])
    visited = set()
    while pending:
        dataset_url = pending.pop(0)
        if dataset_url in visited:
            continue
        visited.add(dataset_url)
        if len(visited) > 1000:
            raise CatalogLoadError("Catalog metadata document limit reached.", 422)
        try:
            dataset = load_dataset(dataset_url)
            dataset["catalogUrl"] = catalog["catalogUrl"]
            datasets.append(dataset)
            pending.extend(dataset["seriesMembers"])
        except CatalogLoadError as error:
            errors.append(
                {
                    "url": dataset_url,
                    "status": error.status_code,
                    "detail": error.message,
                }
            )

    return catalog, datasets, errors

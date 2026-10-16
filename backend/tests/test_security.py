import hashlib
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from rdflib import Graph

from main import app
from semantic_fetch import PublicRdfFetcher, FetchError, bounded_http_request
from solid_catalog import CatalogLoadError, load_dataset, load_catalog
from solid_writer import SolidServiceClient, ServiceAuth, create_dataset

OWNER = "https://pod.example/alice/profile/card#me"
DOC = "https://pod.example/alice/catalog/ds/old.ttl"
TOKEN = "test-only-scoped-integration-token-with-at-least-32-bytes"
PAYLOAD = {"ownerWebId": OWNER, "title": "New source", "file_format": "application/json",
           "access_url_dataset": "https://pod.example/alice/data.json", "conformsTo": ["https://example.org/schema.json"]}
PREFIX = '@prefix dcat: <http://www.w3.org/ns/dcat#>. @prefix foaf: <http://xmlns.com/foaf/0.1/>. @prefix dct: <http://purl.org/dc/terms/>. '
LEGACY = PREFIX + '<#it> a dcat:Dataset; dct:title "Legacy entry".'


def credentials(monkeypatch, tmp_path, **changes):
    path = tmp_path / "grants.json"
    path.write_text(json.dumps([{"id": "integration-a", "token_sha256": hashlib.sha256(TOKEN.encode()).hexdigest(),
                                "owner_webids": [OWNER], **changes}]))
    monkeypatch.setenv("CATALOG_WRITE_CLIENTS_FILE", str(path))
    return {"Authorization": "Bearer " + TOKEN}


@pytest.mark.parametrize("header", [None, "Bearer wrong-token", "DPoP token", "Bearer a b"])
def test_anonymous_and_untrusted_writers_never_reach_service(monkeypatch, header):
    monkeypatch.delenv("CATALOG_WRITE_CLIENTS_FILE", raising=False)
    with patch("main.create_dataset_with_service") as writer, patch("solid_writer._resolve_service_auth") as auth:
        response = TestClient(app).post("/api/datasets", json=PAYLOAD, headers={"Authorization": header} if header else {})
    assert response.status_code == 401
    writer.assert_not_called()
    auth.assert_not_called()


def test_owner_and_acl_grants_are_checked_before_service_access(monkeypatch, tmp_path):
    headers = credentials(monkeypatch, tmp_path)
    client = TestClient(app)
    with patch("main.create_dataset_with_service", return_value={"status": "created"}) as writer:
        assert client.post("/api/datasets", headers=headers, json={**PAYLOAD, "ownerWebId": "https://pod.example/bob/profile/card#me", "is_public": False}).status_code == 403
        assert client.post("/api/datasets", headers=headers, json=PAYLOAD).status_code == 403
        assert client.post("/api/datasets", headers=headers, json={**PAYLOAD, "is_public": False, "overwrite": True}).status_code == 403
        writer.assert_not_called()
        assert client.post("/api/datasets", headers=headers, json={**PAYLOAD, "is_public": False}).status_code == 201
        assert writer.call_args.args[0]["owner_web_id"] == OWNER
        assert writer.call_args.kwargs["allow_acl_changes"] is False


def test_publication_and_overwrite_require_explicit_scope(monkeypatch, tmp_path):
    headers = credentials(monkeypatch, tmp_path, allow_public=True, allow_overwrite=True)
    with patch("main.create_dataset_with_service", return_value={"status": "upserted"}) as writer:
        assert TestClient(app).post("/api/datasets", headers=headers, json={**PAYLOAD, "overwrite": True}).status_code == 201
        assert writer.call_args.args[0]["overwrite"] is True
        assert writer.call_args.kwargs["allow_acl_changes"] is True


def test_invalid_grant_configuration_fails_closed(monkeypatch, tmp_path):
    headers = credentials(monkeypatch, tmp_path, allow_public="false")
    with patch("main.create_dataset_with_service") as writer:
        response = TestClient(app).post("/api/datasets", headers=headers, json=PAYLOAD)
    assert response.status_code == 503
    assert TOKEN not in response.text
    writer.assert_not_called()


@pytest.mark.parametrize("status", [401, 403, 404])
def test_public_reader_never_uses_service_credentials(status):
    with patch.object(PublicRdfFetcher, "_read", return_value=(status, {}, b"")), patch("solid_writer.SolidServiceClient") as service:
        response = TestClient(app).get("/api/datasets/resolve", params={"url": DOC + "#it"})
    assert response.status_code == status
    service.assert_not_called()


def test_public_legacy_dataset_without_conforms_to_is_still_readable():
    with patch.object(PublicRdfFetcher, "_read", return_value=(200, {"Content-Type": "text/turtle"}, LEGACY.encode())):
        response = TestClient(app).get("/api/datasets/resolve", params={"url": DOC + "#it"})
    assert response.status_code == 200
    assert response.json()["title"] == "Legacy entry"
    assert response.json()["semanticModels"] == []


@pytest.mark.parametrize("source", [
    '<#it> a <http://www.w3.org/ns/auth/acl#Authorization>.',
    '<#it> <http://purl.org/dc/terms/title> "Not a dataset".',
    '<#it> a <http://www.w3.org/ns/dcat#Distribution>.',
])
def test_non_dataset_rdf_is_not_returned_as_an_empty_dataset(source):
    with patch.object(PublicRdfFetcher, "_read", return_value=(200, {"Content-Type": "text/turtle"}, source.encode())):
        response = TestClient(app).get("/api/datasets/resolve", params={"url": DOC + "#it"})
    assert response.status_code == 422


def test_explicit_missing_fragment_does_not_resolve_an_unrelated_dataset():
    with patch("solid_catalog._fetch_graph", return_value=Graph().parse(data=LEGACY, publicID=DOC, format="turtle")):
        with pytest.raises(CatalogLoadError) as error:
            load_dataset(DOC + "#missing")
    assert error.value.status_code == 404


@pytest.mark.parametrize("separate", [True, False])
def test_catalog_record_primary_topic_resolves_typed_legacy_data(separate):
    record = "https://pod.example/alice/catalog/records/old.ttl" if separate else DOC
    turtle = PREFIX + f'<> a dcat:CatalogRecord; foaf:primaryTopic <{DOC}#it>.'
    record_graph = Graph().parse(data=turtle + ("" if separate else LEGACY), publicID=record, format="turtle")
    legacy_graph = Graph().parse(data=LEGACY, publicID=DOC, format="turtle")
    with patch("solid_catalog._fetch_graph", side_effect=lambda url: record_graph if url == record else legacy_graph):
        value = load_dataset(record)
    assert value["title"] == "Legacy entry" and value["datasetUrl"] == DOC + "#it"


def test_invalid_record_does_not_hide_valid_catalog_siblings():
    root = "https://pod.example/alice/catalog/cat.ttl"
    graph = Graph().parse(data=PREFIX + f'<#it> a dcat:Catalog; dcat:dataset <{DOC}#it>; dcat:record <{root}.acl>.', publicID=root, format="turtle")
    acl = Graph().parse(data='<#owner> a <http://www.w3.org/ns/auth/acl#Authorization>.', publicID=root + ".acl", format="turtle")
    with patch("solid_catalog._fetch_graph", side_effect=lambda url: graph if url == root else acl), patch("solid_catalog._container_dataset_urls", return_value=[]):
        result = load_catalog(catalog_url=root + "#it")
    assert result["datasets"] == [DOC + "#it"]
    assert result["errors"][0]["status"] == 422


@pytest.mark.parametrize("address", ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "64:ff9b::7f00:1"])
def test_private_multicast_and_translated_targets_fail_before_connection(address):
    with patch("semantic_fetch.socket.getaddrinfo", return_value=[(2, 1, 6, "", (address, 443))]), patch("semantic_fetch.urllib3.HTTPSConnectionPool") as pool:
        with pytest.raises(FetchError) as error:
            PublicRdfFetcher().get("https://source.example/metadata.ttl")
    assert error.value.status_code == 400
    pool.assert_not_called()


def mock_response(status=200, headers=None, body=None):
    response = MagicMock()
    response.status = status
    response.headers = headers or {"Content-Type": "text/turtle"}
    response.read.return_value = LEGACY.encode() if body is None else body
    return response


def test_dns_is_pinned_and_service_headers_are_never_added_to_public_reads():
    response = mock_response()
    with patch("semantic_fetch.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 443))]) as dns, patch("semantic_fetch.urllib3.HTTPSConnectionPool") as pool:
        pool.return_value.urlopen.return_value = response
        PublicRdfFetcher().get("https://source.example/metadata.ttl")
    dns.assert_called_once()
    assert pool.call_args.args[0] == "93.184.216.34"
    assert pool.call_args.kwargs["server_hostname"] == "source.example"
    args = pool.return_value.urlopen.call_args.kwargs
    assert args["redirect"] is False
    assert args["headers"]["Host"] == "source.example"
    assert "Authorization" not in args["headers"]
    response.close.assert_called_once()


def test_redirect_to_private_address_never_connects_to_it():
    answers = [[(2, 1, 6, "", ("93.184.216.34", 443))], [(2, 1, 6, "", ("127.0.0.1", 443))]]
    with patch("semantic_fetch.socket.getaddrinfo", side_effect=answers), patch("semantic_fetch.urllib3.HTTPSConnectionPool") as pool:
        pool.return_value.urlopen.return_value = mock_response(302, {"Location": "https://internal.example/secret"}, b"")
        with pytest.raises(FetchError) as error:
            PublicRdfFetcher().get("https://public.example/record.ttl")
    assert error.value.status_code == 400
    assert pool.call_count == 1


def test_host_allowlist_is_checked_after_redirect(monkeypatch):
    monkeypatch.setenv("CATALOG_FETCH_HOST_ALLOWLIST", "public.example")
    with patch("semantic_fetch.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 443))]), patch("semantic_fetch.urllib3.HTTPSConnectionPool") as pool:
        pool.return_value.urlopen.return_value = mock_response(302, {"Location": "https://other.example/record.ttl"}, b"")
        response = TestClient(app).get("/api/datasets/resolve", params={"url": "https://public.example/record.ttl"})
    assert response.status_code == 400
    assert pool.call_count == 1


def test_oversized_decoded_response_is_rejected_and_connection_closed():
    response = mock_response(body=b"x" * 101)
    with patch("semantic_fetch.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 443))]), patch("semantic_fetch.urllib3.HTTPSConnectionPool") as pool:
        pool.return_value.urlopen.return_value = response
        with pytest.raises(FetchError) as error:
            bounded_http_request("https://example.org/record.ttl", {}, max_bytes=100)
    assert error.value.status_code == 413
    response.read.assert_called_once_with(101, decode_content=True)
    response.close.assert_called_once()


@pytest.mark.parametrize("media,body", [("application/ld+json", b'{"@context":"http://127.0.0.1/context"}'), ("application/rdf+xml", b'<!DOCTYPE rdf [<!ENTITY x SYSTEM "file:///etc/passwd">]>')])
def test_formats_with_external_resolution_are_not_parsed(media, body):
    with patch.object(PublicRdfFetcher, "_read", return_value=(200, {"Content-Type": media}, body)), patch("rdflib.Graph.parse") as parser:
        response = TestClient(app).get("/api/datasets/resolve", params={"url": DOC})
    assert response.status_code == 415
    parser.assert_not_called()


@pytest.mark.parametrize("target", ["https://pod.example/bob/file.ttl", "https://other.example/alice/file.ttl", "https://pod.example/alice/../bob/file.ttl", "https://pod.example/alice/%252e%252e/bob/file.ttl", "https://pod.example/alice/file.ttl?target=bob"])
def test_authenticated_service_transport_cannot_escape_owner_scope(target):
    with patch("solid_writer._resolve_service_auth", return_value=ServiceAuth(authorization_header="Bearer synthetic")), patch("solid_writer.bounded_http_request") as transport:
        client = SolidServiceClient(pod_root="https://pod.example/alice/")
        with pytest.raises(CatalogLoadError) as error:
            client.request("GET", target)
    assert error.value.status_code == 403
    transport.assert_not_called()


def test_authenticated_service_does_not_follow_redirects_with_credentials():
    with patch("solid_writer._resolve_service_auth", return_value=ServiceAuth(authorization_header="Bearer synthetic")), patch("solid_writer.bounded_http_request", return_value=(302, {"Location": "https://other.example/"}, b"")) as transport:
        client = SolidServiceClient(pod_root="https://pod.example/alice/")
        with pytest.raises(CatalogLoadError):
            client.request("GET", DOC)
    transport.assert_called_once()


def test_restricted_service_grant_never_changes_metadata_or_linked_resource_acls():
    client = MagicMock()
    client.warnings = []
    client.auth.web_id = OWNER
    payload = {"owner_web_id": OWNER, "title": "New private representation", "is_public": False,
               "access_url_dataset": "https://pod.example/alice/data.json", "file_format": "application/json",
               "access_url_semantic_model": "https://example.org/schema.json"}
    with patch("solid_writer.SolidServiceClient", return_value=client), \
         patch("solid_writer._load_owner_profile_defaults", return_value={"publisher": "", "contact_point": ""}), \
         patch("solid_writer._ensure_container"), patch("solid_writer._write_metadata_turtle"), \
         patch("solid_writer._upsert_catalog_link", return_value=None), \
         patch("solid_writer._make_public_readable") as metadata_acl, \
         patch("solid_writer._sync_linked_resource_access") as resource_acl:
        assert create_dataset(payload, allow_acl_changes=False)["status"] == "created"
    metadata_acl.assert_not_called()
    resource_acl.assert_not_called()

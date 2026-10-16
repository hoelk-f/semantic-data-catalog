from unittest.mock import patch
import pytest
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import RDF
from shacl_validation import validate_documents
from solid_writer import create_dataset, build_dataset_turtle
from solid_catalog import CatalogLoadError

DOC = "https://pod.example/alice/catalog/ds/new.ttl"
P = """@prefix dcat: <http://www.w3.org/ns/dcat#>. @prefix dct: <http://purl.org/dc/terms/>. @prefix foaf: <http://xmlns.com/foaf/0.1/>.
"""
VALID = '''<> a dcat:CatalogRecord; foaf:primaryTopic <#it>.
<#it> a dcat:Dataset; dcat:distribution <#dist>.
<#dist> a dcat:Distribution; dcat:downloadURL <https://pod.example/alice/data.json>;
 dcat:mediaType "application/json"; dct:conformsTo <https://example.org/schema.json>.'''


def check(turtle):
    with patch("requests.get", side_effect=AssertionError("Validation must not fetch data or schemas")):
        return validate_documents([{"url": DOC, "turtle": P + turtle}])


def test_complete_record_accepts_json_schema_and_optional_theme():
    assert check(VALID)["conforms"]


@pytest.mark.parametrize("turtle", [
    VALID.replace('<> a dcat:CatalogRecord; foaf:primaryTopic <#it>.', ''),
    VALID.replace('foaf:primaryTopic <#it>', 'foaf:primaryTopic <#it>, <#other>'),
    VALID.replace('<#it>', '<https://elsewhere.example/dataset>'),
    VALID.replace('<#dist>', '<https://elsewhere.example/distribution>'),
    VALID.replace('a dcat:Distribution;', ''),
    VALID.replace('dcat:downloadURL <https://pod.example/alice/data.json>', 'dcat:downloadURL <https://pod.example/alice/data.json>, <https://example.org/other>'),
    VALID.replace('<https://pod.example/alice/data.json>', '"https://pod.example/alice/data.json"'),
    VALID.replace('"application/json"', '"application/json", "text/csv"'),
    VALID.replace('"application/json"', '" "'),
    VALID.replace('; dct:conformsTo <https://example.org/schema.json>', ''),
    VALID.replace('<https://example.org/schema.json>', '"https://example.org/schema.json"'),
])
def test_normative_must_violations_are_rejected(turtle):
    assert not check(turtle)["conforms"]


def test_root_must_link_the_record_even_if_dataset_description_is_valid():
    root = "https://pod.example/alice/catalog/cat.ttl"
    documents = [{"url": root, "turtle": P + f'<> a dcat:Catalog; dcat:dataset <{DOC}#it>.'}, {"url": DOC, "turtle": P + VALID}]
    assert not validate_documents(documents)["conforms"]
    documents[0]["turtle"] += f'\n<> dcat:record <{DOC}>.'
    assert validate_documents(documents)["conforms"]


@pytest.mark.parametrize("distribution", [
    {"downloadURL": "https://pod.example/data.json", "mediaType": "application/json", "conformsTo": []},
    {"downloadURL": "https://pod.example/data.json", "mediaType": ["application/json"], "conformsTo": ["https://example.org/schema"]},
    {"downloadURL": "https://pod.example/invalid url", "mediaType": "application/json", "conformsTo": ["https://example.org/schema"]},
    "not-a-distribution", None,
])
def test_invalid_new_requests_fail_before_service_access_or_any_write(distribution):
    with patch("solid_writer.SolidServiceClient", side_effect=AssertionError("Invalid input must not reach the service client")):
        with pytest.raises(CatalogLoadError):
            create_dataset({"owner_web_id": "https://pod.example/alice/profile/card#me", "distributions": [distribution]})


def test_new_publication_preserves_nonconformant_legacy_siblings():
    from types import SimpleNamespace
    from urllib.parse import urljoin
    import requests
    root = "https://pod.example/alice/catalog/cat.ttl"
    legacy = "https://pod.example/alice/catalog/ds/legacy.ttl"
    legacy_body = P + '<#it> a dcat:Dataset; dct:title "Legacy DACE source".'
    root_body = P + f'<#it> a dcat:Catalog; dcat:dataset <{legacy}#it>; dct:title "Existing catalog".'

    class Client:
        warnings = []
        auth = SimpleNamespace(web_id="https://service.example/#me")
        def __init__(self):
            self.documents = {root: root_body, legacy: legacy_body}
            self.writes = []
        def request(self, method, url, headers=None, data=None):
            response = requests.Response()
            response.url = url
            response.headers.update({"Content-Type": "text/turtle", "ETag": '"version-1"'})
            response._content = self.documents.get(url, "").encode()
            response.status_code = 200 if url in self.documents else 404
            if method == "POST":
                target = urljoin(url, headers["Slug"])
                self.documents[target] = data.decode()
                response.headers["Location"] = target
                response.status_code = 201
                self.writes.append((method, target))
            if method == "PATCH":
                graph = Graph().parse(data=self.documents[url], publicID=url, format="turtle")
                patch_graph = Graph().parse(data=data.decode(), format="n3")
                solid = Namespace("http://www.w3.org/ns/solid/terms#")
                graph -= next(patch_graph.objects(None, solid.deletes), Graph())
                graph += next(patch_graph.objects(None, solid.inserts), Graph())
                self.documents[url] = graph.serialize(format="turtle")
                response.status_code = 204
                self.writes.append((method, url))
            return response

    client = Client()
    with patch("solid_writer.SolidServiceClient", return_value=client), \
         patch("solid_writer._load_owner_profile_defaults", return_value={"publisher": "", "contact_point": ""}), \
         patch("solid_writer._ensure_container"), patch("solid_writer._make_public_readable"), \
         patch("solid_writer._sync_linked_resource_access", return_value=[]):
        result = create_dataset({"owner_web_id": "https://pod.example/alice/profile/card#me", "identifier": "57202eba-5756-427e-bf15-94c0fa0719ff",
                                 "access_url_dataset": "https://pod.example/alice/data.json", "file_format": "application/json",
                                 "access_url_semantic_model": "https://example.org/schema.json"})
    new = result["datasetDocUrl"]
    assert validate_documents([{"url": new, "turtle": client.documents[new]}])["conforms"]
    assert client.documents[legacy] == legacy_body
    before = Graph().parse(data=root_body, publicID=root, format="turtle")
    after = Graph().parse(data=client.documents[root], publicID=root, format="turtle")
    assert all(triple in after for triple in before)
    assert client.writes == [("POST", new), ("PATCH", root)]


@pytest.mark.parametrize("literal", [
    '\"2026-10-16T10:00:00.000Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime>',
    '\"01\"^^<http://www.w3.org/2001/XMLSchema#integer>',
])
def test_patches_match_stored_lexical_forms_instead_of_rdflib_normalization(literal):
    from solid_writer import _write_metadata_turtle
    from test_profile import MetadataClient
    old = f'<{DOC}> <https://example.org/value> {literal} .'
    new = f'<{DOC}> <https://example.org/value> "changed" .'
    client = MetadataClient({DOC: old})
    _write_metadata_turtle(client, DOC, new)
    patch = client.calls[-1][2]["data"].decode()
    assert literal in patch

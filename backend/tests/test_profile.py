from unittest.mock import patch
import pytest
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import RDF
from shacl_validation import validate_documents
from solid_writer import build_dataset_turtle
from solid_catalog import CatalogLoadError, load_dataset, load_catalog, resolve_catalog_url

DCAT = Namespace("http://www.w3.org/ns/dcat#")
DCT = Namespace("http://purl.org/dc/terms/")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
ROOT = "https://example.org/alice/"
DOC = ROOT + "catalog/ds/example.ttl"
PREFIXES = """@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
"""


def payload(**changes):
    return {"title": "Example", "access_url_dataset": ROOT + "data.csv",
            "file_format": "text/csv", "access_url_semantic_model": ROOT + "model.ttl", **changes}


def build(**changes):
    return build_dataset_turtle(owner_web_id=ROOT + "profile/card#me", dataset_doc_url=DOC,
                                identifier="example", payload=payload(**changes))


def test_writer_record_distribution_model_and_optional_theme():
    ttl = build()
    graph = Graph().parse(data=ttl, publicID=DOC, format="turtle")
    assert (URIRef(DOC), RDF.type, DCAT.CatalogRecord) in graph
    assert (URIRef(DOC), FOAF.primaryTopic, URIRef(DOC + "#it")) in graph
    assert (URIRef(DOC + "#dist"), DCT.conformsTo, URIRef(ROOT + "model.ttl")) in graph
    assert not list(graph.objects(URIRef(DOC + "#it"), DCT.conformsTo))
    result = validate_documents([{"url": DOC, "turtle": ttl}])
    assert result["conforms"] and result["warnings"]
    assert result["missingDocuments"] == []


@pytest.mark.parametrize("changes", [
    {"access_url_semantic_model": ""}, {"file_format": ""},
    {"distribution_access_type": "access"}, {"access_url_dataset": ROOT + "data/"},
])
def test_new_entries_reject_missing_required_distribution_metadata(changes):
    with pytest.raises(CatalogLoadError):
        build(**changes)


def test_multiple_distributions_with_individual_models():
    distributions = [{"downloadURL": ROOT + "a.csv", "mediaType": "text/csv", "conformsTo": [ROOT + "csv.ttl"]},
                     {"downloadURL": ROOT + "a.json", "mediaType": "application/json", "conformsTo": [ROOT + "json.ttl"]}]
    ttl = build(distributions=distributions)
    graph = Graph().parse(data=ttl, publicID=DOC, format="turtle")
    with patch("solid_catalog._fetch_graph_public_or_service", return_value=graph):
        parsed = load_dataset(DOC + "#it")
    assert len(parsed["distributions"]) == 2
    assert set(parsed["semanticModels"]) == {ROOT + "csv.ttl", ROOT + "json.ttl"}


def test_legacy_model_remains_readable_but_not_profile_conformant():
    ttl = PREFIXES + '<#it> a dcat:Dataset; dct:conformsTo <model.ttl>; dcat:distribution <#dist>. <#dist> a dcat:Distribution; dcat:downloadURL <data.csv>; dcat:mediaType "text/csv".'
    graph = Graph().parse(data=ttl, publicID=DOC, format="turtle")
    with patch("solid_catalog._fetch_graph_public_or_service", return_value=graph):
        assert load_dataset(DOC + "#it")["access_url_semantic_model"].endswith("model.ttl")
    assert not validate_documents([{"url": DOC, "turtle": ttl}])["conforms"]


def test_record_only_catalog_and_new_discovery_namespace():
    profile = Graph().parse(data=f'<{ROOT}profile/card#me> <http://purl.org/sdp/terms#catalog> <{ROOT}custom.ttl#it>.', format="turtle")
    with patch("solid_catalog._fetch_graph", return_value=profile):
        assert resolve_catalog_url(web_id=ROOT + "profile/card#me") == ROOT + "custom.ttl#it"
    catalog = Graph().parse(data=PREFIXES + f'<#it> a dcat:Catalog; dcat:record <{DOC}>.', publicID=ROOT + "custom.ttl", format="turtle")
    record = Graph().parse(data=build(), format="turtle")
    with patch("solid_catalog._fetch_graph", side_effect=lambda url: catalog if url.endswith("custom.ttl") else record), patch("solid_catalog._container_dataset_urls", return_value=[]):
        assert load_catalog(catalog_url=ROOT + "custom.ttl#it")["datasets"] == [DOC + "#it"]


def test_closure_requires_referenced_metadata_but_never_data_or_models():
    root = ROOT + "catalog.ttl"
    documents = [{"url": root, "turtle": PREFIXES + f'<#it> a dcat:Catalog; dcat:record <{DOC}>.'}]
    incomplete = validate_documents(documents)
    assert incomplete["status"] == "incomplete"
    assert incomplete["missingDocuments"] == [DOC]
    documents.append({"url": DOC, "turtle": build()})
    with patch("requests.get", side_effect=AssertionError("No network during validation")):
        complete = validate_documents(documents)
    assert complete["conforms"] and complete["status"] == "conformant"


def test_series_subclass_and_bidirectional_links_do_not_recurse_shapes():
    series = ROOT + "series.ttl"
    series_ttl = PREFIXES + f'<#it> a dcat:DatasetSeries; dcat:seriesMember <{DOC}#it>; dcat:distribution <#dist>. <#dist> a dcat:Distribution; dcat:downloadURL <{ROOT}data/>; dcat:mediaType "text/turtle"; dct:conformsTo <http://www.w3.org/ns/ldp#BasicContainer>.'
    dataset_ttl = build() + f'\n<{DOC}#it> <{DCAT.inSeries}> <{series}#it>.'
    result = validate_documents([{"url": series, "turtle": series_ttl}, {"url": DOC, "turtle": dataset_ttl}])
    assert result["conforms"], result["results"]
    assert result["validatedDocuments"] == sorted([series, DOC])


def test_missing_distribution_on_series_is_violation():
    result = validate_documents([{"url": DOC, "turtle": PREFIXES + '<#it> a dcat:DatasetSeries.'}])
    assert not result["conforms"]
    assert result["status"] == "nonconformant"


class MetadataClient:
    def __init__(self, documents=None):
        self.documents = documents or {}
        self.calls = []

    def request(self, method, url, **options):
        import requests
        response = requests.Response()
        response.url = url
        response.headers["Content-Type"] = "text/turtle"
        self.calls.append((method, url, options))
        if method == "GET":
            response.status_code = 200 if url in self.documents else 404
            response._content = self.documents.get(url, "").encode()
            response.headers["ETag"] = '\"v1\"'
        elif method == "POST":
            response.status_code = 201
            response.headers["Location"] = url + options["headers"]["Slug"]
        else:
            response.status_code = 204
        return response


def test_metadata_http_creation_and_conditional_patch():
    from solid_writer import _write_metadata_turtle
    client = MetadataClient()
    ttl = build()
    _write_metadata_turtle(client, DOC, ttl, create_only=True)
    method, url, options = client.calls[-1]
    assert method == "POST" and url == ROOT + "catalog/ds/"
    assert options["headers"]["Slug"] == "example.ttl"
    client = MetadataClient({DOC: ttl})
    _write_metadata_turtle(client, DOC, ttl.replace('"Example"', '"Edited"'))
    method, url, options = client.calls[-1]
    assert method == "PATCH" and url == DOC
    assert options["headers"] == {"Content-Type": "text/n3", "If-Match": '\"v1\"'}
    patch_graph = Graph().parse(data=options["data"], format="n3")
    solid = Namespace("http://www.w3.org/ns/solid/terms#")
    deletes = next(patch_graph.objects(None, solid.deletes))
    inserts = next(patch_graph.objects(None, solid.inserts))
    original = Graph().parse(data=ttl, format="turtle")
    assert all(triple in original for triple in deletes)
    original -= deletes
    original += inserts
    assert str(next(original.objects(URIRef(DOC + "#it"), DCT.title))) == "Edited"


def test_acl_creation_keeps_auxiliary_resource_put_semantics():
    from solid_writer import _make_public_readable
    client = MetadataClient()
    assert _make_public_readable(client, resource_url=DOC, owner_web_id=ROOT + "profile/card#me") is None
    assert [(method, url) for method, url, _ in client.calls] == [("GET", DOC + ".acl"), ("PUT", DOC + ".acl")]


def test_inaccessible_record_is_reported_without_hiding_readable_entries():
    catalog = Graph().parse(data=PREFIXES + f'<#it> a dcat:Catalog; dcat:dataset <{DOC}#it>; dcat:record <{ROOT}private-record.ttl>.', format="turtle", publicID=ROOT + "catalog.ttl")
    def fetch(url):
        if url == ROOT + "catalog.ttl":
            return catalog
        raise CatalogLoadError("Forbidden", 403)
    with patch("solid_catalog._fetch_graph", side_effect=fetch), patch("solid_catalog._container_dataset_urls", return_value=[]):
        result = load_catalog(catalog_url=ROOT + "catalog.ttl#it")
    assert result["datasets"] == [DOC + "#it"]
    assert result["errors"][0]["status"] == 403


def test_exhausted_validation_limits_report_incomplete():
    bundle = [{"url": ROOT + f"{i}.ttl", "turtle": PREFIXES + "<> a dcat:Catalog."} for i in range(257)]
    result = validate_documents(bundle)
    assert result["status"] == "incomplete" and not result["conforms"]
    assert "256 documents" in result["results"]

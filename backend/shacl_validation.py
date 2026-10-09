"""Validate an explicitly supplied metadata closure; never dereference data/model URLs."""
from pathlib import Path
from urllib.parse import urldefrag
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import RDF, RDFS
from pyshacl import validate

DCAT = Namespace("http://www.w3.org/ns/dcat#")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
SH = Namespace("http://www.w3.org/ns/shacl#")
LINKS = (DCAT.record, DCAT.dataset, FOAF.primaryTopic, DCAT.distribution, DCAT.inSeries, DCAT.seriesMember)
CLASSES = (DCAT.Catalog, DCAT.CatalogRecord, DCAT.Dataset, DCAT.DatasetSeries, DCAT.Distribution)
MAX_DOCUMENTS = 256
MAX_BYTES = 16_000_000
MAX_TRIPLES = 200_000


def _incomplete(message, included=()):
    return {"conforms": False, "status": "incomplete", "results": message,
            "warnings": [], "missingDocuments": [], "validatedDocuments": sorted(included)}


def validate_documents(documents, *, root_url=None):
    if not documents:
        raise ValueError("Supply at least one metadata document.")
    if len(documents) > MAX_DOCUMENTS:
        return _incomplete("Metadata validation bundle exceeds 256 documents.")
    if sum(len(item["turtle"].encode("utf-8")) for item in documents) > MAX_BYTES:
        return _incomplete("Metadata validation bundle exceeds 16 MB.")
    sources = {}
    for item in documents:
        url = urldefrag(item["url"])[0]
        if url in sources:
            raise ValueError("Duplicate metadata document URL.")
        sources[url] = Graph().parse(data=item["turtle"], publicID=url, format="turtle")
    roots = [root_url] if root_url else [documents[0]["url"]]
    pending = list(roots)
    graph = Graph()
    included = set()
    missing = set()
    while pending:
        url = urldefrag(str(pending.pop()))[0]
        if url in included or url in missing:
            continue
        if url not in sources:
            missing.add(url)
            continue
        included.add(url)
        source = sources[url]
        graph += source
        if len(graph) > MAX_TRIPLES:
            return _incomplete("Metadata validation bundle exceeds 200000 triples.", included)
        for predicate in LINKS:
            for target in source.objects(None, predicate):
                if not isinstance(target, URIRef):
                    continue
                # Inline descriptions do not need a separate HTTP document.
                if any(source.triples((target, None, None))):
                    continue
                pending.append(str(target))
    # A fixed local entailment rule, without remote vocabularies, imports or
    # domain/range inference that might accidentally type ACLs as datasets.
    graph.add((DCAT.DatasetSeries, RDFS.subClassOf, DCAT.Dataset))
    shapes = Graph().parse(Path(__file__).parent / "shapes" / "solid-dcat-profile.ttl", format="turtle")
    conforms, report, results = validate(data_graph=graph, shacl_graph=shapes,
                                        inference="none", allow_warnings=True, do_owl_imports=False)
    warnings = [str(value) for result in report.subjects(SH.resultSeverity, SH.Warning)
                for value in report.objects(result, SH.resultMessage)]
    recognized = any(any(graph.subjects(RDF.type, cls)) for cls in CLASSES)
    return {
        "conforms": bool(conforms and not missing and recognized),
        "status": "incomplete" if missing else "conformant" if conforms and recognized else "nonconformant",
        "results": results if recognized else "No Solid DCAT profile resource found.",
        "warnings": warnings,
        "missingDocuments": sorted(missing),
        "validatedDocuments": sorted(included),
    }


def validate_turtle(ttl_data, base_uri=None):
    result = validate_documents([{"url": base_uri or "https://validation.invalid/record.ttl", "turtle": ttl_data}])
    details = result["results"]
    if result["missingDocuments"]:
        details += "\nIncomplete metadata closure: " + ", ".join(result["missingDocuments"])
    return result["conforms"], details

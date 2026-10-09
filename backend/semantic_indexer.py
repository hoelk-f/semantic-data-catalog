"""Run one indexer per instance: python -m semantic_indexer [--once]."""
import argparse
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone

from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import RDF, DCTERMS

from semantic_fetch import FetchError, PublicRdfFetcher, document_url
from semantic_search import INDEX_GRAPH, SEARCH, FusekiStore, Settings

DCAT = Namespace("http://www.w3.org/ns/dcat#")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
LDP = Namespace("http://www.w3.org/ns/ldp#")
SDP = Namespace("http://purl.org/sdp/terms#")
LEGACY_SDP = Namespace("https://w3id.org/solid-dcat-profile#")
PIM = Namespace("http://www.w3.org/ns/pim/space#")


class Indexer:
    def __init__(self, settings, store=None, fetcher=None):
        if not settings.configured:
            raise ValueError("Set CATALOG_DATASPACE_ID, CATALOG_REGISTRY_URL and CATALOG_FUSEKI_URL.")
        self.settings = settings
        self.store = store or FusekiStore(settings)
        self.fetcher = fetcher or PublicRdfFetcher()

    def build(self):
        self.fetcher.begin()
        fetched = {}
        attempted = set()
        failures = {}
        source_bytes = 0
        graphs = {INDEX_GRAPH: Graph()}
        manifest = graphs[INDEX_GRAPH]
        errors = []
        datasets = set()
        models = set()

        def read(url):
            nonlocal source_bytes
            url = document_url(url)
            if url not in fetched:
                if url in failures:
                    raise failures[url]
                if len(attempted) >= self.settings.max_documents:
                    raise FetchError("Document limit reached.")
                if source_bytes >= self.settings.max_source_bytes:
                    raise FetchError("Source byte limit reached.")
                if url in attempted:
                    raise FetchError("Public source was unavailable in this pass.")
                attempted.add(url)
                try:
                    document = self.fetcher.get(url)
                except FetchError as error:
                    failures[url] = error
                    raise
                source_bytes += document.byte_count
                if source_bytes > self.settings.max_source_bytes:
                    raise FetchError("Source byte limit reached.")
                fetched[url] = document
            return fetched[url]

        def keep(url, doc):
            name = URIRef(document_url(url))
            if name not in graphs:
                if sum(len(g) for g in graphs.values()) + len(doc.graph) > self.settings.max_triples:
                    raise FetchError("Triple limit reached.")
                graphs[name] = doc.graph
                manifest.add((name, DCTERMS.source, name))
                manifest.add((name, SEARCH.digest, Literal(doc.digest)))
            return name

        def issue(url, error):
            entry = {"source": str(url), "message": str(error)[:200]}
            if entry not in errors:
                errors.append(entry)

        # Failure at the membership boundary is fatal. Never infer departures from
        # a partial registry listing or an unreadable membership document.
        registry = self.settings.registry_url
        registry_graph = read(registry).graph
        members = set(registry_graph.objects(None, FOAF.member))
        for child in registry_graph.objects(URIRef(registry), LDP.contains):
            child_url = document_url(child)
            if not child_url.startswith(registry) or child_url.endswith("/"):
                raise FetchError("Unexpected registry membership document.")
            members.update(read(child_url).graph.objects(None, FOAF.member))
        members = {member for member in members if isinstance(member, URIRef)}

        for member in sorted(members):
            try:
                profile = read(member).graph
                catalogs = set(profile.objects(member, SDP.catalog)) | set(profile.objects(member, LEGACY_SDP.catalog)) | set(profile.objects(member, DCAT.catalog))
                if not catalogs:
                    roots = list(profile.objects(member, PIM.storage))
                    root = str(roots[0]) if roots else str(member).split("/profile/", 1)[0] + "/"
                    catalogs = {URIRef(root.rstrip("/") + "/catalog/cat.ttl#it")}
                for catalog in sorted(catalogs):
                    try:
                        doc = read(catalog)
                        catalog_graph = keep(catalog, doc)
                        subjects = set(doc.graph.subjects(RDF.type, DCAT.Catalog)) | {catalog}
                        pending = set()
                        for subject in subjects:
                            pending.update(doc.graph.objects(subject, DCAT.dataset))
                            pending.update(doc.graph.objects(subject, DCAT.record))
                            pending.update(doc.graph.objects(subject, DCAT.datasetSeries))
                        visited = set()
                        while pending:
                            dataset = pending.pop()
                            if not isinstance(dataset, URIRef) or dataset in visited:
                                continue
                            visited.add(dataset)
                            try:
                                metadata = read(dataset)
                                graph_name = keep(dataset, metadata)
                                if (dataset, RDF.type, DCAT.CatalogRecord) in metadata.graph:
                                    pending.update(metadata.graph.objects(dataset, FOAF.primaryTopic))
                                    continue
                                if not any((dataset, RDF.type, cls) in metadata.graph for cls in (DCAT.Dataset, DCAT.DatasetSeries)):
                                    continue
                                datasets.add(dataset)
                                manifest.add((dataset, SEARCH.metadataGraph, graph_name))
                                manifest.add((dataset, SEARCH.catalogGraph, catalog_graph))
                                manifest.add((dataset, SEARCH.owner, member))
                                manifest.add((dataset, SEARCH.registry, URIRef(registry)))
                                pending.update(metadata.graph.objects(dataset, DCAT.seriesMember))
                                model_urls = set(metadata.graph.objects(dataset, DCTERMS.conformsTo)) | set(metadata.graph.objects(dataset, DCAT.conformsTo))
                                for distribution in metadata.graph.objects(dataset, DCAT.distribution):
                                    distribution_graph = metadata.graph
                                    if isinstance(distribution, URIRef) and not any(metadata.graph.triples((distribution, None, None))):
                                        distribution_doc = read(distribution)
                                        keep(distribution, distribution_doc)
                                        distribution_graph = distribution_doc.graph
                                    model_urls.update(distribution_graph.objects(distribution, DCTERMS.conformsTo))
                                for model in model_urls:
                                    if not isinstance(model, URIRef):
                                        continue
                                    manifest.add((dataset, SEARCH.model, model))
                                    if not str(model).startswith(("http://", "https://")):
                                        continue
                                    try:
                                        model_doc = read(model)
                                        model_graph = keep(model, model_doc)
                                        models.add(model_graph)
                                        manifest.add((dataset, SEARCH.modelGraph, model_graph))
                                        manifest.add((dataset, SEARCH.model, model))
                                    except FetchError as error:
                                        # conformsTo may name a JSON Schema or a specification;
                                        # only RDF models contribute a searchable model graph.
                                        if getattr(error, "kind", "") != "non-rdf":
                                            issue(model, error)
                            except FetchError as error:
                                issue(dataset, error)
                    except FetchError as error:
                        issue(catalog, error)
            except FetchError as error:
                issue(member, error)

        now = datetime.now(timezone.utc)
        state = {
            "dataspaceId": self.settings.dataspace_id, "registryUrl": registry,
            "status": "partial" if errors else "ready", "revision": str(uuid.uuid4()),
            "checkedAt": now.isoformat(), "expiresAt": (now + timedelta(seconds=self.settings.max_age)).isoformat(),
            "memberCount": len(members), "datasetCount": len(datasets), "modelCount": len(models),
            "tripleCount": sum(len(graph) for graph in graphs.values()),
            "errorCount": len(errors), "errors": errors[:100],
        }
        self.fetcher.finish()
        return graphs, state

    def run_once(self):
        graphs, state = self.build()
        self.store.publish(graphs, state)
        return state


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = Settings.from_env()
    indexer = Indexer(settings)
    while True:
        try:
            state = indexer.run_once()
            logging.info("Index %s: %s datasets, %s models, %s errors", settings.dataspace_id,
                         state["datasetCount"], state["modelCount"], state["errorCount"])
        except Exception:
            logging.exception("Index refresh failed; previous snapshot expires automatically")
            if args.once:
                raise
        if args.once:
            return
        time.sleep(settings.interval)


if __name__ == "__main__":
    main()

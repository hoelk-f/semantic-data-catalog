"""Normative document rules from the profile's index.html, beyond SHACL.

Only supplied metadata is inspected. Data files, models and remote ontologies
are never fetched by validation. A record can be checked before publication;
when a catalog is supplied, its record links are checked as well.
"""
import re
from urllib.parse import urldefrag, urlsplit, parse_qs
from rdflib import Literal, Namespace, URIRef
from rdflib.namespace import RDF

DCAT = Namespace("http://www.w3.org/ns/dcat#")
DCT = Namespace("http://purl.org/dc/terms/")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")


def absolute_iri(value):
    return isinstance(value, URIRef) and bool(re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", str(value))) and not re.search(r'[<>"{}|^`\\\s]', str(value))


def secondary_resource(value, document):
    return absolute_iri(value) and str(value).startswith(document + "#") and bool(urlsplit(str(value)).fragment)


def document_violations(sources):
    errors = []
    for document, graph in sources.items():
        doc = URIRef(document)
        datasets = set(graph.subjects(RDF.type, DCAT.Dataset)) | set(graph.subjects(RDF.type, DCAT.DatasetSeries))
        services = set(graph.subjects(RDF.type, DCAT.DataService))
        records = set(graph.subjects(RDF.type, DCAT.CatalogRecord))
        distributions = set(graph.subjects(RDF.type, DCAT.Distribution))
        if (datasets or distributions or services) and doc not in records:
            errors.append(f"{document}: the document must be a dcat:CatalogRecord.")
        for record in records:
            if record != doc:
                errors.append(f"{record}: a CatalogRecord must identify its own document without a fragment.")
            topics = list(graph.objects(record, FOAF.primaryTopic))
            if len(topics) != 1 or topics[0] not in datasets | services or not secondary_resource(topics[0], document):
                errors.append(f"{record}: foaf:primaryTopic must identify exactly one Dataset/Series secondary resource of this record document.")
        for service in services:
            profile = URIRef("https://github.com/hoelk-f/semantic-data-catalog/blob/main/docs/data-service-profile-v1.md")
            if len(services) != 1 or datasets or not secondary_resource(service, document) or (doc, FOAF.primaryTopic, service) not in graph or (doc, DCT.conformsTo, profile) not in graph:
                errors.append(f"{service}: API records must declare the service extension and describe exactly one local primary DataService.")
            for predicate in (DCT.title, DCT.description, DCT.publisher):
                values = list(graph.objects(service, predicate))
                if len(values) != 1 or not str(values[0]).strip():
                    errors.append(f"{service}: API title, description and publisher are required.")
            auth = list(graph.objects(service, URIRef("https://w3id.org/solid-dataspace/catalog-api#authentication")))
            if len(auth) != 1 or str(auth[0]) not in ("public", "api-key", "oauth2", "solid-oidc"):
                errors.append(f"{service}: unsupported API authentication method.")
            for predicate in (DCAT.endpointURL, DCAT.endpointDescription, DCAT.servesDataset):
                for value in graph.objects(service, predicate):
                    try:
                        target = urlsplit(str(value))
                        secret = any(re.search(r"(?:^|[-_])(token|key|secret|password|signature|authorization)(?:$|[-_])|^(apikey|accesskey|auth)$", key, re.I) for key in parse_qs(target.query))
                        valid = absolute_iri(value) and target.scheme == "https" and target.hostname and not target.username and not target.password and not secret and (predicate != DCAT.endpointURL or not target.fragment)
                    except ValueError:
                        valid = False
                    if not valid:
                        errors.append(f"{service}: API links require HTTPS without credentials.")
            if list(graph.objects(service, DCAT.distribution)):
                errors.append(f"{service}: services link datasets through servesDataset.")
        for dataset in datasets:
            if not secondary_resource(dataset, document) or (doc, FOAF.primaryTopic, dataset) not in graph:
                errors.append(f"{dataset}: Dataset/Series must be the primary topic and a secondary resource of its record document.")
            for distribution in graph.objects(dataset, DCAT.distribution):
                if not secondary_resource(distribution, document) or distribution not in distributions:
                    errors.append(f"{dataset}: every distribution must be a typed secondary resource of the same record document.")
        for distribution in distributions:
            if not secondary_resource(distribution, document) or not any((dataset, DCAT.distribution, distribution) in graph for dataset in datasets):
                errors.append(f"{distribution}: Distribution must be linked by the record's Dataset/Series and have a local fragment IRI.")
            for value in graph.objects(distribution, DCAT.downloadURL):
                if not absolute_iri(value):
                    errors.append(f"{distribution}: downloadURL must be an absolute IRI.")
            for value in graph.objects(distribution, DCAT.mediaType):
                if not isinstance(value, (Literal, URIRef)) or not str(value).strip() or isinstance(value, URIRef) and not absolute_iri(value):
                    errors.append(f"{distribution}: mediaType must be a nonempty media type or IRI.")
            for value in graph.objects(distribution, DCT.conformsTo):
                if not absolute_iri(value):
                    errors.append(f"{distribution}: conformsTo must reference a model/schema/ontology/view/profile by absolute IRI.")
        for catalog in graph.subjects(RDF.type, DCAT.Catalog):
            for dataset in list(graph.objects(catalog, DCAT.dataset)) + list(graph.objects(catalog, DCAT.service)):
                if not absolute_iri(dataset) or (catalog, DCAT.record, URIRef(urldefrag(str(dataset))[0])) not in graph:
                    errors.append(f"{catalog}: every cataloged dataset must also be linked through its CatalogRecord document via dcat:record.")
            for record in graph.objects(catalog, DCAT.record):
                if not absolute_iri(record) or urlsplit(str(record)).fragment:
                    errors.append(f"{catalog}: dcat:record must link a document IRI without a fragment.")
    return sorted(set(errors))

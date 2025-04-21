from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, DCTERMS, FOAF, XSD
import uuid
import requests
from requests.auth import HTTPBasicAuth

# DCAT und andere Namespaces
DCAT = Namespace("http://www.w3.org/ns/dcat#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
EX = Namespace("https://catalog.gesundes-tal.de/id/")

def create_catalog(graph: Graph, catalog_uri: URIRef, title: str, description: str, publisher_uri: URIRef):
    graph.add((catalog_uri, RDF.type, DCAT.Catalog))
    graph.add((catalog_uri, DCTERMS.title, Literal(title, lang="de")))
    graph.add((catalog_uri, DCTERMS.description, Literal(description, lang="de")))
    graph.add((catalog_uri, DCTERMS.publisher, publisher_uri))
    return catalog_uri

def create_dataset(graph: Graph, dataset_uri: URIRef, title: str, description: str, issued: str, publisher_uri: URIRef):
    graph.add((dataset_uri, RDF.type, DCAT.Dataset))
    graph.add((dataset_uri, DCTERMS.title, Literal(title, lang="de")))
    graph.add((dataset_uri, DCTERMS.description, Literal(description, lang="de")))
    graph.add((dataset_uri, DCTERMS.issued, Literal(issued, datatype=XSD.date)))
    graph.add((dataset_uri, DCTERMS.publisher, publisher_uri))
    return dataset_uri

# Beispiel-Nutzung
if __name__ == "__main__":
    g = Graph()
    g.bind("dcat", DCAT)
    g.bind("dct", DCTERMS)
    g.bind("foaf", FOAF)
    g.bind("vcard", VCARD)
    g.bind("ex", EX)

    catalog_uri = URIRef(EX["catalog"])
    publisher_uri = URIRef(EX["publisher"])

    # Dummy-Publisher (minimal)
    g.add((publisher_uri, RDF.type, FOAF.Agent))
    g.add((publisher_uri, FOAF.name, Literal("Meine Organisation")))

    # Katalog erstellen
    create_catalog(g, catalog_uri, "Mein DCAT-Katalog", "Beispielbeschreibung", publisher_uri)

    # Dataset erstellen und zum Katalog hinzufügen
    dataset_uri = URIRef(EX[f"dataset-{uuid.uuid4()}"])
    create_dataset(g, dataset_uri, "Beispieldatensatz", "Beschreibung des Datensatzes", "2023-01-01", publisher_uri)
    g.add((catalog_uri, DCAT.dataset, dataset_uri))

    # Ausgabe als Turtle
    print(g.serialize(format="turtle"))

    # Fuseki-Upload-Ziel
    fuseki_url = "http://localhost:3030/mydataset/data"
    headers = {"Content-Type": "text/turtle"}
    auth = HTTPBasicAuth("admin", "admin")

    # Triple Store leeren
    update_url = "http://localhost:3030/mydataset/update"
    delete_query = "DELETE WHERE { ?s ?p ?o }"
    clear_res = requests.post(update_url, data={"update": delete_query}, auth=auth)
    if clear_res.status_code in [200, 204]:
        print("Triple Store wurde geleert.")
    else:
        print(f"Fehler beim Leeren des Triple Stores: {clear_res.status_code}")
        print(clear_res.text)

    # RDF-Graph serialisieren und senden
    rdf_data = g.serialize(format="turtle")
    response = requests.post(
        fuseki_url,
        data=rdf_data.encode("utf-8"),
        headers=headers,
        auth=auth
    )

    if response.status_code in [200, 201, 204]:
        print("RDF erfolgreich in Fuseki geladen.")
    else:
        print(f"Fehler beim Upload: {response.status_code}")
        print(response.text)
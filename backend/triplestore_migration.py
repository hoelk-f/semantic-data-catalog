import mysql.connector
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, DCTERMS, FOAF, XSD
import requests
import os
from requests.auth import HTTPBasicAuth

DCAT = Namespace("http://www.w3.org/ns/dcat#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
EX = Namespace(f"{BASE_URI}/id/")

FUSEKI_DATA_URL = "http://fuseki:3030/semantic_data_catalog/data"
FUSEKI_UPDATE_URL = "http://fuseki:3030/semantic_data_catalog/update"
AUTH = HTTPBasicAuth("admin", "admin")


def reset_triplestore():
    delete_named_graphs_query = "DELETE WHERE { GRAPH ?g { ?s ?p ?o } }"
    res1 = requests.post(FUSEKI_UPDATE_URL, data={"update": delete_named_graphs_query}, auth=AUTH)

    delete_default_query = "DELETE WHERE { ?s ?p ?o }"
    res2 = requests.post(FUSEKI_UPDATE_URL, data={"update": delete_default_query}, auth=AUTH)

    if res1.status_code not in [200, 204] or res2.status_code not in [200, 204]:
        raise Exception(f"Failed to clear Fuseki: {res1.status_code}/{res2.status_code}")
    
    print("Fuseki completely emptied.")


def upload_named_graph(graph: Graph, graph_uri: str):
    res = requests.post(
        FUSEKI_DATA_URL,
        headers={"Content-Type": "text/turtle"},
        params={"graph": graph_uri},
        data=graph.serialize(format="turtle"),
        auth=AUTH
    )
    if res.status_code not in [200, 201, 204]:
        raise Exception(f"Upload failed for {graph_uri}: {res.status_code} - {res.text}")


def migrate_to_fuseki():
    conn = mysql.connector.connect(
        host="db",
        user="root",
        password="8ED4iwZwPcwKPc",
        database="semantic_data_catalog"
    )
    cursor = conn.cursor(dictionary=True)

    catalog_graph = Graph()
    catalog_graph.bind("dcat", DCAT)
    catalog_graph.bind("dct", DCTERMS)
    catalog_graph.bind("foaf", FOAF)
    catalog_graph.bind("vcard", VCARD)

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    catalog_uri = URIRef(f"{BASE_URI}/catalog")

    cursor.execute("SELECT * FROM catalogs")
    catalogs = cursor.fetchall()

    for catalog in catalogs:
        catalog_graph.add((catalog_uri, RDF.type, DCAT.Catalog))
        catalog_graph.add((catalog_uri, DCTERMS.title, Literal(catalog["title"], lang="en")))
        if catalog["description"]:
            catalog_graph.add((catalog_uri, DCTERMS.description, Literal(catalog["description"], lang="en")))
        catalog_graph.add((catalog_uri, DCTERMS.issued, Literal(catalog["issued"].isoformat(), datatype=XSD.dateTime)))
        catalog_graph.add((catalog_uri, DCTERMS.modified, Literal(catalog["modified"].isoformat(), datatype=XSD.dateTime)))

        cursor.execute("SELECT * FROM datasets WHERE catalog_id = %s", (catalog["id"],))
        datasets = cursor.fetchall()

        for ds in datasets:
            dataset_graph = Graph()
            dataset_graph.bind("dcat", DCAT)
            dataset_graph.bind("dct", DCTERMS)
            dataset_graph.bind("foaf", FOAF)
            dataset_graph.bind("vcard", VCARD)

            BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
            dataset_uri = URIRef(f"{BASE_URI}/id/{ds['identifier']}")
            publisher_uri = URIRef(f"{dataset_uri}/publisher")
            distribution_uri = URIRef(f"{dataset_uri}/distribution")
            contact_uri = URIRef(f"{dataset_uri}/contact")

            dataset_graph.add((dataset_uri, RDF.type, DCAT.Dataset))
            dataset_graph.add((dataset_uri, DCTERMS.title, Literal(ds["title"], lang="en")))
            if ds["description"]:
                dataset_graph.add((dataset_uri, DCTERMS.description, Literal(ds["description"], lang="en")))
            dataset_graph.add((dataset_uri, DCTERMS.issued, Literal(ds["issued"].isoformat(), datatype=XSD.dateTime)))
            dataset_graph.add((dataset_uri, DCTERMS.modified, Literal(ds["modified"].isoformat(), datatype=XSD.dateTime)))
            dataset_graph.add((dataset_uri, DCTERMS.publisher, publisher_uri))

            dataset_graph.add((publisher_uri, RDF.type, FOAF.Agent))
            dataset_graph.add((publisher_uri, FOAF.name, Literal(ds["publisher"])))

            dataset_graph.add((contact_uri, RDF.type, VCARD.Kind))
            dataset_graph.add((contact_uri, VCARD.fn, Literal(ds["contact_point"])))
            dataset_graph.add((dataset_uri, DCAT.contactPoint, contact_uri))

            if ds["theme"]:
                dataset_graph.add((dataset_uri, DCAT.theme, Literal(ds["theme"])))

            if ds["access_url_dataset"]:
                dataset_graph.add((distribution_uri, RDF.type, DCAT.Distribution))
                dataset_graph.add((distribution_uri, DCAT.accessURL, URIRef(ds["access_url_dataset"])))
                if ds["file_format"]:
                    dataset_graph.add((distribution_uri, DCTERMS.format, Literal(ds["file_format"])))
                dataset_graph.add((dataset_uri, DCAT.distribution, distribution_uri))

            if ds["access_url_semantic_model"]:
                dataset_graph.add((dataset_uri, DCAT.hasPart, URIRef(ds["access_url_semantic_model"])))

            if ds["webid"]:
                dataset_graph.add((dataset_uri, FOAF.isPrimaryTopicOf, URIRef(ds["webid"])))

            if ds["semantic_model_file"]:
                try:
                    ttl_data = ds["semantic_model_file"].decode("utf-8")
                    ttl_graph = Graph()
                    ttl_graph.parse(data=ttl_data, format="turtle")
                    for triple in ttl_graph:
                        dataset_graph.add(triple)
                except Exception as e:
                    print(f"Error while parsing TTL for {ds['identifier']}: {e}")

            upload_named_graph(dataset_graph, graph_uri=str(dataset_uri))

            catalog_graph.add((catalog_uri, DCAT.dataset, dataset_uri))

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    upload_named_graph(catalog_graph, graph_uri=f"{BASE_URI}/catalog")

    print("Migration completed.")
    cursor.close()
    conn.close()

def ensure_fuseki_dataset_exists():
    admin_url = "http://fuseki:3030/$/datasets"
    dataset_name = "semantic_data_catalog"
    auth = HTTPBasicAuth("admin", "admin")

    try:
        res = requests.get(admin_url, auth=auth, headers={"Accept": "application/json"})
        res.raise_for_status()

        datasets = res.json().get("datasets", [])
        dataset_names = [d.get("ds.name", "").strip("/") for d in datasets]

        if dataset_name in dataset_names:
            print(f"Fuseki dataset '{dataset_name}' already exists.")
            return

        print(f"Fuseki dataset '{dataset_name}' not found. Creating...")
        res = requests.post(
            admin_url,
            data={"dbName": dataset_name, "dbType": "tdb2"},
            auth=auth
        )
        if res.status_code not in [200, 201, 202]:
            raise RuntimeError(f"Failed to create Fuseki dataset: {res.status_code} – {res.text}")
        print(f"Fuseki dataset '{dataset_name}' created.")
    
    except Exception as e:
        raise RuntimeError(f"Error ensuring Fuseki dataset: {e}")
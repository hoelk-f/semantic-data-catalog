import mysql.connector
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, DCTERMS, FOAF, XSD
import uuid, requests
from requests.auth import HTTPBasicAuth

def migrate_to_fuseki():
    # Namespaces
    DCAT = Namespace("http://www.w3.org/ns/dcat#")
    VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
    EX = Namespace("https://catalog.gesundes-tal.de/id/")

    # RDF-Graph initialisieren
    g = Graph()
    g.bind("dcat", DCAT)
    g.bind("dct", DCTERMS)
    g.bind("foaf", FOAF)
    g.bind("vcard", VCARD)
    g.bind("ex", EX)

    # MariaDB-Verbindung
    conn = mysql.connector.connect(
        host="db",
        user="root",
        password="8ED4iwZwPcwKPc",
        database="semantic_data_catalog"
    )
    cursor = conn.cursor(dictionary=True)

    # Kataloge abfragen
    cursor.execute("SELECT * FROM catalogs")
    catalogs = cursor.fetchall()

    for catalog in catalogs:
        catalog_id = catalog["id"]
        catalog_uri = URIRef(EX[f"catalog-{catalog_id}"])
        publisher_uri = URIRef(EX[f"publisher-{catalog_id}"])

        g.add((catalog_uri, RDF.type, DCAT.Catalog))
        g.add((catalog_uri, DCTERMS.title, Literal(catalog["title"], lang="en")))
        if catalog["description"]:
            g.add((catalog_uri, DCTERMS.description, Literal(catalog["description"], lang="en")))
        g.add((catalog_uri, DCTERMS.issued, Literal(catalog["issued"].isoformat(), datatype=XSD.dateTime)))
        g.add((catalog_uri, DCTERMS.modified, Literal(catalog["modified"].isoformat(), datatype=XSD.dateTime)))

        g.add((publisher_uri, RDF.type, FOAF.Agent))
        g.add((publisher_uri, FOAF.name, Literal(f"Publisher {catalog_id}")))
        g.add((catalog_uri, DCTERMS.publisher, publisher_uri))

        # Datasets abfragen
        cursor.execute("SELECT * FROM datasets WHERE catalog_id = %s", (catalog_id,))
        datasets = cursor.fetchall()

        for ds in datasets:
            dataset_uri = URIRef(EX[f"dataset-{ds['identifier']}"])
            g.add((dataset_uri, RDF.type, DCAT.Dataset))
            g.add((dataset_uri, DCTERMS.title, Literal(ds["title"], lang="en")))
            if ds["description"]:
                g.add((dataset_uri, DCTERMS.description, Literal(ds["description"], lang="en")))
            g.add((dataset_uri, DCTERMS.issued, Literal(ds["issued"].isoformat(), datatype=XSD.dateTime)))
            g.add((dataset_uri, DCTERMS.modified, Literal(ds["modified"].isoformat(), datatype=XSD.dateTime)))
            g.add((dataset_uri, DCTERMS.publisher, Literal(ds["publisher"])))
            g.add((catalog_uri, DCAT.dataset, dataset_uri))

            if ds["theme"]:
                g.add((dataset_uri, DCAT.theme, Literal(ds["theme"])))

            if ds["access_url_dataset"]:
                distribution_uri = URIRef(EX[f"distribution-{uuid.uuid4()}"])
                g.add((distribution_uri, RDF.type, DCAT.Distribution))
                g.add((distribution_uri, DCAT.accessURL, URIRef(ds["access_url_dataset"])))
                if ds["file_format"]:
                    g.add((distribution_uri, DCTERMS.format, Literal(ds["file_format"])))
                g.add((dataset_uri, DCAT.distribution, distribution_uri))

            if ds["contact_point"]:
                contact_uri = URIRef(EX[f"contact-{uuid.uuid4()}"])
                g.add((contact_uri, RDF.type, VCARD.Kind))
                g.add((contact_uri, VCARD.fn, Literal(ds["contact_point"])))
                g.add((dataset_uri, DCAT.contactPoint, contact_uri))

            if ds["webid"]:
                g.add((dataset_uri, FOAF.isPrimaryTopicOf, URIRef(ds["webid"])))

            if ds["semantic_model_file"]:
                try:
                    ttl_data = ds["semantic_model_file"].decode("utf-8")
                    ttl_graph = Graph()
                    ttl_graph.parse(data=ttl_data, format="turtle")
                    for triple in ttl_graph:
                        g.add(triple)
                except Exception as e:
                    print(f"Fehler beim Parsen von TTL für {ds['identifier']}: {e}")

    # Triple Store vorher leeren
    update_url = "http://fuseki:3030/semantic_data_catalog/update"
    delete_query = "DELETE WHERE { ?s ?p ?o }"

    clear_res = requests.post(
        update_url,
        data={"update": delete_query},
        auth=HTTPBasicAuth("admin", "admin")
    )

    if clear_res.status_code in [200, 204]:
        print("Triple Store wurde erfolgreich geleert.")
    else:
        print(f"Fehler beim Leeren des Triple Stores: {clear_res.status_code}")
        print(clear_res.text)

    # Fuseki-Upload
    fuseki_url = "http://fuseki:3030/semantic_data_catalog/data"
    headers = {"Content-Type": "text/turtle"}
    rdf_data = g.serialize(format="turtle")

    res = requests.post(fuseki_url, data=rdf_data.encode("utf-8"), headers=headers, auth=HTTPBasicAuth("admin", "admin"))
    if res.status_code in [200, 201, 204]:
        print("RDF erfolgreich nach Fuseki geladen.")
    else:
        print(f"Fehler beim Upload: {res.status_code}")
        print(res.text)

    cursor.close()
    conn.close()

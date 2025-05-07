import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime

FUSEKI_URL = "http://fuseki:3030/semantic_data_catalog/data"
AUTH = HTTPBasicAuth("admin", "admin")

def generate_dcat_dataset_ttl(dataset: dict) -> str:
    issued = dataset["issued"].isoformat() if isinstance(dataset["issued"], datetime) else dataset["issued"]
    modified = dataset["modified"].isoformat() if isinstance(dataset["modified"], datetime) else dataset["modified"]
    identifier = dataset["identifier"]
    dataset_uri = f"https://catalog.gesundes-tal.de/id/{identifier}"
    distribution_uri = f"{dataset_uri}/distribution"
    publisher_uri = f"{dataset_uri}/publisher"

    return f"""@prefix dcat: <http://www.w3.org/ns/dcat#> .
        @prefix dct: <http://purl.org/dc/terms/> .
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
        @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .

        <{dataset_uri}> a dcat:Dataset ;
            dct:title "{dataset['title']}"@en  ;
            dct:description "{dataset.get('description', '')}" ;
            dct:issued "{issued}"^^xsd:dateTime ;
            dct:modified "{modified}"^^xsd:dateTime ;
            dct:publisher <{publisher_uri}> ;
            dcat:theme "{dataset.get('theme', '')}" ;
            dcat:distribution <{distribution_uri}> ;
            dcat:hasPart <{dataset['access_url_semantic_model']}> .

        <{distribution_uri}> a dcat:Distribution ;
            dcat:accessURL <{dataset['access_url_dataset']}> ;
            dcat:mediaType "{dataset.get('file_format', 'application/octet-stream')}" .

        <{publisher_uri}> a foaf:Agent ;
            foaf:name "{dataset['publisher']}" ;
            vcard:hasEmail <mailto:{dataset['contact_point']}> .
        """

def delete_named_graph(graph_uri: str):
    res = requests.delete(
        "http://fuseki:3030/semantic_data_catalog/data",
        params={"graph": graph_uri},
        auth=HTTPBasicAuth("admin", "admin")
    )
    if res.status_code not in [200, 204]:
        raise Exception(f"Failed to delete named graph {graph_uri}: {res.status_code} – {res.text}")

def insert_dataset_rdf(ttl_data: bytes, graph_uri: str):
    """
    Insert RDF data into the Fuseki triple store under the given graph URI.
    """
    headers = {"Content-Type": "text/turtle"}
    params = {"graph": graph_uri}

    response = requests.post(
        FUSEKI_URL,
        headers=headers,
        params=params,
        data=ttl_data,
        auth=AUTH
    )

    if response.status_code not in (200, 201, 204):
        raise Exception(f"Insert failed: {response.status_code} – {response.text}")
    
def append_to_catalog_graph(dataset_uri: str):
    catalog_uri = "https://catalog.gesundes-tal.de/catalog"
    graph_uri = catalog_uri

    update_query = f"""
    PREFIX dcat: <http://www.w3.org/ns/dcat#>

    INSERT DATA {{
      GRAPH <{graph_uri}> {{
        <{catalog_uri}> dcat:dataset <{dataset_uri}> .
      }}
    }}
    """

    res = requests.post(
        "http://fuseki:3030/semantic_data_catalog/update",
        headers={"Content-Type": "application/sparql-update"},
        data=update_query,
        auth=HTTPBasicAuth("admin", "admin")
    )

    if res.status_code not in [200, 204]:
        raise Exception(f"Failed to update catalog graph: {res.status_code} – {res.text}")
    
def remove_from_catalog_graph(dataset_uri: str):
    catalog_uri = "https://catalog.gesundes-tal.de/catalog"

    delete_query = f"""
    PREFIX dcat: <http://www.w3.org/ns/dcat#>
    DELETE WHERE {{
      GRAPH <{catalog_uri}> {{
        <{catalog_uri}> dcat:dataset <{dataset_uri}> .
      }}
    }}
    """

    res = requests.post(
        "http://fuseki:3030/semantic_data_catalog/update",
        headers={"Content-Type": "application/sparql-update"},
        data=delete_query,
        auth=HTTPBasicAuth("admin", "admin")
    )
    if res.status_code not in [200, 204]:
        raise Exception(f"Failed to remove dataset from catalog: {res.status_code} – {res.text}")
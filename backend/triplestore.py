import requests
import os
from requests.auth import HTTPBasicAuth
from datetime import datetime
from urllib.parse import urlparse

FUSEKI_URL = "http://fuseki:3030/semantic_data_catalog/data"
AUTH = HTTPBasicAuth("admin", "admin")

def _is_http_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except (TypeError, ValueError):
        return False

def generate_dcat_dataset_ttl(dataset: dict) -> str:
    issued = dataset["issued"].isoformat() if isinstance(dataset["issued"], datetime) else dataset["issued"]
    modified = dataset["modified"].isoformat() if isinstance(dataset["modified"], datetime) else dataset["modified"]
    identifier = dataset["identifier"]
    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    dataset_uri = f"{BASE_URI}/id/{identifier}"
    distribution_uri = f"{dataset_uri}/distribution"
    publisher_uri = f"{dataset_uri}/publisher"
    contact_uri = f"{dataset_uri}/contact"
    theme = dataset.get("theme")
    semantic_model_url = dataset.get("access_url_semantic_model")
    access_url_dataset = dataset.get("access_url_dataset")

    if not _is_http_url(access_url_dataset):
        raise ValueError("Dataset access URL must be a valid http(s) IRI.")

    dataset_lines = [
        f"<{dataset_uri}> a dcat:Dataset ;",
        f'    dct:title "{dataset["title"]}" ;',
    ]

    description = dataset.get("description")
    if description:
        dataset_lines.append(f'    dct:description "{description}" ;')

    dataset_lines.extend(
        [
            f'    dct:issued "{issued}"^^xsd:dateTime ;',
            f'    dct:modified "{modified}"^^xsd:dateTime ;',
            f"    dct:publisher <{publisher_uri}> ;",
            f'    dct:accessRights "{"public" if dataset.get("is_public", True) else "restricted"}" ;',
            f"    dcat:contactPoint <{contact_uri}> ;",
            f"    dcat:distribution <{distribution_uri}> ;",
        ]
    )

    if theme:
        if _is_http_url(theme):
            dataset_lines.append(f"    dcat:theme <{theme}> ;")
        else:
            raise ValueError("Theme must be a valid http(s) IRI.")

    if semantic_model_url:
        if _is_http_url(semantic_model_url):
            dataset_lines.append(f"    dct:conformsTo <{semantic_model_url}> ;")
        else:
            raise ValueError("Semantic model URL must be a valid http(s) IRI.")

    dataset_lines[-1] = dataset_lines[-1].rstrip(" ;") + " ."

    return "\n".join(
        [
            "@prefix dcat: <http://www.w3.org/ns/dcat#> .",
            "@prefix dct: <http://purl.org/dc/terms/> .",
            "@prefix foaf: <http://xmlns.com/foaf/0.1/> .",
            "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
            "@prefix vcard: <http://www.w3.org/2006/vcard/ns#> .",
            "",
            *dataset_lines,
            "",
            f"<{distribution_uri}> a dcat:Distribution ;",
            f"    dcat:downloadURL <{access_url_dataset}> ;",
            f'    dcat:mediaType "{dataset.get("file_format", "application/octet-stream")}" .',
            "",
            f"<{publisher_uri}> a foaf:Agent ;",
            f'    foaf:name "{dataset["publisher"]}" ;',
            f"    vcard:hasEmail <mailto:{dataset['contact_point']}> .",
            "",
            f"<{contact_uri}> a vcard:Kind ;",
            f"    vcard:hasEmail <mailto:{dataset['contact_point']}> .",
        ]
    )

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
    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    catalog_uri = f"{BASE_URI}/catalog"
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
    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    catalog_uri = f"{BASE_URI}/catalog"

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

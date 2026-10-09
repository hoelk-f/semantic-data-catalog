import copy
import json
import os
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from rdflib import Dataset, Graph, Literal, URIRef

from semantic_fetch import Document, FetchError, PublicRdfFetcher, document_url
from semantic_indexer import Indexer
from semantic_search import INDEX_GRAPH, SEARCH, STATE, FusekiStore, Settings, create_router, validate_query

PREFIXES = '''@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix sdp: <https://w3id.org/solid-dcat-profile#> .
@prefix ex: <https://example.org/> .
'''
REG_A = 'https://example.org/registries/a/'
REG_B = 'https://example.org/registries/b/'
ALICE = 'https://example.org/alice/profile/card#me'
BOB = 'https://example.org/bob/profile/card#me'
MODEL = 'https://example.org/models/beam.ttl'


class FixtureFetcher:
    def __init__(self, docs):
        self.docs = docs
        self.calls = []

    def begin(self):
        self.calls.clear()

    def finish(self):
        pass

    def get(self, url):
        self.calls.append(url)
        body = self.docs.get(url)
        if body is None:
            raise FetchError('Public read returned HTTP 403.')
        return Document(Graph().parse(data=PREFIXES + body, publicID=url, format='turtle'), body, byte_count=len((PREFIXES + body).encode()))


class MemoryStore:
    def __init__(self):
        self.dataset = Dataset(default_union=True)
        self.current = None

    def publish(self, graphs, state):
        self.dataset = Dataset(default_union=True)
        for name, graph in graphs.items():
            for triple in graph:
                self.dataset.graph(name).add(triple)
        self.current = copy.deepcopy(state)

    def state(self):
        return self.current

    def query(self, query, accept='application/sparql-results+json'):
        result = self.dataset.query(query)
        return result.serialize(format='json' if 'json' in accept else 'turtle')


def fixtures():
    docs = {
        REG_A: '<> ldp:contains <member-alice>, <member-bob> .',
        REG_B: '<> ldp:contains <member-bob> .',
        REG_A + 'member-alice': f'<> foaf:member <{ALICE}> .',
        REG_A + 'member-bob': f'<> foaf:member <{BOB}> .',
        REG_B + 'member-bob': f'<> foaf:member <{BOB}> .',
        MODEL: 'ex:beam a ex:SteelBeam ; ex:hasType ex:TypeX .',
    }
    for owner in ['alice', 'bob']:
        root = f'https://example.org/{owner}/'
        docs[root + 'profile/card'] = f'<#me> sdp:catalog <{root}catalog/cat.ttl#it> .'
        docs[root + 'catalog/cat.ttl'] = '<#it> a dcat:Catalog ; dcat:dataset <ds/item.ttl#it> .'
        docs[root + 'catalog/ds/item.ttl'] = f'<#it> a dcat:Dataset ; dct:title "{owner}" ; dct:conformsTo <{MODEL}#model> .'
    return docs


def settings(registry=REG_A, **kwargs):
    return Settings(dataspace_id=registry.rstrip('/').rsplit('/', 1)[-1], registry_url=registry,
                    fuseki_url='http://fuseki:3030/catalog', **kwargs)


def client(store, config=None):
    app = FastAPI()
    app.include_router(create_router(config or settings(), store))
    return TestClient(app)


def titles(store):
    rows = json.loads(store.query('SELECT ?title WHERE { ?dataset <http://purl.org/dc/terms/title> ?title }'))['results']['bindings']
    return {row['title']['value'] for row in rows}


def exercise_membership(store_a, store_b):
    docs = fixtures()
    fetcher = FixtureFetcher(docs)
    index_a = Indexer(settings(), store_a, fetcher)
    index_b = Indexer(settings(REG_B), store_b, fetcher)
    index_a.run_once()
    index_b.run_once()
    assert titles(store_a) == {'alice', 'bob'}
    assert titles(store_b) == {'bob'}
    query = f'''SELECT DISTINCT ?dataset WHERE {{
      GRAPH <{INDEX_GRAPH}> {{ ?dataset <{SEARCH.modelGraph}> ?model }}
      GRAPH ?model {{ ?beam a <https://example.org/SteelBeam> ; <https://example.org/hasType> <https://example.org/TypeX> }}
    }}'''
    assert len(json.loads(store_a.query(query))['results']['bindings']) == 2
    docs[REG_A] = '<> ldp:contains <member-alice> .'
    index_a.run_once()
    assert titles(store_a) == {'alice'}
    assert titles(store_b) == {'bob'}
    assert index_a.store.state()['modelCount'] == 1  # shared model survives one departure
    docs[MODEL] = 'ex:beam a ex:SteelBeam ; ex:hasType ex:TypeY .'
    index_a.run_once()
    assert not json.loads(store_a.query(query))['results']['bindings']
    docs[MODEL] = None  # no longer public
    assert index_a.run_once()['modelCount'] == 0
    assert titles(store_a) == {'alice'}
    docs[REG_A] = ''  # successful, empty registry
    index_a.run_once()
    assert titles(store_a) == set()


def test_membership_models_and_departures():
    exercise_membership(MemoryStore(), MemoryStore())


def test_failed_registry_preserves_snapshot_but_expires():
    docs = fixtures()
    store = MemoryStore()
    indexer = Indexer(settings(), store, FixtureFetcher(docs))
    indexer.run_once()
    previous = store.state().copy()
    docs[REG_A + 'member-alice'] = None
    with pytest.raises(FetchError):
        indexer.run_once()
    assert store.state() == previous
    store.current['expiresAt'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
    response = client(store).post('/api/semantic-search/query', json={'query': 'ASK {}'})
    assert response.status_code == 503
    assert client(store).get('/api/semantic-search/status').json()['status'] == 'stale'


def test_model_references_legacy_multiple_and_document_fragments():
    docs = fixtures()
    docs['https://example.org/alice/catalog/ds/item.ttl'] += ' <#it> dcat:conformsTo <https://example.org/models/second.ttl> .'
    docs['https://example.org/models/second.ttl'] = 'ex:part a ex:SteelBeam .'
    fetcher = FixtureFetcher(docs)
    store = MemoryStore()
    state = Indexer(settings(), store, fetcher).run_once()
    assert state['modelCount'] == 2
    assert fetcher.calls.count(MODEL) == 1
    assert not any('#' in url for url in fetcher.calls)
    docs['https://example.org/alice/catalog/ds/item.ttl'] = '<#it> a dcat:Dataset ; dct:title "alice" .'
    Indexer(settings(), store, fetcher).run_once()
    assert store.state()['modelCount'] == 1


def test_no_cross_model_pattern_join():
    docs = fixtures()
    docs[MODEL] = 'ex:beam a ex:SteelBeam .'
    docs['https://example.org/bob/catalog/ds/item.ttl'] = '<#it> a dcat:Dataset ; dct:conformsTo <https://example.org/other.ttl> .'
    docs['https://example.org/other.ttl'] = 'ex:beam ex:hasType ex:TypeX .'
    store = MemoryStore()
    Indexer(settings(), store, FixtureFetcher(docs)).run_once()
    result = store.query(f'ASK {{ GRAPH <{INDEX_GRAPH}> {{ ?dataset <{SEARCH.modelGraph}> ?g }} GRAPH ?g {{ ?x a <https://example.org/SteelBeam> ; <https://example.org/hasType> <https://example.org/TypeX> }} }}')
    assert json.loads(result)['boolean'] is False


@pytest.mark.parametrize('query', [
    'INSERT DATA { <urn:a> <urn:b> <urn:c> }', 'DROP ALL',
    'SELECT * WHERE { SERVICE <https://example.org/sparql> { ?s ?p ?o } }',
    'SELECT * WHERE { { SELECT * WHERE { SERVICE SILENT ?url { ?s ?p ?o } } } }',
    'SELECT * FROM <file:///etc/passwd> WHERE { ?s ?p ?o }',
    'SELECT * FROM NAMED <https://example.org/data> WHERE { GRAPH ?g { ?s ?p ?o } }',
    'SELECT (<java:java.lang.System.getenv>("HOME") AS ?secret) WHERE {}',
    'SELECT * WHERE { ?s missing:predicate ?o }',
])
def test_query_boundary_rejects_external_and_write_operations(query):
    with pytest.raises(HTTPException) as error:
        validate_query(query)
    assert error.value.status_code == 400


@pytest.mark.parametrize('query', ['SELECT * WHERE { ?s ?p ?o } LIMIT 20', 'ASK {}',
    'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 20', 'DESCRIBE <https://example.org/item>',
    'SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o FILTER(CONTAINS(STR(?o), "SERVICE")) }'])
def test_standard_read_queries(query):
    assert validate_query(query).endswith('Query')


def test_api_formats_configuration_and_registry_binding():
    store = MemoryStore()
    Indexer(settings(), store, FixtureFetcher(fixtures())).run_once()
    api = client(store)
    assert api.post('/api/semantic-search/query', json={'query': 'ASK {}'}).json()['boolean'] is True
    response = api.post('/api/semantic-search/query', json={'query': 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 5'})
    assert response.headers['content-type'].startswith('text/turtle')
    assert len(Graph().parse(data=response.text, format='turtle')) == 5
    assert api.post('/api/semantic-search/query', json={'query': 'ASK {}', 'registryUrl': REG_B}).status_code == 422
    assert client(store, settings(REG_B)).post('/api/semantic-search/query', json={'query': 'ASK {}'}).status_code == 503
    assert client(store, Settings()).get('/api/semantic-search/status').json()['status'] == 'disabled'


def test_anonymous_fetch_validators_and_revocation():
    fetcher = PublicRdfFetcher()
    body = b'<urn:a> <urn:b> <urn:c> .'
    with patch.object(fetcher, '_read', side_effect=[(200, {'Content-Type': 'text/turtle', 'ETag': 'v1'}, body),
                                                  (304, {}, b''), (403, {}, b'')]) as read:
        original = fetcher.get(MODEL)
        assert fetcher.get(MODEL) is original
        assert read.call_args.args[1]['If-None-Match'] == 'v1'
        assert 'Authorization' not in read.call_args.args[1]
        with pytest.raises(FetchError):
            fetcher.get(MODEL)
        assert MODEL not in fetcher.cache


def test_private_addresses_and_remote_contexts_are_not_loaded():
    fetcher = PublicRdfFetcher()
    with patch('semantic_fetch.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('127.0.0.1', 443))]):
        with pytest.raises(FetchError):
            fetcher.get(MODEL)
    with patch.object(fetcher, '_read', return_value=(200, {'Content-Type': 'application/ld+json'}, b'{"@context":"http://localhost/secret"}')):
        with pytest.raises(FetchError):
            fetcher.get(MODEL)


@pytest.mark.parametrize('url', ['https://example.org/a> } ; DROP ALL', 'https://user:secret@example.org/doc', 'file:///etc/passwd'])
def test_source_urls_cannot_inject_graph_names(url):
    with pytest.raises(FetchError):
        document_url(url)


def test_removed_dataset_links_and_inaccessible_metadata_drop_models():
    docs = fixtures()
    store = MemoryStore()
    indexer = Indexer(settings(), store, FixtureFetcher(docs))
    indexer.run_once()
    docs['https://example.org/alice/catalog/cat.ttl'] = '<#it> a dcat:Catalog .'
    indexer.run_once()
    assert titles(store) == {'bob'}
    docs['https://example.org/bob/catalog/ds/item.ttl'] = None
    state = indexer.run_once()
    assert state['datasetCount'] == state['modelCount'] == 0
    assert state['status'] == 'partial'


def test_discovery_limits_include_failed_requests_and_total_source_bytes():
    docs = fixtures()
    fetcher = FixtureFetcher(docs)
    indexer = Indexer(settings(max_documents=4), MemoryStore(), fetcher)
    state = indexer.run_once()
    assert len(fetcher.calls) <= 4
    assert state['status'] == 'partial'
    with pytest.raises(FetchError):
        Indexer(settings(max_source_bytes=10), MemoryStore(), FixtureFetcher(docs)).run_once()


@pytest.mark.skipif(not os.getenv('SEARCH_TEST_FUSEKI_A'), reason='Set two dedicated disposable Fuseki URLs for integration testing.')
def test_real_fuseki_isolation_and_query_protocol():
    a = FusekiStore(replace(settings(), fuseki_url=os.environ['SEARCH_TEST_FUSEKI_A']))
    b = FusekiStore(replace(settings(REG_B), fuseki_url=os.environ['SEARCH_TEST_FUSEKI_B']))
    exercise_membership(a, b)
    api = client(b, settings(REG_B))
    assert api.post('/api/semantic-search/query', json={'query': 'ASK { ?s ?p ?o }'}).json()['boolean'] is True
    assert api.post('/api/semantic-search/query', json={'query': 'DESCRIBE <https://example.org/bob/catalog/ds/item.ttl#it>'}).headers['content-type'].startswith('text/turtle')


def test_distribution_schemas_record_discovery_and_shared_non_rdf_models():
    docs = fixtures()
    schema = "https://example.org/schema.json"
    for owner in ["alice", "bob"]:
        root = f"https://example.org/{owner}/"
        docs[root + "profile/card"] = f"<#me> <http://purl.org/sdp/terms#catalog> <{root}catalog/cat.ttl#it>."
        docs[root + "catalog/cat.ttl"] = "<#it> a dcat:Catalog; dcat:record <ds/item.ttl>."
        docs[root + "catalog/ds/item.ttl"] = f'''<> a dcat:CatalogRecord; foaf:primaryTopic <#it>.
          <#it> a dcat:Dataset; dct:title "{owner}"; dcat:distribution <#dist>.
          <#dist> a dcat:Distribution; dcat:downloadURL <private.json>;
            dct:conformsTo <{schema}>, <{MODEL}#model>.'''
    class SchemaFetcher(FixtureFetcher):
        def get(self, url):
            if url == schema:
                self.calls.append(url)
                raise FetchError("JSON Schema is not RDF", kind="non-rdf")
            return super().get(url)
    fetcher = SchemaFetcher(docs)
    graphs, state = Indexer(settings(), MemoryStore(), fetcher).build()
    assert state["datasetCount"] == 2 and state["modelCount"] == 1
    assert state["status"] == "ready", state["errors"]
    assert fetcher.calls.count(schema) == 1
    assert not any(url.endswith("private.json") for url in fetcher.calls)
    for owner in ["alice", "bob"]:
        dataset = URIRef(f"https://example.org/{owner}/catalog/ds/item.ttl#it")
        assert (dataset, SEARCH.model, URIRef(schema)) in graphs[INDEX_GRAPH]

import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from test_semantic_search import MemoryStore, FixtureFetcher, fixtures, settings, REG_A, REG_B
from semantic_indexer import Indexer
from semantic_search import create_router, configured_registries


def test_selected_registry_isolated_for_queries_and_status(monkeypatch):
    monkeypatch.setenv('CATALOG_REGISTRIES_JSON', 'configured')
    stores = {}
    for registry in [REG_A, REG_B]:
        config, store = settings(registry), MemoryStore()
        Indexer(config, store, FixtureFetcher(fixtures())).run_once()
        stores[registry] = (config, store)
    app = FastAPI()
    app.include_router(create_router(registry_stores=stores))
    client = TestClient(app)
    query = 'SELECT ?title WHERE { ?d <http://purl.org/dc/terms/title> ?title }'
    for registry, expected in [(REG_A, {'alice', 'bob'}), (REG_B, {'bob'})]:
        response = client.post('/api/semantic-search/query', params={'registry': registry}, json={'query': query})
        assert response.status_code == 200
        assert response.headers['x-search-registry'] == registry
        assert {row['title']['value'] for row in response.json()['results']['bindings']} == expected
        assert client.get('/api/semantic-search/status', params={'registry':registry}).json()['registryUrl'] == registry
    for params, code in [({},400), ({'registry':'https://foreign.example/'},404), ([('registry',REG_A),('registry',REG_B)],400)]:
        assert client.get('/api/semantic-search/status',params=params).status_code == code
        assert client.post('/api/semantic-search/query',params=params,json={'query':query}).status_code == code


def test_two_registries_cannot_share_a_destructively_rebuilt_store(monkeypatch):
    monkeypatch.setenv('CATALOG_REGISTRIES_JSON',json.dumps([
        {'id':'a','url':REG_A,'fusekiUrl':'http://fuseki:3030/same'},
        {'id':'b','url':REG_B,'fusekiUrl':'http://fuseki:3030/same'},
    ]))
    with pytest.raises(ValueError,match='distinct'):
        configured_registries()

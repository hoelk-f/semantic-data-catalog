"""Instance-bound public search gateway. Fuseki is reachable only on an internal network."""
import json
import os
import re
import threading
import time
from dataclasses import dataclass, replace
from datetime import datetime, timezone
from urllib.parse import urlsplit

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from pyparsing import ParseResults
from rdflib import Literal, Namespace, URIRef
from rdflib.plugins.sparql.parser import parseQuery
from rdflib.plugins.sparql.parserutils import CompValue
from rdflib.plugins.sparql.algebra import translateQuery

SEARCH = Namespace("https://w3id.org/solid-dataspace/search#")
INDEX_GRAPH = URIRef("urn:solid-dataspace:semantic-search:index")
STATE = URIRef("urn:solid-dataspace:semantic-search:state")


def utc_now():
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class Settings:
    dataspace_id: str = ""
    registry_url: str = ""
    fuseki_url: str = ""
    interval: int = 300
    max_age: int = 900
    max_documents: int = 2048
    max_source_bytes: int = 64_000_000
    max_triples: int = 200000
    max_result_bytes: int = 4_000_000
    query_timeout: int = 15

    @classmethod
    def from_env(cls):
        interval = max(10, int(os.getenv("CATALOG_INDEX_INTERVAL_SECONDS", "300")))
        return cls(
            dataspace_id=os.getenv("CATALOG_DATASPACE_ID", "").strip(),
            registry_url=os.getenv("CATALOG_REGISTRY_URL", "").strip().rstrip("/") + "/" if os.getenv("CATALOG_REGISTRY_URL", "").strip() else "",
            fuseki_url=os.getenv("CATALOG_FUSEKI_URL", "").strip().rstrip("/"),
            interval=interval,
            max_age=max(interval * 3, int(os.getenv("CATALOG_INDEX_MAX_AGE_SECONDS", "900"))),
        )

    @property
    def configured(self):
        reg = urlsplit(self.registry_url)
        fuseki = urlsplit(self.fuseki_url)
        return bool(self.dataspace_id and reg.scheme in {"http", "https"} and reg.hostname
                    and not reg.username and not reg.password and not reg.fragment and not reg.query
                    and fuseki.scheme in {"http", "https"} and fuseki.hostname)


def configured_registries():
    """Only operator-configured stores are routable; request URLs never become upstreams."""
    raw = os.getenv("CATALOG_REGISTRIES_JSON", "").strip()
    base = Settings.from_env()
    if not raw:
        return [base]
    entries = json.loads(raw)
    if not isinstance(entries, list) or not 1 <= len(entries) <= 16:
        raise ValueError("CATALOG_REGISTRIES_JSON must contain 1 to 16 registries.")
    settings = []
    for entry in entries:
        config = replace(base, dataspace_id=entry["id"],
                         registry_url=entry["url"].rstrip("/") + "/",
                         fuseki_url=entry["fusekiUrl"].rstrip("/"))
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", config.dataspace_id) or not config.configured:
            raise ValueError("Invalid registry search configuration.")
        settings.append(config)
    for key in ("dataspace_id", "registry_url", "fuseki_url"):
        if len({getattr(item, key) for item in settings}) != len(settings):
            raise ValueError("Registry IDs, URLs and search stores must be distinct.")
    return settings


class FusekiStore:
    def __init__(self, settings):
        self.settings = settings
        self.session = requests.Session()
        self.session.trust_env = False

    def request(self, endpoint, body, content_type, accept, *, max_bytes=None):
        try:
            with self.session.post(self.settings.fuseki_url + endpoint, data=body.encode("utf-8"),
                                   headers={"Content-Type": content_type, "Accept": accept},
                                   timeout=(5, self.settings.query_timeout + 5), stream=True,
                                   allow_redirects=False) as response:
                if not response.ok or response.is_redirect:
                    raise HTTPException(502, "Search storage could not process the request.")
                data = bytearray()
                for chunk in response.iter_content(65536):
                    data.extend(chunk)
                    if len(data) > (max_bytes or self.settings.max_result_bytes):
                        raise HTTPException(413, "Query result is too large. Narrow the query or add LIMIT.")
                return bytes(data)
        except requests.Timeout as error:
            raise HTTPException(504, "Search timed out. Narrow the query.") from error
        except requests.RequestException as error:
            raise HTTPException(503, "Search storage is unavailable.") from error

    def query(self, query, accept="application/sparql-results+json"):
        return self.request("/query", query, "application/sparql-query", accept)

    def state(self):
        query = f"SELECT ?json WHERE {{ GRAPH <{INDEX_GRAPH}> {{ <{STATE}> <{SEARCH.state}> ?json }} }} LIMIT 1"
        try:
            rows = json.loads(self.query(query))["results"]["bindings"]
            return json.loads(rows[0]["json"]["value"]) if rows else None
        except (ValueError, KeyError, TypeError) as error:
            raise HTTPException(503, "Search index status is invalid.") from error

    def publish(self, graphs, state):
        # One update request / one TDB2 transaction: readers see old OR new state.
        index = graphs[INDEX_GRAPH]
        index.set((STATE, SEARCH.state, Literal(json.dumps(state))))
        blocks = []
        for name, graph in graphs.items():
            blocks.append(f"GRAPH {name.n3()} {{\n{graph.serialize(format='nt')}\n}}")
        self.request("/update", "DROP ALL; INSERT DATA {\n" + "\n".join(blocks) + "\n}",
                     "application/sparql-update", "text/plain")


def validate_query(query):
    try:
        tree = parseQuery(query)
        kind = tree[1].name
        if kind not in {"SelectQuery", "AskQuery", "ConstructQuery", "DescribeQuery"}:
            raise ValueError("Only read queries are supported.")

        def visit(value):
            if isinstance(value, CompValue):
                if value.name in {"ServiceGraphPattern", "DatasetClause", "Function"}:
                    raise ValueError("SERVICE, FROM and extension functions are not supported.")
                for child in value.values():
                    visit(child)
            elif isinstance(value, (list, tuple, ParseResults)):
                for child in value:
                    visit(child)
        visit(tree)
        # Also catch undefined prefixes and malformed expressions before Fuseki.
        translateQuery(tree)
        return kind
    except Exception as error:
        raise HTTPException(400, "Use a valid SPARQL 1.1 read query without SERVICE, FROM or extension functions.") from error


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=32000)

    model_config = ConfigDict(extra="forbid")


def create_router(settings=None, store=None, registry_stores=None):
    explicit = settings is not None
    if registry_stores is None:
        configurations = [settings] if explicit else configured_registries()
        registry_stores = {config.registry_url: (config, store or FusekiStore(config)) for config in configurations}
    require_registry = not explicit and bool(os.getenv("CATALOG_REGISTRIES_JSON"))

    def context(request):
        values = request.query_params.getlist("registry")
        if not values and not require_registry and len(registry_stores) == 1:
            return next(iter(registry_stores.values()))
        if len(values) != 1 or not values[0]:
            raise HTTPException(400, "Select exactly one registry.")
        key = values[0].rstrip("/") + "/"
        if key not in registry_stores:
            raise HTTPException(404, "Search is not configured for this registry.")
        return registry_stores[key]
    router = APIRouter(prefix="/api/semantic-search", tags=["Semantic Search"])
    slots = threading.BoundedSemaphore(2)

    def status(settings, store):
        base = {"dataspaceId": settings.dataspace_id, "registryUrl": settings.registry_url}
        if not settings.configured:
            return {**base, "status": "disabled", "message": "An explicit dataspace, registry and Fuseki URL must be configured."}
        try:
            state = store.state()
        except HTTPException:
            return {**base, "status": "unavailable", "message": "Search storage is unavailable."}
        if not state:
            return {**base, "status": "initializing"}
        if state.get("registryUrl") != settings.registry_url or state.get("dataspaceId") != settings.dataspace_id:
            return {**base, "status": "unavailable", "message": "Index belongs to another registry. Rebuild required."}
        try:
            expired = datetime.fromisoformat(state["expiresAt"]) <= datetime.now(timezone.utc)
        except (KeyError, ValueError, TypeError):
            expired = True
        return {**state, "status": "stale" if expired else state.get("status", "unavailable")}

    @router.get("/status")
    def read_status(request: Request):
        return JSONResponse(status(*context(request)), headers={"Cache-Control": "no-store"})

    @router.post("/query")
    def run_query(payload: QueryRequest, request: Request):
        settings, store = context(request)
        kind = validate_query(payload.query)
        if not slots.acquire(blocking=False):
            raise HTTPException(429, "Search is busy. Please try again shortly.")
        try:
            current = status(settings, store)
            if current["status"] not in {"ready", "partial"}:
                raise HTTPException(503, current.get("message", "No current search index is available."))
            started = time.monotonic()
            media = "application/sparql-results+json" if kind in {"SelectQuery", "AskQuery"} else "text/turtle"
            result = store.query(payload.query, media)
            return Response(result, media_type=media, headers={
                "Cache-Control": "no-store", "X-Search-Dataspace": settings.dataspace_id,
                "X-Search-Registry": settings.registry_url,
                "X-Search-Index-Checked-At": current["checkedAt"],
                "X-Search-Duration-Ms": str(round((time.monotonic() - started) * 1000)),
            })
        finally:
            slots.release()

    return router

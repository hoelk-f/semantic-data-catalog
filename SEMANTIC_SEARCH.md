# Semantic Search

The search index is a derived, public-only copy of the configured registry's
catalog metadata and semantic models. Solid Pods remain the source of truth.
The normal catalog continues to use the user's selected registries; search uses
the single registry configured on the **backend**, independently of that selection.

## Deployment

The standalone Compose file builds the API, indexer and Apache Jena Fuseki image.
Set these values in `.env` before starting it (example: DACE):

```dotenv
CATALOG_DATASPACE_ID=dace
CATALOG_REGISTRY_URL=https://solid-community-server.tmdt.info/semanticdatacatalog/public/dace/
CATALOG_INDEX_INTERVAL_SECONDS=300
CATALOG_INDEX_MAX_AGE_SECONDS=900
```

```sh
docker compose up -d --build
docker compose logs --tail=100 semantic-data-catalog-indexer
```

The integrated deployments configure `CATALOG_DATASPACE_ID` from `DATASPACE_ID`
and an explicit per-instance registry URL. Their Fuseki database is isolated on
a project-local, internal `catalog-search` network and the `semantic_search_data`
volume. Use a different Compose project for each instance. Never connect Fuseki
to the shared dataspace network or publish its port. The PLASMA store is separate.

The backend workflow publishes `son1i/semantic-data-catalog-fuseki:6.2.0`
alongside the backend image. The Fuseki image downloads the official Maven Central
artifact and checks a pinned SHA-512 checksum. Its query endpoint disables remote
`SERVICE` calls and ARQ property functions. Only the backend gateway is exposed
through the existing `/api/*` reverse proxy. The internal `/catalog/update`
endpoint is for the indexer; it is intentionally not exposed by the API.

## Indexing and removal

One `python -m semantic_indexer` process runs per instance. It reads membership
documents, member WebIDs, linked catalogs, datasets/series, and all model links
from distribution-level `dcterms:conformsTo`, with compatibility for older
model links directly on the dataset. It follows `dcat:record` and
`foaf:primaryTopic` as well as `dcat:dataset`, `dcat:datasetSeries` and
`dcat:seriesMember`. Distribution descriptions are metadata; the files linked
by downloadURL/accessURL are never downloaded. Non-RDF schema references
remain in the manifest without being imported as RDF model graphs.
Publicly readable metadata can describe a restricted distribution; this does not
make the distribution public or import its contents.

Only anonymous Turtle/N-Triples reads are supported in this version. Redirects
are revalidated, public IP addresses are pinned for requests, and downloads are
bounded. No service credentials, remote JSON-LD contexts, ontology imports, or
inference are used. A model URL with a fragment is fetched once at its document
URL, preserving original RDF IRIs and the final URL as the parser base.

Conditional HTTP reads reuse unchanged documents. Each completed pass replaces
the entire snapshot in one TDB2 update transaction. Removed members, removed
links, deleted metadata and inaccessible models therefore disappear on the next
completed pass. A shared model remains while another eligible dataset references
it. Document failures produce a partial index; their old content is not reused.

An incomplete registry read aborts the pass rather than treating missing entries
as departures. The prior snapshot is queryable only until its `expiresAt` time;
the API refuses stale snapshots. The default maximum age is 15 minutes. A stopped
indexer therefore cannot leave an indefinitely searchable old index. Monitor the
status endpoint and indexer logs. Changes are eventually visible, not synchronous
with a Profile Manager checkbox; the default interval is five minutes plus crawl
time. Do not run overlapping indexers for the same store.

For a manual refresh, stop the scheduled indexer before using the one-shot mode:

```sh
docker compose stop semantic-data-catalog-indexer
docker compose run --rm semantic-data-catalog-indexer python -m semantic_indexer --once
docker compose up -d semantic-data-catalog-indexer
```

Defaults bound each RDF document to 4 MB, discovery to 2,048 attempted documents,
total source content to 64 MB, and the
stored snapshot to approximately 200,000 triples. Sources exceeding a limit are
reported; an incomplete registry cannot publish a replacement snapshot.

## Query contract

`GET /api/semantic-search/status` returns the fixed registry, dataspace ID,
`disabled|initializing|ready|partial|stale|unavailable`, timestamps, counts, and up
to 100 public source errors. `POST /api/semantic-search/query` accepts only
`{"query":"..."}`. No client-supplied registry or endpoint is accepted.

Supported query forms: SELECT and ASK (SPARQL Results JSON), CONSTRUCT and
DESCRIBE (Turtle). Queries are limited to 32,000 characters, 15 seconds in Fuseki,
two concurrent gateway queries per API process, and 4 MB of response data. Larger
results fail explicitly; they are not silently truncated. The UI shows at most
1,000 returned rows and exports the complete response. Use LIMIT and narrower
patterns. UPDATE, FROM, SERVICE and extension functions are rejected by parsing
the query. The gateway never calls a service-account reader.

Each source document uses its document URL as a named graph. The provenance
graph `<urn:solid-dataspace:semantic-search:index>` connects dataset IRIs through
`https://w3id.org/solid-dataspace/search#` properties:

| Property | Meaning |
| --- | --- |
| `metadataGraph` | Source graph containing dataset DCAT metadata |
| `catalogGraph` | Source catalog graph |
| `modelGraph` | Loaded semantic model document graph |
| `model` | Original model reference, including any fragment |
| `owner` | Member WebID from registry discovery |
| `registry` | The configured registry |
| `digest` | Source content SHA-256 |

The default graph is a union for exploratory queries. For dataset matching,
always scope the **entire model pattern** to its model graph; otherwise identical
IRIs in unrelated models could create false joins:

```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX search: <https://w3id.org/solid-dataspace/search#>

SELECT DISTINCT ?dataset ?title ?class WHERE {
  GRAPH <urn:solid-dataspace:semantic-search:index> {
    ?dataset search:metadataGraph ?metadata ; search:modelGraph ?model .
  }
  GRAPH ?metadata { ?dataset dct:title ?title . }
  GRAPH ?model { ?node a ?class . }
}
LIMIT 100
```

Replace class/property IRIs in the UI's model-pattern example with IRIs from
actual models. Finding a model that describes a price column does not query
individual CSV prices. RDF conversion of distribution values is a separate task.

## Frontend integration

Standalone: the header switches between catalog and search; `?view=semantic-search`
supports reload and browser history. Integrated: the manager's `/semantic-search`
route mounts the new `SemanticSearchEmbed` export and the sidebar entry is last
under Consume and Provide. The catalog header is suppressed when embedded.

```jsx
import { SemanticSearchEmbed } from '@hoelk-f/semantic-data-catalog/embed';
<SemanticSearchEmbed language="en" onOpenDataset={openDataset} />
```

The component defaults to same-origin `/api/semantic-search`; `apiBaseUrl` may be
provided for development. Bindings named `dataset` open catalog details through
the callback. `CatalogEmbed` now accepts `datasetUrl` to open a public document
independently of the user's currently selected registries. Publish the updated
catalog package before building the updated manager; the workspace versioning
script updates the manager dependency and release order.

## Validation

```sh
cd backend
python -m pip install -r requirements-test.txt
python -m pytest tests -q
```

For the real Fuseki integration test, start two **disposable** stores with this
image and set `SEARCH_TEST_FUSEKI_A` and `SEARCH_TEST_FUSEKI_B` to their respective
`http://localhost:PORT/catalog` URLs. That test replaces their entire contents.
It covers independent memberships, shared models, source changes and removals.

References: [Fuseki configuration](https://jena.apache.org/documentation/fuseki2/fuseki-config-endpoint.html),
[TDB2](https://jena.apache.org/documentation/tdb2/),
[SERVICE control](https://jena.apache.org/documentation/query/service.html).

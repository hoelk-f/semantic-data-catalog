# Semantic Data Catalog

A FAIR-compliant **Semantic Data Catalog** for decentralized Solid-based dataspaces. The catalog stores metadata directly in a Solid Pod using DCAT and supports **datasets** and **dataset series** for discovery.

---

## Architecture (Current)

- **Frontend (React)**: The UI that reads/writes DCAT metadata directly in the user's Solid Pod.
- **Solid Pod**: Source of truth for catalog metadata (Turtle documents).
- **Backend API (FastAPI)**: Helper API for public Solid catalog reads, SHACL validation, merged Turtle export, and service-account dataset creation.

The previous SQL database remains retired. A separate, derived Fuseki index now
supports SPARQL over each instance's public DCAT metadata and semantic models.
See [Semantic Search](SEMANTIC_SEARCH.md) for configuration, indexing and API details.

---

## Quickstart (Docker)

```bash
docker-compose up -d --build
```

Services:
- Frontend: `http://localhost:5000`
- Backend API: `http://localhost:8000/api`

---

## Configuration

Edit the environment variables in `docker-compose.yaml` for the frontend:

```env
REACT_APP_OIDC_ISSUER=https://solidcommunity.net
STATISTICS_ENABLED=true
STATISTICS_POD_BASE_URL=https://solid-community-server.tmdt.info/solidtestpod/statistics/
STATISTICS_EVENTS_URL=https://solid-community-server.tmdt.info/solidtestpod/statistics/events/catalog-instances/test/downloads/
STATISTICS_REGISTRY_CONTEXT=
```

When statistics are enabled, the standalone app appends anonymous Turtle events
to the configured Solid container with the authenticated browser session. The
container must grant authenticated agents `Append` access. Events contain the
event type, the canonical dataset-metadata URL, a title snapshot, an optional
registry context, a UUID, and a UTC timestamp. Query parameters are removed
from the dataset-metadata URL. Action targets, download URLs, and presigned URLs
are never stored, so their query credentials cannot enter the event data. The
events also contain no WebID, IP address, or user-agent value. Only successful
dataset downloads and semantic-model downloads are counted. Dataset access
clicks, direct access outside the catalog, automatic semantic-model
visualization, access checks, and catalog exports are not counted.
`STATISTICS_EVENTS_URL` is optional and overrides the default
`<STATISTICS_POD_BASE_URL>/events/downloads/` container when set.
For a multi-instance deployment it should always be set explicitly to the
instance's dedicated leaf container.

With a canonical per-instance URL ending in
`/events/catalog-instances/<instance-id>/downloads/`, the catalog also enables
the two-step usability survey. Its sibling container is derived as
`/events/catalog-instances/<instance-id>/survey-responses/`; legacy or custom
download paths deliberately do not enable the survey. Each question is stored
as a separate anonymous `CatalogSurveyResponse` with its own event UUID,
question ID, rating, catalog surface, survey version, and UTC timestamp. A local
per-question browser marker prevents accidental repeat submissions and keeps a
pending UUID stable across retries.

For an embedded catalog, pass the configuration explicitly. The prop takes
priority over standalone `window._env_` values:

```jsx
<SemanticDataCatalogEmbed
  webId={webId}
  statisticsConfig={{
    enabled: true,
    podBaseUrl: "https://solid.example/statistics/",
    eventsUrl: "https://solid.example/statistics/events/catalog-instances/test/downloads/",
    registryContext: "https://solid.example/registry/research/",
  }}
/>
```

The Embed prop also accepts an explicit `eventsUrl`; it takes priority over the
URL derived from `podBaseUrl`.

For backend writes, configure a Solid service account:

```env
CATALOG_SERVICE_WEBID=https://solid-community-server.tmdt.info/solidservice/profile/card#me
CATALOG_SERVICE_OIDC_ISSUER=https://solid-community-server.tmdt.info
CATALOG_SERVICE_CLIENT_ID=
CATALOG_SERVICE_CLIENT_SECRET=
CATALOG_SERVICE_TOKEN_URL=
```

The service WebID needs write access to the target user's `catalog/` container
and inherited write access for `catalog/ds/`. To make
new metadata documents publicly readable, it also needs ACL control access for
those metadata resources. The backend uses Solid-OIDC client credentials with
DPoP proofs for Solid requests.

Notes:
- The UI base path is `/semantic-data-catalog` (see `frontend/package.json` `homepage` and the `PUBLIC_URL` script flags).
- If you deploy under a different base path, adjust `PUBLIC_URL` accordingly (see the `frontend/package.json` scripts).

---

## Data Model (DCAT)

New entries follow the Solid DCAT Profile in `index.html`:

- `catalog/cat.ttl#it` links records with `dcat:record` and retains `dcat:dataset` links for existing clients.
- `catalog/ds/{id}.ttl` is the CatalogRecord itself; its `foaf:primaryTopic` is `#it`, preserving existing dataset identifiers. Dataset and distribution descriptions are fragments in the same document.
- `catalog/series/{id}.ttl` uses the same record structure for a real Solid container. Member links describe contained resources.
- Every distribution requires one direct `dcat:downloadURL`, one `dcat:mediaType` and at least one model/schema IRI via `dcterms:conformsTo`. The APIs support multiple distributions and model references; the editor updates the primary representation and preserves additional ones. `dcat:theme` is recommended, never required.
- New documents use POST to the parent container. The Pod must honor the requested `Slug` to preserve this application's stable IDs; a different `Location` is reported as an error. Updates use N3 PATCH; shared catalog edits retain strong ETag checks and bounded conflict retries. Legacy blank-node components remain readable; changing them requires assigning stable IRIs first.
- Discovery uses `http://purl.org/sdp/terms#catalog`. Existing namespace links and older dataset-level model links remain readable; profile writes also retain the old discovery alias for deployed consumers.
- Existing Pod documents are not migrated in bulk. On an explicit edit, the entry must satisfy the current profile. Existing dataset URLs remain stable. Old `catalog/records/` documents can remain as legacy metadata outside the new record traversal.

`POST /api/validate` accepts either the existing `{turtle, base_uri}` request or
`{documents: [{url, turtle}], root_url}`. The document bundle contains metadata
only, collected with the caller's access rights. The backend performs no network
requests during validation. It follows the metadata closure specified in
`index.html`, applies the local DatasetSeries-to-Dataset subclass relationship,
and excludes data files, models and remote vocabulary imports. The bounds are
256 documents, 16 MB and 200,000 triples. Results distinguish `conformant`,
`nonconformant` and `incomplete`, with `missingDocuments` and recommendation
`warnings`. The executable, non-recursive shapes are in
`backend/shapes/solid-dcat-profile.ttl`; the previous shape file is retained only
as a legacy reference and is no longer the conformance gate.

Metadata conformance does not prove source-data/schema conformance or HTTP/WAC
server conformance. Public metadata and restricted data remain separate; source
access is enforced by the Pod's ACLs.

---

## Backend API

The catalog read/write API uses Solid Pods and returns JSON summaries. The optional
`/api/semantic-search` endpoints query a separate public-only Fuseki index populated
by the per-instance indexer; this index never replaces the Pod source documents.

Useful endpoints:

- `GET /api/docs` (Swagger UI)
- `GET /api/redoc`
- `GET /api/openapi.json`
- `GET /api/health`
- `GET /api/catalog?webId=...` or `GET /api/catalog?catalogUrl=...`
- `GET /api/datasets?webId=...&q=...&theme=...&type=dataset|series`
- `GET /api/datasets/count?webId=...`
- `GET /api/datasets/resolve?url=...`
- `POST /api/datasets`
- `POST /api/validate` with `{ "turtle": "...", "base_uri": "..." }`
- `GET /api/export/catalog?webId=...`

`POST /api/datasets` writes a record document containing the dataset and its
distributions, links it from the owner's catalog, and tries to make these
metadata documents publicly readable. For public datasets, local Pod resources
referenced by `access_url_dataset` or `access_url_semantic_model` are also made
public-readable when the service account has ACL control access. If
`identifier` is omitted, the backend generates a UUID. If `publisher` or
`contact_point` are omitted, they are read from the owner WebID profile
(`vcard:fn`/`foaf:name` and `vcard:hasEmail`). Example body:

```json
{
  "ownerWebId": "https://solid-community-server.tmdt.info/alice/profile/card#me",
  "title": "Air Quality Measurements",
  "description": "Hourly sensor observations.",
  "publisher": "City of Wuppertal",
  "contact_point": "data@example.org",
  "is_public": true,
  "access_url_dataset": "https://example.org/data/air-quality.csv",
  "distribution_access_type": "download",
  "file_format": "text/csv",
  "access_url_semantic_model": "https://example.org/models/air-quality.ttl",
  "theme": "environment"
}
```

Update, delete, ACL management, file uploads, and series creation are not part
of the first backend write endpoint.

Optional backend environment variables:

- `CATALOG_FETCH_TIMEOUT_SECONDS` (default: `10`)
- `CATALOG_FETCH_HOST_ALLOWLIST` (comma-separated hostnames; empty means no host restriction)
- `CATALOG_SERVICE_AUTHORIZATION_HEADER` or `CATALOG_SERVICE_ACCESS_TOKEN` as alternatives to client credentials
- `CATALOG_SERVICE_SCOPE` (default: `webid`)

---

## Access Requests (Solid Notifications)

Access requests are delivered as Solid inbox notifications to the dataset owner.
Approval/denial handling is implemented in a separate application. The catalog itself remains usable on its own.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attribution information.

---

## Citation

If you use this tool in your research, please cite:

> **Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog**  
> Florian Hoelken, Alexander Paulus, Tobias Meisen, Andre Pomp.  
> *The 2nd Solid Symposium*, Leiden, Netherlands, April 24-25, 2025.  

```bibtex
@inproceedings{hoelken2025solidcatalog,
  title={Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog},
  author={Hoelken, Florian and Paulus, Alexander and Meisen, Tobias and Pomp, Andre},
  booktitle={The 2nd Solid Symposium Poster Session},
  year={2025},
  location={Leiden, Netherlands}
}
```

---

## Acknowledgements

This work has been supported as part of the research project _Gesundes Tal_ in collaboration with the city of Wuppertal, funded by the Federal Ministry of Housing, Urban Development and Building (BMWSB) and the Reconstruction Loan Corporation (KfW) through the funding program “Modellprojekte Smart Cities: Stadtentwicklung und Digitalisierung” (grant number 19454890).

---

## Public metadata cache

The catalog UI optionally reads preloaded public RDF metadata from the shared
sync worker at `/sync-worker/public-cache/catalog`. On localhost it uses the
test domain's central worker. Configure `PUBLIC_CACHE_URL` (runtime
`window._env_.PUBLIC_CACHE_URL`) for a standalone host without this proxy.

The worker warms only its configured public research registries. Private registry
mode and protected metadata keep using the active Solid session. Own catalog
metadata is loaded directly so changes are immediately visible. Public cache
misses, expired snapshots and unavailable worker versions fall back to normal
discovery; missing individual entries keep the existing partial-load warning.
The app still waits for profile checks and all selected data reads to settle.

For library callers, `loadAggregatedDatasets` accepts the optional
`usePublicCache: true` option; it defaults to false outside the UI. Cache responses
preserve original RDF document URLs and do not imply access to a distribution.
The worker README documents configuration, expiry, pagination, and deployment
verification. No private data is sent to or persisted in the public cache.

## Contact

For questions or contributions, please contact:

- Florian Hoelken — [hoelken@uni-wuppertal.de](mailto:hoelken@uni-wuppertal.de)

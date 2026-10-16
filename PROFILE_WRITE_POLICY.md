# Profile enforcement when publishing catalog entries

The normative prose in [SolidDCAT-Profile/index.html](https://github.com/kubeluk/SolidDCAT-Profile/blob/spec/index.html) is authoritative. `theme` is a SHOULD, not a publication requirement. A distribution's `conformsTo` can reference a semantic model, schema, ontology, view or profile; it need not be a Turtle file, and publishing does not generate a model automatically.

New entries are validated before catalog setup, source ACL changes or metadata publication. This policy is shared by the standalone catalog, the embedded catalog, the `catalog-api` SDK (including City Tours), and the backend service writer. Every distribution requires exactly one download IRI, exactly one nonempty media type and at least one model/schema IRI. The resulting RDF document must be a `dcat:CatalogRecord` with exactly one `foaf:primaryTopic`. Dataset/Series and typed Distributions must be secondary resources of that record document. Series dependencies are checked with a bounded, cycle-safe metadata closure. Publication links the validated record document through `dcat:record` in the root catalog.

An existing catalog can receive a new valid record even when older siblings do not conform. Existing records are neither migrated nor removed by validation. Readers keep their legacy compatibility. Explicit edits still require valid replacement metadata. New publication with an existing identifier fails before changing source ACLs; callers must use the update operation instead. Error cleanup only deletes a record created by the failing operation.

`backend/shacl_validation.py` checks both the SHACL constraints and document-level rules in `profile_structure.py`. Validating a record document alone is a pre-publication check; supplying a root catalog also checks its record links and complete metadata closure. Incomplete or inaccessible linked metadata cannot receive a positive validation result. Validation never dereferences data files or model/schema URLs.

## Application inventory

- Catalog standalone and embedded UI: `frontend/src/solidCatalog.js` prepares and validates the actual record before writing it. Root additions validate the target record, preserving unrelated legacy siblings.
- SDK public/restricted publication and public updates: `frontend/src/catalogApi.js` uses the same writer and validates each representation. City Tours uses this SDK for route templates and activity donations in its standalone and embedded builds.
- Backend `/api/datasets`: `solid_writer.py` rejects invalid payloads before opening a service session and checks the generated RDF. It preserves unrelated existing catalog triples when adding the new record.
- Dataspace Manager onboarding creates catalog roots and registry membership, not Dataset records.
- Environmental Monitoring, Health App, Questionnaire, PLASMA, the sync worker and the inspected Node-RED flows do not implement an independent Dataset-record publisher in the inspected repository/deployment versions. Some write ordinary source files or refresh their contents.

The policy governs publication as a catalog entry. It does not require every arbitrary Pod file to be cataloged, install a Solid-server-wide RDF firewall, or prove that a remote schema truthfully describes the data. A separate application writing raw RDF directly to a Pod can bypass application-level validation and must adopt the same publication rules. Service publication additionally requires an explicit owner-scoped integration grant. Public metadata reads never fall back to service credentials. See README for the separate transport and authorization rules; neither rule forces a migration of legacy catalog data.

## Verification

Regression tests cover missing and malformed distribution properties, CatalogRecord structure, secondary-resource identities, nested series, optional themes, JSON-schema references, preserved legacy entries, duplicate identifiers and cleanup ownership. `profileRdf` and the backend omit empty operations from N3 PATCH requests for compatibility with the deployed CSS/N3 parser. The backend preserves RDF literal lexical forms when reading existing Turtle for conditional N3 PATCH updates, including timestamps written by browser clients. An isolated CSS integration fixture exercises actual SDK and backend POST/PATCH publication alongside an invalid legacy entry, without access to production Pod storage.

Deploy the catalog's rebuilt SDK to both the Manager and the standalone City Tours app; updating only the catalog page leaves older bundled writers in consumers. Test 2 uses the live SDK mounts in the Manager and a separately rebuilt City Tours image. A normal release must publish the catalog package and rebuild its consumers through the existing versioning/release workflow.

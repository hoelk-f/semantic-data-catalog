# Data Service catalog extension, version 1

This versioned application extension uses W3C DCAT 3 DataService. It supplements the SolidDCAT file dataset profile; it does not relax the mandatory rules for Dataset, DatasetSeries or Distribution. API records are explicitly identified by this document's IRI on the CatalogRecord using dcterms:conformsTo.

A service description is an RDF document typed dcat:CatalogRecord at its document IRI. Its single foaf:primaryTopic is one local fragment typed dcat:DataService. The same document must not also describe Dataset, DatasetSeries or Distribution resources.

Required service properties: one nonempty title (maximum 200 characters), description (maximum 5000), publisher (maximum 200), HTTPS dcat:endpointURL and one authentication label at https://w3id.org/solid-dataspace/catalog-api#authentication. Labels: public, api-key, oauth2, solid-oidc. These labels describe the upstream service; they grant no access and store no credentials.

Optional properties: one HTTPS dcat:endpointDescription linking OpenAPI or human-readable documentation, and up to 64 dcat:servesDataset links identifying existing dataset metadata. URLs must not contain embedded credentials or secret query parameters. Endpoint fragments are not allowed. The catalog links the service using dcat:service and its metadata document using dcat:record.

Creating an API publishes only its new metadata document. Existing data, API servers, linked datasets, schemas and their access rules are not changed. Editing retains unrelated metadata. Removal unlinks the entry from the catalog and retains the API, metadata document and data. Directory discovery must not restore unlinked service entries.

The implementation supports creation, editing, removal, type filtering, ordinary text search and details in the embedded and standalone catalogs, in English and German. API documentation is linked by URL. External services are described, not proxied or invoked by the catalog.

References: [W3C DCAT 3 DataService](https://www.w3.org/TR/vocab-dcat-3/#Class:Data_Service), [SolidDCAT Profile](https://github.com/kubeluk/SolidDCAT-Profile).

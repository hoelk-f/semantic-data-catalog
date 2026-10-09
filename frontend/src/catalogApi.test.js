import {
  assertCatalogDatasetDeletionTarget,
  createDataset,
  deleteDatasetEntry,
  ensureCatalogStructure,
  ensurePublicReadOnlyResourceAccess,
  ensureRestrictedResourceAccess,
  getPodRoot,
  loadAggregatedDatasets,
  loadRegistryConfig,
  saveRegistryConfig,
  updateDataset,
} from "./solidCatalog";
import {
  discoverPublicDatasets,
  ensurePublicCatalogReadiness,
  getCatalogReadiness,
  getPublicRegistryPresets,
  normalizePublicDatasetInput,
  normalizeRestrictedDatasetInput,
  publishPublicDataset,
  publishRestrictedDataset,
  removeDataset,
  updatePublicDataset,
} from "./catalogApi";

jest.mock("./solidCatalog", () => ({
  assertCatalogDatasetDeletionTarget: jest.fn(
    (_podRoot, datasetUrl) => datasetUrl
  ),
  createDataset: jest.fn(),
  deleteDatasetEntry: jest.fn(),
  ensureCatalogStructure: jest.fn(),
  ensurePublicReadOnlyResourceAccess: jest.fn(),
  ensureRestrictedResourceAccess: jest.fn(),
  getPodRoot: jest.fn(() => "https://pod.example/laura/"),
  loadAggregatedDatasets: jest.fn(),
  loadRegistryConfig: jest.fn(),
  REGISTRY_PRESETS: [
    {
      id: "test",
      label: "Test",
      url: "https://registry.example/public/test/",
    },
    {
      id: "invalid",
      label: "Invalid",
      url: "javascript:alert(1)",
    },
  ],
  saveRegistryConfig: jest.fn(),
  updateDataset: jest.fn(),
}));

const session = {
  info: { webId: "https://pod.example/laura/profile/card#me" },
  fetch: jest.fn(),
};

const input = {
  identifier: "solid-tours-activity-run-1",
  title: "Completed planned route",
  description: "Route and calculated activity summary",
  distributionUrl:
    "https://pod.example/laura/solid-tours/runs/run-1/activity.geojson",
  mediaType: "application/geo+json",
  conformsTo: ["https://geojson.org/schema/FeatureCollection.json"],
  publisher: "Hannah Müller",
  publisherWebId: session.info.webId,
  contactPoint: "hannah.mueller@sscon-praesentation.de",
  contactPointWebId: session.info.webId,
  creatorWebId: session.info.webId,
  includeCreator: false,
};

const publicInput = {
  ...input,
  identifier: "solid-tours-route-template-run-1",
  title: "Public Wuppertal route",
  description: "A reusable route template without activity data",
  distributionUrl:
    "https://pod.example/laura/solid-tours/public-routes/run-1.geojson",
  theme: "https://w3id.org/solid-tours/theme/route-template",
  includeCreator: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  assertCatalogDatasetDeletionTarget.mockImplementation(
    (_podRoot, datasetUrl) => datasetUrl
  );
  getPodRoot.mockReturnValue("https://pod.example/laura/");
  ensurePublicReadOnlyResourceAccess.mockResolvedValue(undefined);
  ensureRestrictedResourceAccess.mockResolvedValue(undefined);
  ensureCatalogStructure.mockResolvedValue({
    catalogUrl: "https://pod.example/laura/catalog/cat.ttl#it",
  });
  loadRegistryConfig.mockResolvedValue({
    mode: "research",
    registries: ["https://registry.example/public/test"],
    privateRegistry: "",
  });
  createDataset.mockImplementation(async (_session, dataset) => ({
    datasetUrl: `https://pod.example/laura/catalog/ds/${dataset.identifier}.ttl#it`,
    identifier: dataset.identifier,
  }));
  deleteDatasetEntry.mockResolvedValue(undefined);
  updateDataset.mockResolvedValue(undefined);
  loadAggregatedDatasets.mockResolvedValue({ datasets: [], catalogs: [] });
  saveRegistryConfig.mockResolvedValue(undefined);
});

test("normalizes the public API aliases into a fail-closed restricted dataset", () => {
  expect(normalizeRestrictedDatasetInput(session, input)).toMatchObject({
    identifier: input.identifier,
    access_url_dataset: input.distributionUrl,
    file_format: "application/geo+json",
    webid: "",
    contact_point: "hannah.mueller@sscon-praesentation.de",
    contact_url: session.info.webId,
    publisher: "Hannah Müller",
    publisher_url: session.info.webId,
    distribution_access_type: "download",
    is_public: false,
    strict_restricted_acl: true,
  });
});

test("keeps creator metadata by default for existing catalog callers", () => {
  expect(
    normalizeRestrictedDatasetInput(session, {
      ...input,
      includeCreator: undefined,
    }).webid
  ).toBe(session.info.webId);
});

test("normalizes the compatible aliases into a strict public dataset", () => {
  expect(normalizePublicDatasetInput(session, publicInput)).toMatchObject({
    identifier: publicInput.identifier,
    title: publicInput.title,
    description: publicInput.description,
    access_url_dataset: publicInput.distributionUrl,
    file_format: "application/geo+json",
    theme: publicInput.theme,
    webid: session.info.webId,
    distribution_access_type: "download",
    is_public: true,
    strict_restricted_acl: false,
    strict_public_acl: true,
    require_discoverable_registry: true,
  });
});

test.each([
  ["title", { title: "" }],
  ["media type", { mediaType: "" }],
  ["model/schema", { conformsTo: [] }],
])("requires public dataset %s metadata", (_label, override) => {
  expect(() =>
    normalizePublicDatasetInput(session, { ...publicInput, ...override })
  ).toThrow(/required/i);
});

test("publishes public metadata only after the distribution ACL is verified read-only", async () => {
  const result = await publishPublicDataset(session, publicInput);
  const datasetUrl =
    "https://pod.example/laura/catalog/ds/solid-tours-route-template-run-1.ttl#it";
  const recordUrl =
    "https://pod.example/laura/catalog/ds/solid-tours-route-template-run-1.ttl";

  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    1,
    session,
    publicInput.distributionUrl,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(ensurePublicReadOnlyResourceAccess.mock.invocationCallOrder[0]).toBeLessThan(
    createDataset.mock.invocationCallOrder[0]
  );
  expect(createDataset).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      is_public: true,
      strict_public_acl: true,
      registryConfig: expect.objectContaining({
        mode: "research",
        registries: ["https://registry.example/public/test"],
      }),
    })
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    2,
    session,
    datasetUrl,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    3,
    session,
    recordUrl,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    4,
    session,
    "https://pod.example/laura/catalog/cat.ttl",
    { podRoot: "https://pod.example/laura/" }
  );
  expect(result).toEqual({
    datasetUrl,
    identifier: publicInput.identifier,
    recordUrl,
    distributionUrl: publicInput.distributionUrl,
  });
});

test("requires a configured research registry for every public publication", async () => {
  loadRegistryConfig.mockResolvedValueOnce({
    mode: "private",
    registries: ["https://registry.example/public/test"],
    privateRegistry: "https://pod.example/laura/registry/",
  });

  await expect(publishPublicDataset(session, publicInput)).rejects.toMatchObject({
    code: "discoverable-registry-required",
  });
  expect(ensurePublicReadOnlyResourceAccess).not.toHaveBeenCalled();
  expect(createDataset).not.toHaveBeenCalled();
});

test("fails before catalog publication when public ACL verification fails", async () => {
  ensurePublicReadOnlyResourceAccess.mockRejectedValueOnce(
    new Error("ACL unavailable")
  );
  await expect(publishPublicDataset(session, publicInput)).rejects.toThrow(
    "ACL unavailable"
  );
  expect(createDataset).not.toHaveBeenCalled();
});

test("cleans public metadata when post-publication ACL verification fails", async () => {
  ensurePublicReadOnlyResourceAccess
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("dataset metadata ACL unavailable"));

  await expect(publishPublicDataset(session, publicInput)).rejects.toThrow(
    "dataset metadata ACL unavailable"
  );
  expect(deleteDatasetEntry).toHaveBeenCalledWith(
    session,
    "https://pod.example/laura/catalog/ds/solid-tours-route-template-run-1.ttl#it",
    publicInput.identifier,
    { podRoot: "https://pod.example/laura/" }
  );
});

test("updates an existing public dataset at its deterministic URL without recreating it", async () => {
  const podRoot = "https://storage.example/alex/";
  const datasetUrl = `${podRoot}catalog/ds/${publicInput.identifier}.ttl#it`;
  const recordUrl = `${podRoot}catalog/ds/${publicInput.identifier}.ttl`;
  const distributionUrl = `${podRoot}solid-tours/public-routes/run-1.geojson`;
  const issued = "2026-08-20T14:00:00.000Z";
  const operationId = "69020722-f94e-4d99-9aac-37b33d5607c7";

  await expect(
    updatePublicDataset(session, {
      ...publicInput,
      podRoot,
      datasetUrl,
      distributionUrl,
      issued,
      operationId,
      title: "Updated public Wuppertal route",
    })
  ).resolves.toEqual({
    identifier: publicInput.identifier,
    datasetUrl,
    recordUrl,
    distributionUrl,
  });

  expect(assertCatalogDatasetDeletionTarget).toHaveBeenCalledWith(
    podRoot,
    datasetUrl,
    publicInput.identifier
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    1,
    session,
    distributionUrl,
    { podRoot }
  );
  expect(ensurePublicReadOnlyResourceAccess.mock.invocationCallOrder[0]).toBeLessThan(
    updateDataset.mock.invocationCallOrder[0]
  );
  expect(updateDataset).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      identifier: publicInput.identifier,
      title: "Updated public Wuppertal route",
      podRoot,
      datasetUrl,
      access_url_dataset: distributionUrl,
      issued,
      operation_id: operationId,
      is_public: true,
      strict_public_acl: true,
    })
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    2,
    session,
    datasetUrl,
    { podRoot }
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    3,
    session,
    recordUrl,
    { podRoot }
  );
  expect(ensurePublicReadOnlyResourceAccess).toHaveBeenNthCalledWith(
    4,
    session,
    `${podRoot}catalog/cat.ttl`,
    { podRoot }
  );
  expect(createDataset).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test.each([
  " update-route-run-1",
  "update-route-run-1 ",
  "update/route/run-1",
  "update#route-run-1",
  "update route run 1",
])("rejects an unsafe public update operation ID %p", async (operationId) => {
  const datasetUrl = `https://pod.example/laura/catalog/ds/${publicInput.identifier}.ttl#it`;

  await expect(
    updatePublicDataset(session, {
      ...publicInput,
      datasetUrl,
      operationId,
    })
  ).rejects.toThrow("Operation ID contains unsupported characters.");

  expect(ensurePublicReadOnlyResourceAccess).not.toHaveBeenCalled();
  expect(updateDataset).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test("rejects a public update whose dataset URL is not the deterministic identifier target", async () => {
  await expect(
    updatePublicDataset(session, {
      ...publicInput,
      datasetUrl:
        "https://pod.example/laura/catalog/ds/another-route.ttl#it",
    })
  ).rejects.toThrow(/deterministic catalog URL/);

  expect(ensurePublicReadOnlyResourceAccess).not.toHaveBeenCalled();
  expect(updateDataset).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test("never deletes the existing entry when a public dataset update fails", async () => {
  const datasetUrl = `https://pod.example/laura/catalog/ds/${publicInput.identifier}.ttl#it`;
  updateDataset.mockRejectedValueOnce(new Error("catalog update failed"));

  await expect(
    updatePublicDataset(session, { ...publicInput, datasetUrl })
  ).rejects.toThrow("catalog update failed");

  expect(updateDataset).toHaveBeenCalledTimes(1);
  expect(createDataset).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test("requires the existing deterministic catalog reference for a public update", async () => {
  await expect(updatePublicDataset(session, publicInput)).rejects.toThrow(
    "existing catalog dataset URL"
  );
  expect(updateDataset).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test("reports catalog readiness only for safe public research registries", async () => {
  loadRegistryConfig.mockResolvedValueOnce({
    mode: "research",
    registries: [
      "https://registry.example/public/test/",
      "http://registry.example/public/insecure",
      "javascript:alert(1)",
      "https://user:secret@registry.example/private",
    ],
    privateRegistry: "",
  });

  await expect(getCatalogReadiness(session)).resolves.toEqual({
    catalogConfigured: true,
    publicRegistries: ["https://registry.example/public/test"],
  });
});

test("exposes only normalized safe public registry presets", () => {
  expect(getPublicRegistryPresets()).toEqual([
    {
      id: "test",
      label: "Test",
      url: "https://registry.example/public/test",
    },
  ]);
});

test("configures and verifies an explicitly selected public research registry", async () => {
  loadRegistryConfig
    .mockResolvedValueOnce({
      mode: "private",
      registries: [],
      privateRegistry: "https://pod.example/laura/registry/",
    })
    .mockResolvedValueOnce({
      mode: "research",
      registries: ["https://registry.example/public/test"],
      privateRegistry: "https://pod.example/laura/registry/",
    });

  await expect(
    ensurePublicCatalogReadiness(session, {
      podRoot: "https://pod.example/laura/",
      registryUrl: "https://registry.example/public/test/",
      catalogTitle: "City Tours Catalog",
    })
  ).resolves.toEqual({
    catalogConfigured: true,
    publicRegistries: ["https://registry.example/public/test"],
    selectedRegistry: "https://registry.example/public/test",
  });

  const expectedConfig = {
    mode: "research",
    registries: ["https://registry.example/public/test"],
    privateRegistry: "https://pod.example/laura/registry/",
  };
  expect(saveRegistryConfig).toHaveBeenCalledWith(
    session.info.webId,
    session.fetch,
    expectedConfig,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(ensureCatalogStructure).toHaveBeenCalledWith(session, {
    podRoot: "https://pod.example/laura/",
    registryConfig: expectedConfig,
    title: "City Tours Catalog",
  });
});

test("does not mutate profile or Catalog for an unapproved registry URL", async () => {
  loadRegistryConfig.mockResolvedValueOnce({
    mode: "private",
    registries: [],
    privateRegistry: "https://pod.example/laura/registry/",
  });

  await expect(
    ensurePublicCatalogReadiness(session, {
      registryUrl: "https://attacker.example/public/registry",
    })
  ).rejects.toThrow(/not an available preset/);
  expect(saveRegistryConfig).not.toHaveBeenCalled();
  expect(ensureCatalogStructure).not.toHaveBeenCalled();
});

test("discovers only valid public datasets from configured research registries", async () => {
  const valid = {
    identifier: publicInput.identifier,
    title: publicInput.title,
    description: publicInput.description,
    publisher: "Hannah Mueller",
    webid: session.info.webId,
    datasetUrl:
      "https://pod.example/laura/catalog/ds/solid-tours-route-template-run-1.ttl#it",
    access_url_dataset: publicInput.distributionUrl,
    file_format: "application/geo+json",
    theme: publicInput.theme,
    is_public: true,
    datasetType: "dataset",
  };
  loadAggregatedDatasets.mockResolvedValueOnce({
    datasets: [
      valid,
      { ...valid, identifier: "restricted", is_public: false },
      {
        ...valid,
        identifier: "solid-tours-route-template-unsafe",
        access_url_dataset: "https://user:secret@pod.example/route.geojson",
      },
      {
        ...valid,
        identifier: "solid-tours-route-template-series",
        datasetType: "series",
      },
      {
        ...valid,
        identifier: "solid-tours-route-template-other",
        theme: "https://example.org/theme/other",
      },
    ],
    catalogs: [],
  });

  const result = await discoverPublicDatasets(session, {
    identifierPrefix: "solid-tours-route-template-",
    mediaType: "application/geo+json",
    theme: publicInput.theme,
  });

  expect(loadAggregatedDatasets).toHaveBeenCalledWith(session, undefined, {
    researchRegistries: ["https://registry.example/public/test"],
  });
  expect(result).toEqual([
    {
      identifier: publicInput.identifier,
      title: publicInput.title,
      description: publicInput.description,
      publisher: "Hannah Mueller",
      creatorWebId: session.info.webId,
      datasetUrl: valid.datasetUrl,
      distributionUrl: publicInput.distributionUrl,
      mediaType: "application/geo+json",
      theme: publicInput.theme,
    },
  ]);
});

test("fails discovery before registry reads without research readiness", async () => {
  loadRegistryConfig.mockResolvedValueOnce({
    mode: "research",
    registries: [],
    privateRegistry: "",
  });
  await expect(discoverPublicDatasets(session)).rejects.toMatchObject({
    code: "discoverable-registry-required",
  });
  expect(loadAggregatedDatasets).not.toHaveBeenCalled();
});

test("publishes only after the distribution ACL was verified restricted", async () => {
  const result = await publishRestrictedDataset(session, input);

  expect(ensureRestrictedResourceAccess).toHaveBeenCalledWith(
    session,
    input.distributionUrl,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(ensureRestrictedResourceAccess.mock.invocationCallOrder[0]).toBeLessThan(
    createDataset.mock.invocationCallOrder[0]
  );
  expect(createDataset).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      access_url_dataset: input.distributionUrl,
      is_public: false,
      strict_restricted_acl: true,
      webid: "",
    })
  );
  expect(result).toMatchObject({
    identifier: input.identifier,
    distributionUrl: input.distributionUrl,
    recordUrl:
      "https://pod.example/laura/catalog/ds/solid-tours-activity-run-1.ttl",
  });
});

test("requires and binds a public registry for discoverable publication", async () => {
  await publishRestrictedDataset(session, {
    ...input,
    podRoot: "https://storage.example/alex/",
    distributionUrl:
      "https://storage.example/alex/solid-tours/runs/run-1/activity.geojson",
    requireDiscoverableRegistry: true,
  });

  expect(loadRegistryConfig).toHaveBeenCalledWith(
    session.info.webId,
    session.fetch,
    { podRoot: "https://storage.example/alex/" }
  );
  expect(createDataset).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      registryConfig: {
        mode: "research",
        registries: ["https://registry.example/public/test"],
        privateRegistry: "",
      },
    })
  );
});

test.each([
  { mode: "research", registries: [], privateRegistry: "" },
  {
    mode: "private",
    registries: [],
    privateRegistry: "https://storage.example/alex/registry/",
  },
])(
  "fails before ACL or Catalog writes without a discoverable public registry",
  async (registryConfig) => {
    loadRegistryConfig.mockResolvedValueOnce(registryConfig);

    await expect(
      publishRestrictedDataset(session, {
        ...input,
        requireDiscoverableRegistry: true,
      })
    ).rejects.toMatchObject({ code: "discoverable-registry-required" });
    expect(ensureRestrictedResourceAccess).not.toHaveBeenCalled();
    expect(createDataset).not.toHaveBeenCalled();
  }
);

test("fails before catalog publication when restricted ACL verification fails", async () => {
  ensureRestrictedResourceAccess.mockRejectedValue(new Error("ACL unavailable"));
  await expect(publishRestrictedDataset(session, input)).rejects.toThrow(
    "ACL unavailable"
  );
  expect(createDataset).not.toHaveBeenCalled();
});

test("cleans incomplete metadata without masking a publication error", async () => {
  createDataset.mockRejectedValue(new Error("catalog write failed"));
  await expect(publishRestrictedDataset(session, input)).rejects.toThrow(
    "catalog write failed"
  );
  expect(deleteDatasetEntry).toHaveBeenCalledWith(
    session,
    "https://pod.example/laura/catalog/ds/solid-tours-activity-run-1.ttl#it",
    input.identifier,
    { podRoot: "https://pod.example/laura/" }
  );
});

test("removes a dataset idempotently from an identifier reference", async () => {
  const result = await removeDataset(session, { identifier: input.identifier });
  expect(assertCatalogDatasetDeletionTarget).toHaveBeenCalledWith(
    "https://pod.example/laura/",
    "https://pod.example/laura/catalog/ds/solid-tours-activity-run-1.ttl#it",
    input.identifier
  );
  expect(deleteDatasetEntry).toHaveBeenCalledWith(
    session,
    "https://pod.example/laura/catalog/ds/solid-tours-activity-run-1.ttl#it",
    input.identifier,
    { podRoot: "https://pod.example/laura/" }
  );
  expect(result.removed).toBe(true);
});

test("fails closed before deletion when the dataset target is outside the selected Pod catalog", async () => {
  assertCatalogDatasetDeletionTarget.mockImplementationOnce(() => {
    throw new Error("Unsafe catalog deletion target");
  });

  await expect(
    removeDataset(session, {
      identifier: input.identifier,
      datasetUrl: "https://pod.example/laura/private/notes.ttl#it",
    })
  ).rejects.toThrow("Unsafe catalog deletion target");
  expect(deleteDatasetEntry).not.toHaveBeenCalled();
});

test("does not report removal when dataset or record cleanup is incomplete", async () => {
  const partialFailure = new AggregateError(
    [new Error("record delete failed")],
    "Catalog dataset deletion incomplete"
  );
  deleteDatasetEntry.mockRejectedValueOnce(partialFailure);

  await expect(
    removeDataset(session, { identifier: input.identifier })
  ).rejects.toBe(partialFailure);
});

test("publishes and removes metadata below an explicitly resolved external storage root", async () => {
  const podRoot = "https://storage.example/alex";
  const normalizedPodRoot = `${podRoot}/`;
  const externalInput = {
    ...input,
    podRoot,
    distributionUrl:
      "https://storage.example/alex/solid-tours/runs/run-1/activity.geojson",
  };
  createDataset.mockResolvedValueOnce({
    datasetUrl:
      "https://storage.example/alex/catalog/ds/solid-tours-activity-run-1.ttl#it",
    identifier: input.identifier,
  });

  const publication = await publishRestrictedDataset(session, externalInput);

  expect(getPodRoot).not.toHaveBeenCalled();
  expect(ensureRestrictedResourceAccess).toHaveBeenCalledWith(
    session,
    externalInput.distributionUrl,
    { podRoot: normalizedPodRoot }
  );
  expect(createDataset).toHaveBeenCalledWith(
    session,
    expect.objectContaining({ podRoot: normalizedPodRoot })
  );
  expect(publication).toMatchObject({
    datasetUrl:
      "https://storage.example/alex/catalog/ds/solid-tours-activity-run-1.ttl#it",
    recordUrl:
      "https://storage.example/alex/catalog/ds/solid-tours-activity-run-1.ttl",
  });

  jest.clearAllMocks();
  deleteDatasetEntry.mockResolvedValue(undefined);
  const removal = await removeDataset(session, {
    identifier: input.identifier,
    podRoot,
  });
  expect(getPodRoot).not.toHaveBeenCalled();
  expect(deleteDatasetEntry).toHaveBeenCalledWith(
    session,
    "https://storage.example/alex/catalog/ds/solid-tours-activity-run-1.ttl#it",
    input.identifier,
    { podRoot: normalizedPodRoot }
  );
  expect(removal.datasetUrl).toBe(
    "https://storage.example/alex/catalog/ds/solid-tours-activity-run-1.ttl#it"
  );
});

test.each([
  "ftp://storage.example/alex/",
  "https://user:secret@storage.example/alex/",
  "https://storage.example/alex/?tenant=other",
  "https://storage.example/alex/#catalog",
  " https://storage.example/alex/",
])("rejects an unsafe Pod root %s", (podRoot) => {
  expect(() =>
    normalizeRestrictedDatasetInput(session, { ...input, podRoot })
  ).toThrow("Pod root must be an absolute HTTP(S) container URL.");
});

test("theme remains optional for new public entries", () => {
  expect(normalizePublicDatasetInput(session, { ...publicInput, theme: "" }).theme).toBe("");
});


test("accepts multiple representations without scalar aliases and keeps external schema references out of ACL writes", async () => {
  const distributions = [
    { downloadURL: "https://pod.example/laura/a.csv", mediaType: "text/csv", conformsTo: ["https://example.org/csv-schema"] },
    { downloadURL: "https://pod.example/laura/a.json", mediaType: "application/json", conformsTo: ["https://example.org/json-schema"] },
  ];
  await publishRestrictedDataset(session, { identifier: "multi", title: "Multi", distributions });
  expect(createDataset.mock.calls[0][1].distributions).toEqual(distributions);
  expect(ensureRestrictedResourceAccess.mock.calls.map(([, url]) => url)).toEqual(distributions.map(item => item.downloadURL));
});

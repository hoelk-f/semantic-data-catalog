import { TextDecoder, TextEncoder } from "util";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const mockGetSolidDataset = jest.fn();
const mockSaveSolidDatasetAt = jest.fn();
const mockDeleteFile = jest.fn();

jest.mock("@inrupt/solid-client", () => {
  const actual = jest.requireActual("@inrupt/solid-client");
  return {
    ...actual,
    getSolidDataset: (...args) => mockGetSolidDataset(...args),
    saveSolidDatasetAt: (...args) => mockSaveSolidDatasetAt(...args),
    deleteFile: (...args) => mockDeleteFile(...args),
  };
});

jest.mock("./profileRdf", () => ({
  ...jest.requireActual("./profileRdf"),
  saveProfileDocument: (url, _previous, document) => mockSaveSolidDatasetAt(url, document),
}));

const {
  createSolidDataset,
  createThing,
  getDatetime,
  getThing,
  getUrl,
  getUrlAll,
  setStringNoLocale,
  setThing,
  setUrl,
} = require("@inrupt/solid-client");
const {
  assertCatalogDatasetDeletionTarget,
  buildDefaultPrivateRegistry,
  deleteDatasetEntry,
  loadRegistryConfig,
  saveRegistryConfig,
  updateDataset,
} = require("./solidCatalog");

const WEB_ID = "https://identity.example/users/alex#me";
const POD_ROOT = "https://storage.example/alex/";
const PROFILE_DOC = "https://identity.example/users/alex";
const REGISTRY_MODE = "https://w3id.org/solid-dataspace-manager#registryMode";
const REGISTRY = "https://w3id.org/solid-dataspace-manager#registry";
const PRIVATE_REGISTRY =
  "https://w3id.org/solid-dataspace-manager#privateRegistry";
const PUBLIC_REGISTRY = "https://registry.example/public/research";

const profileDataset = ({ mode = "research", registries = [], privateRegistry = "" } = {}) => {
  let profile = createThing({ url: WEB_ID });
  profile = setStringNoLocale(profile, REGISTRY_MODE, mode);
  registries.forEach((registryUrl) => {
    profile = setUrl(profile, REGISTRY, registryUrl);
  });
  if (privateRegistry) profile = setUrl(profile, PRIVATE_REGISTRY, privateRegistry);
  return setThing(createSolidDataset(), profile);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveSolidDatasetAt.mockResolvedValue(undefined);
});

test("accepts only the exact direct dataset document selected for deletion", () => {
  const identifier = "solid-tours-activity-run-1";
  const expected = `${POD_ROOT}catalog/ds/${identifier}.ttl#it`;

  expect(
    assertCatalogDatasetDeletionTarget(POD_ROOT, expected, identifier)
  ).toBe(expected);
  expect(
    assertCatalogDatasetDeletionTarget(POD_ROOT, expected)
  ).toBe(expected);
});

test.each([
  ["outside the catalog", `${POD_ROOT}private/notes.ttl#it`, "notes"],
  ["outside the Pod", "https://other.example/catalog/ds/tours.ttl#it", "tours"],
  ["nested below ds", `${POD_ROOT}catalog/ds/archive/tours.ttl#it`, "tours"],
  ["with a mismatched identifier", `${POD_ROOT}catalog/ds/other.ttl#it`, "tours"],
  ["without the dataset fragment", `${POD_ROOT}catalog/ds/tours.ttl`, "tours"],
  ["with a query", `${POD_ROOT}catalog/ds/tours.ttl?delete=true#it`, "tours"],
])("rejects a deletion target %s", (_label, datasetUrl, identifier) => {
  expect(() =>
    assertCatalogDatasetDeletionTarget(POD_ROOT, datasetUrl, identifier)
  ).toThrow("Dataset URL must identify a direct catalog/ds");
});

test("deleteDatasetEntry rejects an unsafe target before Pod reads or deletes", async () => {
  const session = { info: { webId: WEB_ID }, fetch: jest.fn() };

  await expect(
    deleteDatasetEntry(
      session,
      `${POD_ROOT}private/notes.ttl#it`,
      "notes",
      { podRoot: POD_ROOT }
    )
  ).rejects.toThrow("Dataset URL must identify a direct catalog/ds");
  expect(session.fetch).not.toHaveBeenCalled();
  expect(mockGetSolidDataset).not.toHaveBeenCalled();
  expect(mockDeleteFile).not.toHaveBeenCalled();
});

test("uses the resolved Pod root for every default private-registry fallback", async () => {
  mockGetSolidDataset.mockResolvedValueOnce(profileDataset({ mode: "private" }));

  expect(buildDefaultPrivateRegistry(WEB_ID, POD_ROOT)).toBe(
    `${POD_ROOT}registry/`
  );
  await expect(
    loadRegistryConfig(WEB_ID, jest.fn(), { podRoot: POD_ROOT })
  ).resolves.toMatchObject({
    mode: "private",
    privateRegistry: `${POD_ROOT}registry/`,
  });
});

test("saveRegistryConfig keeps public registries unchanged while defaulting private storage to podRoot", async () => {
  const current = profileDataset();
  mockGetSolidDataset.mockResolvedValueOnce(current);
  const fetch = jest.fn();

  await saveRegistryConfig(
    WEB_ID,
    fetch,
    { mode: "research", registries: [PUBLIC_REGISTRY] },
    { podRoot: POD_ROOT }
  );

  expect(mockGetSolidDataset).toHaveBeenCalledWith(PROFILE_DOC, { fetch });
  expect(mockSaveSolidDatasetAt).toHaveBeenCalledTimes(1);
  const [, savedProfile, options] = mockSaveSolidDatasetAt.mock.calls[0];
  const profile = getThing(savedProfile, WEB_ID);
  expect(getUrlAll(profile, REGISTRY)).toEqual([PUBLIC_REGISTRY]);
  expect(getUrl(profile, PRIVATE_REGISTRY)).toBe(`${POD_ROOT}registry/`);
  expect(options).toEqual({ fetch });
});

test("updateDataset keeps the Catalog and record at the explicit Pod root", async () => {
  const identifier = "solid-tours-route-template-run-1";
  const datasetDocUrl = `${POD_ROOT}catalog/ds/${identifier}.ttl`;
  const datasetUrl = `${datasetDocUrl}#it`;
  const recordDocUrl = `${POD_ROOT}catalog/ds/${identifier}.ttl`;
  const catalogDocUrl = `${POD_ROOT}catalog/cat.ttl`;
  const catalogBody = [
    "@prefix dcat: <http://www.w3.org/ns/dcat#>.",
    "@prefix dcterms: <http://purl.org/dc/terms/>.",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.",
    "<#it> a dcat:Catalog ;",
    '  dcterms:title "External storage catalog" ;',
    '  dcterms:modified "2026-08-29T10:00:00.000Z"^^xsd:dateTime .',
  ].join("\n");
  const response = (url, status, { body = "", etag = "" } = {}) => ({
    url,
    status,
    ok: status >= 200 && status < 300,
    redirected: false,
    headers: {
      get: (name) => (name.toLowerCase() === "etag" ? etag || null : null),
    },
    text: async () => body,
  });
  const fetch = jest.fn(async (url, options = {}) => {
    const method = String(options.method || "GET").toUpperCase();
    if (url === catalogDocUrl && method === "GET" && options.cache === "no-store") {
      return response(url, 200, { body: catalogBody, etag: '"catalog-v1"' });
    }
    if (url === catalogDocUrl && method === "PATCH") {
      return response(url, 204, { etag: '"catalog-v2"' });
    }
    if (url === datasetDocUrl && method === "HEAD") {
      return response(url, 200);
    }
    return response(url, 404);
  });
  const session = { info: { webId: WEB_ID }, fetch };
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  mockGetSolidDataset.mockResolvedValue(createSolidDataset());

  try {
    await updateDataset(session, {
      podRoot: POD_ROOT,
      datasetUrl,
      identifier,
      title: "Updated route",
      description: "Updated indexed route",
      access_url_dataset: `${POD_ROOT}solid-tours/public/cataloged-routes/run-1.geojson`,
      file_format: "application/geo+json",
    access_url_semantic_model: "https://geojson.org/schema/FeatureCollection.json",
      distribution_access_type: "download",
      is_public: false,
    });
  } finally {
    warning.mockRestore();
  }

  expect(mockSaveSolidDatasetAt.mock.calls.map(([url]) => url)).toEqual([
    datasetDocUrl,
  ]);
  expect(fetch).toHaveBeenCalledWith(
    catalogDocUrl,
    expect.objectContaining({ method: "GET", cache: "no-store" })
  );
  expect(fetch).toHaveBeenCalledWith(
    catalogDocUrl,
    expect.objectContaining({ method: "PATCH" })
  );
  expect(fetch.mock.calls.some(([url]) =>
    String(url).startsWith("https://identity.example/users/alex/catalog/")
  )).toBe(false);
});

test("updateDataset rejects a missing dataset document instead of creating it", async () => {
  const identifier = "solid-tours-route-template-missing";
  const datasetUrl = `${POD_ROOT}catalog/ds/${identifier}.ttl#it`;
  const notFound = Object.assign(new Error("Dataset not found"), {
    statusCode: 404,
  });
  const fetch = jest.fn();
  mockGetSolidDataset.mockRejectedValueOnce(notFound);

  await expect(
    updateDataset(
      { info: { webId: WEB_ID }, fetch },
      {
        podRoot: POD_ROOT,
        datasetUrl,
        identifier,
        access_url_dataset: `${POD_ROOT}solid-tours/public/cataloged-routes/missing.geojson`,
        file_format: "application/geo+json",
        access_url_semantic_model: "https://geojson.org/schema/FeatureCollection.json",
        distribution_access_type: "download",
        is_public: false,
      }
    )
  ).rejects.toBe(notFound);

  expect(mockSaveSolidDatasetAt).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

test("updateDataset preserves issued and reuses the operation change IRI on retry", async () => {
  const identifier = "solid-tours-route-template-retry";
  const datasetDocUrl = `${POD_ROOT}catalog/ds/${identifier}.ttl`;
  const datasetUrl = `${datasetDocUrl}#it`;
  const recordDocUrl = `${POD_ROOT}catalog/ds/${identifier}.ttl`;
  const catalogDocUrl = `${POD_ROOT}catalog/cat.ttl`;
  const operationId = "69020722-f94e-4d99-9aac-37b33d5607c7";
  const issued = "2026-08-20T14:00:00.000Z";
  const changeUrl = `${recordDocUrl}#change-${operationId}`;
  const changeLog = "https://w3id.org/solid-dataspace-manager#changeLog";
  const issuedPredicate = "http://purl.org/dc/terms/issued";
  const catalogBody = [
    "@prefix dcat: <http://www.w3.org/ns/dcat#>.",
    "@prefix dcterms: <http://purl.org/dc/terms/>.",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.",
    "<#it> a dcat:Catalog ;",
    '  dcterms:title "External storage catalog" ;',
    '  dcterms:modified "2026-08-29T10:00:00.000Z"^^xsd:dateTime .',
  ].join("\n");
  const response = (url, status, { body = "", etag = "" } = {}) => ({
    url,
    status,
    ok: status >= 200 && status < 300,
    redirected: false,
    headers: {
      get: (name) => (name.toLowerCase() === "etag" ? etag || null : null),
    },
    text: async () => body,
  });
  const fetch = jest.fn(async (url, options = {}) => {
    const method = String(options.method || "GET").toUpperCase();
    if (url === catalogDocUrl && method === "GET" && options.cache === "no-store") {
      return response(url, 200, { body: catalogBody, etag: '"catalog-v1"' });
    }
    if (url === catalogDocUrl && method === "PATCH") {
      return response(url, 204, { etag: '"catalog-v2"' });
    }
    if (url === datasetDocUrl && method === "HEAD") {
      return response(url, 200);
    }
    return response(url, 404);
  });
  let currentRecord = null;
  mockGetSolidDataset.mockImplementation(async (url) => {
    if (url === datasetDocUrl) return currentRecord || createSolidDataset();
    if (url === recordDocUrl) {
      if (currentRecord) return currentRecord;
      throw Object.assign(new Error("Record not found"), { statusCode: 404 });
    }
    throw Object.assign(new Error("Not found"), { statusCode: 404 });
  });
  mockSaveSolidDatasetAt.mockImplementation(async (url, dataset) => {
    if (url === recordDocUrl) currentRecord = dataset;
  });
  const input = {
    podRoot: POD_ROOT,
    datasetUrl,
    identifier,
    title: "Updated route",
    description: "Updated indexed route",
    issued,
    operation_id: operationId,
    access_url_dataset: `${POD_ROOT}solid-tours/public/cataloged-routes/retry.geojson`,
    file_format: "application/geo+json",
    access_url_semantic_model: "https://geojson.org/schema/FeatureCollection.json",
    distribution_access_type: "download",
    is_public: false,
  };
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});

  try {
    await updateDataset({ info: { webId: WEB_ID }, fetch }, input);
    await updateDataset({ info: { webId: WEB_ID }, fetch }, input);
  } finally {
    warning.mockRestore();
  }

  const savedDatasetDocuments = mockSaveSolidDatasetAt.mock.calls
    .filter(([url]) => url === datasetDocUrl)
    .map(([, dataset]) => dataset);
  expect(savedDatasetDocuments).toHaveLength(2);
  savedDatasetDocuments.forEach((dataset) => {
    expect(getDatetime(getThing(dataset, datasetUrl), issuedPredicate)?.toISOString()).toBe(
      issued
    );
  });

  const savedRecords = mockSaveSolidDatasetAt.mock.calls
    .filter(([url]) => url === recordDocUrl)
    .map(([, dataset]) => dataset);
  expect(savedRecords).toHaveLength(2);
  savedRecords.forEach((record) => {
    const descriptionRecord = getThing(record, recordDocUrl);
    expect(getUrlAll(descriptionRecord, changeLog)).toEqual([changeUrl]);
    expect(getThing(record, changeUrl)).not.toBeNull();
  });
});

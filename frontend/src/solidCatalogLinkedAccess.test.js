/** @jest-environment node */
const mockGetSolidDatasetWithAcl = jest.fn();
const mockSaveAclFor = jest.fn();
const mockSaveProfileDocument = jest.fn();

jest.mock("@inrupt/solid-client", () => ({
  ...jest.requireActual("@inrupt/solid-client"),
  getSolidDatasetWithAcl: (...args) => mockGetSolidDatasetWithAcl(...args),
  hasResourceAcl: () => true,
  getResourceAcl: resource => ({ url: resource.url, access: resource.access }),
  setPublicResourceAccess: (acl, access) => ({ ...acl, access }),
  getPublicResourceAccess: acl => acl.access,
  saveAclFor: (...args) => mockSaveAclFor(...args),
}));
jest.mock("./profileRdf", () => ({
  ...jest.requireActual("./profileRdf"),
  saveProfileDocument: (...args) => mockSaveProfileDocument(...args),
}));

const { updateDataset } = require("./solidCatalog");
const { getThing, getUrlAll } = require("@inrupt/solid-client");
const root = "https://pod.example/alice/";
const datasetDoc = root + "catalog/ds/activity.ttl";
const catalogDoc = root + "catalog/cat.ttl";
const dataUrl = root + "solid-tours/runs/activity.geojson";
const schema = "https://geojson.org/schema/FeatureCollection.json";
const privateAccess = { read: false, append: false, write: false, control: false };
let session;

beforeEach(() => {
  jest.clearAllMocks();
  const accessByUrl = new Map();
  mockGetSolidDatasetWithAcl.mockImplementation(async url => ({
    url, access: accessByUrl.get(url) || privateAccess,
  }));
  mockSaveAclFor.mockImplementation(async (resource, acl) => {
    accessByUrl.set(resource.url, acl.access);
  });
  mockSaveProfileDocument.mockResolvedValue(undefined);
  session = {
    info: { webId: root + "profile/card#me" },
    fetch: jest.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      let response;
      if (url === datasetDoc && method === "GET") {
        response = new Response('<#it> a <http://www.w3.org/ns/dcat#Dataset>.', {
          headers: { "Content-Type": "text/turtle" },
        });
      } else if (url === catalogDoc && method === "GET") {
        response = new Response('<#it> a <http://www.w3.org/ns/dcat#Catalog>.', {
          headers: { "Content-Type": "text/turtle", ETag: '"v1"' },
        });
      } else if (url === catalogDoc && method === "PATCH") {
        response = new Response(null, { status: 204, headers: { ETag: '"v2"' } });
      } else {
        throw new Error(`Unexpected request: ${method} ${url}`);
      }
      Object.defineProperty(response, "url", { value: url });
      return response;
    }),
  };
});

const input = overrides => ({
  podRoot: root,
  datasetUrl: datasetDoc + "#it",
  identifier: "activity",
  title: "Completed tours",
  access_url_dataset: dataUrl,
  access_url_semantic_model: schema,
  file_format: "application/geo+json",
  is_public: false,
  strict_restricted_acl: true,
  ...overrides,
});

test.each([schema, "urn:example:activity-schema"])(
  "restricted dataset updates retain external schema %s without changing its ACL",
  async model => {
    await expect(updateDataset(session, input({ access_url_semantic_model: model }))).resolves.toBeUndefined();
    const document = mockSaveProfileDocument.mock.calls[0][2];
    expect(getUrlAll(getThing(document, datasetDoc + "#dist"), "http://purl.org/dc/terms/conformsTo")).toEqual([model]);
    expect(mockSaveAclFor).toHaveBeenCalledWith(
      expect.objectContaining({ url: dataUrl }),
      expect.objectContaining({ access: privateAccess }),
      { fetch: session.fetch }
    );
    expect(mockGetSolidDatasetWithAcl.mock.calls.map(([url]) => url)).toEqual([
      datasetDoc, dataUrl, dataUrl, catalogDoc,
    ]);
    expect(session.fetch.mock.calls.every(([url]) => url.startsWith(root))).toBe(true);
  }
);

test("a local model still receives the dataset's restricted access", async () => {
  const model = root + "models/activity.ttl";
  await updateDataset(session, input({ access_url_semantic_model: model }));
  expect(mockSaveAclFor).toHaveBeenCalledWith(
    expect.objectContaining({ url: model }),
    expect.objectContaining({ access: privateAccess }),
    { fetch: session.fetch }
  );
});

test("external data remains rejected even if the same URL is used as the schema", async () => {
  await expect(updateDataset(session, input({ access_url_dataset: schema }))).rejects.toThrow("outside the owner's Pod");
  expect(mockGetSolidDatasetWithAcl.mock.calls.every(([url]) => url.startsWith(root))).toBe(true);
  expect(session.fetch).not.toHaveBeenCalledWith(catalogDoc, expect.anything());
});

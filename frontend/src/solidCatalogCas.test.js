import { TextDecoder, TextEncoder } from "util";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const { Parser, Writer, Store, DataFactory } = require("n3");
const {
  ensureCatalogDocument,
  updateCatalogDatasets,
} = require("./solidCatalog");

const CATALOG_URL = "https://pod.example/hannah/catalog/cat.ttl";
const DATASET_A = "https://pod.example/hannah/catalog/ds/a.ttl#it";
const DATASET_B = "https://pod.example/hannah/catalog/ds/b.ttl#it";
const DCAT_DATASET = "http://www.w3.org/ns/dcat#dataset";

const catalogTurtle = (refs = []) => [
  "@prefix dcat: <http://www.w3.org/ns/dcat#>.",
  "@prefix dcterms: <http://purl.org/dc/terms/>.",
  "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.",
  "",
  "<#it> a dcat:Catalog ;",
  '  dcterms:title "Test catalog" ;',
  '  dcterms:modified "2026-08-21T10:00:00.000Z"^^xsd:dateTime ;',
  ...(refs.length
    ? ["  dcat:dataset", `    ${refs.map((ref) => `<${ref}>`).join(" ,\n    ")} .`]
    : ["  ."]),
].join("\n");

const response = ({ url, status, body = "", etag = "", location = "" }) => ({
  url,
  status,
  ok: status >= 200 && status < 300,
  redirected: false,
  headers: {
    get: (name) => {
      if (name.toLowerCase() === "location") return location || null;
      if (name.toLowerCase() === "etag") return etag || null;
      if (name.toLowerCase() === "content-type") return "text/turtle";
      return null;
    },
  },
  text: async () => body,
});

const createCatalogServer = ({
  initialRefs = [],
  initialEtag = '"v1"',
  synchronizeFirstReads = 0,
  readStatus = 200,
} = {}) => {
  let body = catalogTurtle(initialRefs);
  let etag = initialEtag;
  let version = 1;
  let conflicts = 0;
  let writes = 0;
  let casReads = 0;
  let releaseReads;
  const readsReleased = new Promise((resolve) => {
    releaseReads = resolve;
  });

  const fetch = jest.fn(async (url, options = {}) => {
    const method = String(options.method || "GET").toUpperCase();
    const isCasRead =
      url === CATALOG_URL && method === "GET" && options.cache === "no-store";

    if (isCasRead) {
      casReads += 1;
      const snapshot = response({ url, status: readStatus, body, etag });
      const snapshotText = snapshot.text;
      if (synchronizeFirstReads > 0 && casReads <= synchronizeFirstReads) {
        if (casReads === synchronizeFirstReads) releaseReads();
        snapshot.text = async () => {
          await readsReleased;
          return snapshotText();
        };
      }
      return snapshot;
    }

    if ((url === CATALOG_URL && method === "PATCH") || (url === new URL("./", CATALOG_URL).href && method === "POST")) {
      writes += 1;
      const ifMatch = options.headers?.["If-Match"];
      const ifNoneMatch = options.headers?.["If-None-Match"];
      const exists = readStatus !== 404;
      const matches = exists ? method === "PATCH" && ifMatch === etag : method === "POST";
      if (!matches) {
        conflicts += 1;
        return response({ url, status: 412, body, etag });
      }
      if (method === "POST") body = options.body;
      else {
        const quads = new Parser({ format: "N3", baseIRI: CATALOG_URL }).parse(options.body);
        const store = new Store(new Parser({ baseIRI: CATALOG_URL }).parse(body));
        for (const [operation, action] of [["deletes", "removeQuads"], ["inserts", "addQuads"]]) {
          const graph = quads.find((quad) => quad.predicate.value === `http://www.w3.org/ns/solid/terms#${operation}`).object;
          store[action](quads.filter((quad) => quad.graph.equals(graph)).map((quad) =>
            DataFactory.quad(quad.subject, quad.predicate, quad.object)));
        }
        body = new Writer({ format: "N-Triples" }).quadsToString(store.getQuads(null, null, null, null));
      }
      version += 1;
      etag = `"v${version}"`;
      readStatus = 200;
      return response({ url, status: method === "POST" ? 201 : 204, etag, location: CATALOG_URL });
    }

    // ACL discovery is intentionally outside the shared catalog CAS. Returning
    // 404 makes makePublicReadable a no-op in this focused in-memory test.
    return response({ url, status: 404 });
  });

  return {
    fetch,
    get conflicts() {
      return conflicts;
    },
    get writes() {
      return writes;
    },
    datasetRefs: () =>
      new Parser({ baseIRI: CATALOG_URL })
        .parse(body)
        .filter((quad) => quad.predicate.value === DCAT_DATASET)
        .map((quad) => quad.object.value)
        .sort(),
  };
};

const sessionFor = (server) => ({
  info: { webId: "https://pod.example/hannah/profile/card#me" },
  fetch: server.fetch,
});

let warnSpy;

beforeEach(() => {
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

test("retries concurrent add/add without losing either dataset reference", async () => {
  const server = createCatalogServer({ synchronizeFirstReads: 2 });
  const session = sessionFor(server);

  await Promise.all([
    updateCatalogDatasets(session, CATALOG_URL, DATASET_A, { remove: false }),
    updateCatalogDatasets(session, CATALOG_URL, DATASET_B, { remove: false }),
  ]);

  expect(server.conflicts).toBe(1);
  expect(server.datasetRefs()).toEqual([DATASET_A, DATASET_B]);
  expect(server.fetch).toHaveBeenCalledWith(
    CATALOG_URL,
    expect.objectContaining({
      method: "GET",
      cache: "no-store",
      redirect: "error",
      headers: expect.objectContaining({ "Cache-Control": "no-store" }),
    })
  );
});

test("retries concurrent remove/add and preserves the independent addition", async () => {
  const server = createCatalogServer({
    initialRefs: ["ds/a.ttl#it"],
    synchronizeFirstReads: 2,
  });
  const session = sessionFor(server);

  await Promise.all([
    updateCatalogDatasets(session, CATALOG_URL, DATASET_A, { remove: true }),
    updateCatalogDatasets(session, CATALOG_URL, DATASET_B, { remove: false }),
  ]);

  expect(server.conflicts).toBe(1);
  expect(server.datasetRefs()).toEqual([DATASET_B]);
});

test("ensure on an existing catalog uses CAS and preserves dataset references", async () => {
  const server = createCatalogServer({ initialRefs: ["ds/a.ttl#it"] });

  await ensureCatalogDocument(sessionFor(server), CATALOG_URL, {
    title: "Configured catalog",
    description: "Configured without replacing members",
    contactPoint: "https://pod.example/hannah/profile/card#me",
  });

  expect(server.datasetRefs()).toEqual([DATASET_A]);
  const put = server.fetch.mock.calls.find(
    ([url, options]) => url === CATALOG_URL && options?.method === "PATCH"
  );
  expect(put[1].headers).toMatchObject({ "If-Match": '"v1"' });
  expect(put[1].headers["If-None-Match"]).toBeUndefined();
});

test.each([[""], ['W/"v1"']])(
  "fails closed before PATCH when the existing catalog ETag is missing or weak (%p)",
  async (initialEtag) => {
    const server = createCatalogServer({ initialEtag });

    await expect(
      updateCatalogDatasets(sessionFor(server), CATALOG_URL, DATASET_A)
    ).rejects.toThrow("strong ETag");
    expect(server.writes).toBe(0);
  }
);

test("fails closed on a non-404 catalog read instead of replacing it as empty", async () => {
  const server = createCatalogServer({ readStatus: 503 });

  await expect(
    updateCatalogDatasets(sessionFor(server), CATALOG_URL, DATASET_A)
  ).rejects.toThrow("Failed to read catalog document (503)");
  expect(server.writes).toBe(0);
});

test("creates an absent catalog via POST to its container", async () => {
  const server = createCatalogServer({ readStatus: 404, initialEtag: "" });

  await updateCatalogDatasets(sessionFor(server), CATALOG_URL, DATASET_A);

  const put = server.fetch.mock.calls.find(
    ([url, options]) => url === new URL("./", CATALOG_URL).href && options?.method === "POST"
  );
  expect(put[1].headers).toMatchObject({ Slug: "cat.ttl", "Content-Type": "text/turtle" });
  expect(put[1].headers["If-Match"]).toBeUndefined();
  expect(server.datasetRefs()).toEqual([DATASET_A]);
});

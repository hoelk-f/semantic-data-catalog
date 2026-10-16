import { TextDecoder, TextEncoder } from "util";
import { Response } from "node-fetch";
import { cachedCatalogFetch, loadPublicCatalogCache, publicCatalogCacheUrl } from "./publicCatalogCache";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.Response = Response;
const registry = "https://registry.example/public/test/";
const pod = "https://pod.example/alice/";
const root = `${pod}catalog/cat.ttl`;
const dataUrl = `${pod}catalog/ds/public.ttl`;
const privateUrl = `${pod}catalog/ds/private.ttl`;
const currentHref = "https://app.example/semantic-data-catalog/";
const page = (overrides = {}) => ({ schemaVersion: 1, registryUrl: registry, revision: "v1", status: "ready", discoveryComplete: true,
  updatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 300000).toISOString(),
  members: [{ webId: `${pod}profile/card#me`, catalogUrl: `${root}#it` }],
  documents: [{ url: dataUrl, body: '<#it> <http://purl.org/dc/terms/title> "Public".', contentType: "text/turtle" }], nextOffset: null, ...overrides });
const jsonResponse = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });

test("public catalog cache respects registry selection, original RDF bases and authenticated misses", async () => {
  const fetchImpl = jest.fn(async () => jsonResponse(page()));
  const snapshots = await loadPublicCatalogCache([registry], { fetchImpl, currentHref });
  expect(fetchImpl.mock.calls[0][1]).toMatchObject({ credentials: "omit", cache: "no-store" });
  expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get("registry")).toBe(registry);
  const fallback = jest.fn(async () => new Response("private"));
  const fetch = cachedCatalogFetch(snapshots, fallback, { isLoggedIn: true });
  const publicResponse = await fetch(dataUrl);
  expect(publicResponse.url).toBe(dataUrl);
  expect(await publicResponse.text()).toContain('"Public"');
  expect(fallback).not.toHaveBeenCalled();
  await fetch(privateUrl);
  await fetch(root);
  expect(fallback.mock.calls.map(([url]) => url)).toEqual([privateUrl, root]);
});

test("own metadata and write operations always bypass the public cache", async () => {
  const snapshots = await loadPublicCatalogCache([registry], { fetchImpl: async () => jsonResponse(page()), currentHref });
  const fallback = jest.fn(async () => new Response("fresh"));
  await cachedCatalogFetch(snapshots, fallback, { ownCatalogUrl: `${root}#it` })(dataUrl);
  await cachedCatalogFetch(snapshots, fallback)(dataUrl, { method: "PUT", body: "edit" });
  expect(fallback).toHaveBeenCalledTimes(2);
});

test.each([404, 503, 403])("catalog cache HTTP %s safely yields to normal discovery", async (status) => {
  const snapshots = await loadPublicCatalogCache([registry], { fetchImpl: async () => new Response("", { status }), currentHref });
  expect(snapshots).toEqual([]);
});

test.each([
  { expiresAt: "2000-01-01T00:00:00Z" }, { schemaVersion: 2 }, { registryUrl: "https://other.example/" },
  { documents: [{ url: dataUrl, body: "x", contentType: "text/html" }] }, { nextOffset: 0 },
])("invalid or stale snapshots are not reused: %j", async (invalid) => {
  expect(await loadPublicCatalogCache([registry], { fetchImpl: async () => jsonResponse(page(invalid)), currentHref })).toEqual([]);
});

test("pagination pins the revision and rejects a changed snapshot", async () => {
  const fetchImpl = jest.fn().mockResolvedValueOnce(jsonResponse(page({ nextOffset: 1 })))
    .mockResolvedValueOnce(jsonResponse(page({ members: [], documents: [], revision: "v2" })));
  expect(await loadPublicCatalogCache([registry], { fetchImpl, currentHref })).toEqual([]);
  const nextUrl = new URL(fetchImpl.mock.calls[1][0]);
  expect(nextUrl.searchParams.get("offset")).toBe("1");
  expect(nextUrl.searchParams.get("revision")).toBe("v1");
});

test("localhost uses the shared worker and custom bases remain configurable", () => {
  expect(publicCatalogCacheUrl(registry, "http://localhost:3000").origin).toBe("https://solid-dataspace-test.tmdt.info");
  expect(publicCatalogCacheUrl(registry, currentHref, "https://worker.example/public-cache").origin).toBe("https://worker.example");
  expect(() => publicCatalogCacheUrl(registry, currentHref, "https://user:secret@worker.example")).toThrow();
});

test("aggregated catalog combines cached public metadata and session-only private metadata without duplicate identifiers", async () => {
  const { loadAggregatedDatasets } = require("./solidCatalog");
  const snapshot = page({ documents: [
    { url: dataUrl, contentType: "text/turtle", body: '<#it> a <http://www.w3.org/ns/dcat#Dataset>; <http://purl.org/dc/terms/title> "Public"; <http://purl.org/dc/terms/identifier> "same".' },
  ] });
  const previousFetch = global.fetch;
  global.fetch = jest.fn(async () => jsonResponse(snapshot));
  const sessionFetch = jest.fn(async (url) => {
    const body = url === `${pod}profile/card`
      ? `<#me> <http://www.w3.org/ns/pim/space#storage> <${pod}>.`
      : url === root
      ? '<#it> <http://www.w3.org/ns/dcat#dataset> <ds/public.ttl#it>, <ds/private.ttl#it>.'
      : url === privateUrl
        ? '<#it> a <http://www.w3.org/ns/dcat#Dataset>; <http://purl.org/dc/terms/title> "Private"; <http://purl.org/dc/terms/identifier> "same".'
        : null;
    if (body === null) throw new Error(`Unexpected authenticated request: ${url}`);
    const response = new Response(body, { headers: { "Content-Type": "text/turtle" } });
    Object.defineProperty(response, "url", { value: url });
    return response;
  });
  try {
    const result = await loadAggregatedDatasets({ info: { webId: "https://pod.example/bob/profile/card#me", isLoggedIn: true }, fetch: sessionFetch }, null,
      { researchRegistries: [registry], usePublicCache: true });
    expect(result.datasets.map((d) => d.title).sort()).toEqual(["Private", "Public"]);
    expect(result.datasets.map((d) => d.identifier)).toEqual(["same", "same"]);
    expect(sessionFetch.mock.calls.map(([url]) => url)).toEqual([`${pod}profile/card`, root, privateUrl]);
    expect(result.datasets.every(d => d.catalogOrigins[0].podRoot === pod)).toBe(true);
  } finally { global.fetch = previousFetch; }
});

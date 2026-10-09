import { Parser, Store } from "n3";
import { buildMetadataPatch, writeMetadataTurtle, profileDistributions, assertProfileDistributions } from "./profileRdf";

const URL = "https://example.org/catalog/ds/record.ttl";
const triple = '<#it> <https://example.org/name> "before".';

test("new metadata uses POST and verifies the resulting stable URI", async () => {
  const fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, headers: { get: () => URL } });
  await writeMetadataTurtle(URL, null, triple, fetch);
  expect(fetch).toHaveBeenCalledWith("https://example.org/catalog/ds/", expect.objectContaining({ method: "POST", headers: { "Content-Type": "text/turtle", Slug: "record.ttl" } }));
  fetch.mockResolvedValue({ ok: true, status: 201, headers: { get: () => "other.ttl" } });
  await expect(writeMetadataTurtle(URL, null, triple, fetch)).rejects.toThrow("stable dataset identifier");
});

test("updates use an N3 patch guarded by the previously observed triples", async () => {
  const patch = await buildMetadataPatch(triple, triple.replace("before", "after"), URL);
  const graph = new Store(new Parser({ format: "N3" }).parse(patch));
  expect(graph.getQuads(null, "http://www.w3.org/ns/solid/terms#where", null, null)).toHaveLength(1);
  expect(patch).toContain('"before"');
  expect(patch).toContain('"after"');
  const fetch = jest.fn().mockResolvedValue({ ok: true, status: 204, url: URL });
  await writeMetadataTurtle(URL, triple, triple.replace("before", "after"), fetch, { etag: '"v1"' });
  expect(fetch.mock.calls[0][1]).toMatchObject({ method: "PATCH", headers: { "Content-Type": "text/n3", "If-Match": '"v1"' } });
});

test("editing the primary distribution preserves additional representations and models", () => {
  const values = profileDistributions({ access_url_dataset: "https://example.org/new.csv", file_format: "text/csv", access_url_semantic_model: "https://example.org/new-model.ttl", distributions: [
    { downloadURL: "https://example.org/old.csv", mediaType: "text/csv", conformsTo: ["https://example.org/old-model.ttl"] },
    { downloadURL: "https://example.org/second.json", mediaType: "application/json", conformsTo: ["https://example.org/json.ttl"] },
  ] });
  expect(values[0].conformsTo).toEqual(["https://example.org/new-model.ttl"]);
  expect(values[1].conformsTo).toEqual(["https://example.org/json.ttl"]);
  expect(() => assertProfileDistributions(values)).not.toThrow();
});

test("a theme is unnecessary but each representation needs its own model", () => {
  const good = { downloadURL: "https://example.org/data.csv", mediaType: "text/csv", conformsTo: ["https://example.org/model.ttl"] };
  expect(() => assertProfileDistributions([good])).not.toThrow();
  expect(() => assertProfileDistributions([good, { ...good, conformsTo: [] }])).toThrow("model or schema");
});

/** @jest-environment node */
import { assertProfileRecord, assertProfileCatalogAddition } from "./profileValidation";
import { updateCatalogDatasets } from "./solidCatalog";

const url = "https://pod.example/alice/catalog/ds/new.ttl";
const prefixes = `@prefix dcat: <http://www.w3.org/ns/dcat#>. @prefix dct: <http://purl.org/dc/terms/>. @prefix foaf: <http://xmlns.com/foaf/0.1/>.`;
const valid = `<> a dcat:CatalogRecord; foaf:primaryTopic <#it>.
<#it> a dcat:Dataset; dcat:distribution <#dist>.
<#dist> a dcat:Distribution; dcat:downloadURL <https://pod.example/alice/data.json>;
 dcat:mediaType "application/json"; dct:conformsTo <https://example.org/schema.json>.`;
const check = (turtle, fetch) => assertProfileRecord({ url, turtle: prefixes + turtle }, fetch);
const response = (url, body, status = 200) => ({ ok: status < 400, status, url, headers: { get: () => null }, text: async () => prefixes + body });

test("a complete record without an optional theme is accepted without fetching data or models", async () => {
  const fetch = jest.fn(() => { throw new Error("No network expected"); });
  await expect(check(valid, fetch)).resolves.toMatchObject({ datasetUrl: url + "#it", recordUrl: url });
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  ["record", valid.replace('<> a dcat:CatalogRecord; foaf:primaryTopic <#it>.', '')],
  ["topic", valid.replace('foaf:primaryTopic <#it>', 'foaf:primaryTopic <#it>, <#other>')],
  ["external dataset", valid.replaceAll('<#it>', '<https://elsewhere.example/dataset>')],
  ["external distribution", valid.replaceAll('<#dist>', '<https://elsewhere.example/distribution>')],
  ["distribution type", valid.replace('a dcat:Distribution;', '')],
  ["download cardinality", valid.replace('dcat:downloadURL <https://pod.example/alice/data.json>', 'dcat:downloadURL <https://pod.example/alice/data.json>, <https://example.org/other>')],
  ["download type", valid.replace('<https://pod.example/alice/data.json>', '"https://pod.example/alice/data.json"')],
  ["media cardinality", valid.replace('"application/json"', '"application/json", "text/csv"')],
  ["empty media type", valid.replace('"application/json"', '" "')],
  ["model missing", valid.replace('; dct:conformsTo <https://example.org/schema.json>', '')],
  ["model literal", valid.replace('<https://example.org/schema.json>', '"https://example.org/schema.json"')],
])("rejects invalid %s", async (_, turtle) => {
  await expect(check(turtle)).rejects.toMatchObject({ code: "profile-nonconformant" });
});

test("series dependencies are checked recursively, with a cycle handled once", async () => {
  const series = "https://pod.example/alice/catalog/series/new.ttl";
  const child = valid + `\n<#it> dcat:inSeries <${series}#it>.`;
  const seriesTurtle = valid.replace('a dcat:Dataset;', 'a dcat:DatasetSeries;').replace('data.json', 'data/') + `\n<#it> dcat:seriesMember <${url}#it>.`;
  const fetch = jest.fn(async target => response(target, seriesTurtle));
  await expect(check(child, fetch)).resolves.toMatchObject({ validatedDocuments: [url, series] });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("a legacy member cannot enter a new series, but validation does not rewrite it", async () => {
  const member = "https://pod.example/alice/legacy.ttl#it";
  const candidate = valid.replace('a dcat:Dataset;', 'a dcat:DatasetSeries;') + `\n<#it> dcat:seriesMember <${member}>.`;
  const fetch = jest.fn(async target => response(target, valid.replace('; dct:conformsTo <https://example.org/schema.json>', '')));
  await expect(check(candidate, fetch)).rejects.toThrow("model or schema");
  expect(fetch.mock.calls.every(([, options]) => !options.method || options.method === "GET")).toBe(true);
});

test("a record link must select the actual primary topic", async () => {
  const fetch = jest.fn(async target => response(target, valid));
  await expect(assertProfileCatalogAddition(url + "#wrong", fetch)).rejects.toThrow("actual primary");
});

test("an invalid record cannot be added to a root catalog; no mutation is sent", async () => {
  const fetch = jest.fn(async target => response(target, valid.replace('; dct:conformsTo <https://example.org/schema.json>', '')));
  await expect(updateCatalogDatasets({ fetch }, "https://pod.example/alice/catalog/cat.ttl", url + "#it")).rejects.toThrow("model or schema");
  expect(fetch.mock.calls.every(([, options]) => !options.method || options.method === "GET")).toBe(true);
});

/** @jest-environment node */
import { createDataset, loadCatalogDatasets, validateSeriesContainer, validateSeriesMembers, buildDatasetResource, parseDatasetFromDoc } from "./solidCatalog";
import { getSolidDataset, getUrlAll, getThing } from "@inrupt/solid-client";
import { DCAT, DCTERMS } from "@inrupt/vocab-common-rdf";

const root = "https://pod.example/alice/";
const prefixes = `@prefix dcat: <http://www.w3.org/ns/dcat#>. @prefix dct: <http://purl.org/dc/terms/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>. @prefix ldp: <http://www.w3.org/ns/ldp#>.`;
const transport = resources => jest.fn(async url => {
  const response = new Response(resources[url] ? prefixes + resources[url] : "", {
    status: resources[url] ? 200 : 404, headers: { "Content-Type": "text/turtle" },
  });
  Object.defineProperty(response, "url", { value: url });
  return response;
});

test("record-only discovery follows arbitrary metadata locations and distribution models without fetching data", async () => {
  const catalog = root + "custom/root.ttl";
  const record = root + "entries/record.ttl";
  const distribution = root + "descriptions/distribution.ttl";
  const fetch = transport({
    [catalog]: `<> a dcat:Catalog; dcat:record <${record}>.`,
    [record]: `<> a dcat:CatalogRecord; foaf:primaryTopic <#dataset>. <#dataset> a dcat:Dataset; dcat:distribution <${distribution}#it>.`,
    [distribution]: `<#it> a dcat:Distribution; dcat:downloadURL <${root}private.csv>; dcat:mediaType "text/csv"; dct:conformsTo <${root}model.ttl>.`,
  });
  const result = await loadCatalogDatasets(catalog, fetch);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ datasetUrl: record + "#dataset", access_url_semantic_model: root + "model.ttl" });
  expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual([catalog, record, distribution].sort());
});

test("a legacy model remains readable but cannot be used unchanged in a newly published series", async () => {
  const record = root + "legacy.ttl";
  const fetch = transport({ [record]: `<#it> a dcat:Dataset; dct:conformsTo <${root}model.ttl>; dcat:distribution <#dist>.
    <#dist> a dcat:Distribution; dcat:downloadURL <${root}data/a.csv>; dcat:mediaType "text/csv".` });
  const document = await getSolidDataset(record, { fetch });
  expect(parseDatasetFromDoc(document, record + "#it").access_url_semantic_model).toBe(root + "model.ttl");
  await expect(validateSeriesMembers({ fetch }, [record + "#it"])).rejects.toThrow("model or schema");
});

test("series membership is checked against a real Solid container", async () => {
  const container = root + "data/";
  const fetch = transport({ [container]: `<> a ldp:Resource, ldp:BasicContainer; ldp:contains <a.csv>.` });
  await expect(validateSeriesContainer({ fetch }, container, [container + "a.csv"])).resolves.toBe("http://www.w3.org/ns/ldp#BasicContainer");
  await expect(validateSeriesContainer({ fetch }, container, [root + "other/b.csv"])).rejects.toThrow("contained");
});

test("editing dataset metadata retains its series membership and unrelated annotations", async () => {
  const record = root + "record.ttl";
  const fetch = transport({ [record]: `<#it> a dcat:Dataset; dcat:inSeries <series.ttl#it>; dct:license <https://example.org/license>.` });
  const document = await getSolidDataset(record, { fetch });
  const updated = buildDatasetResource(record, { identifier: "record", title: "Edited" }, getThing(document, record + "#it"));
  expect(getUrlAll(updated, "http://www.w3.org/ns/dcat#inSeries")).toEqual([root + "series.ttl#it"]);
  expect(getUrlAll(updated, DCTERMS.license)).toEqual(["https://example.org/license"]);
});


test("a Solid container cannot be published as an ordinary dataset", async () => {
  const fetch = jest.fn();
  await expect(createDataset({ info: { webId: root + "profile/card#me" }, fetch }, {
    access_url_dataset: root + "data/", file_format: "text/turtle", access_url_semantic_model: "http://www.w3.org/ns/ldp#BasicContainer",
  })).rejects.toThrow("Dataset Series");
  expect(fetch).not.toHaveBeenCalled();
});

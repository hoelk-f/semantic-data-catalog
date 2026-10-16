import { catalogOrigin, datasetCatalogOrigins, datasetPodRoots, datasetPodNames } from "./catalogOrigin";

test("uses verified storage for custom catalogs and rejects prefix collisions", () => {
  const url = "https://storage.example/alex/metadata/index.ttl#it";
  expect(catalogOrigin(url, ["https://identity.example/alex/", "https://storage.example/al/", "https://storage.example/alex/"])).toEqual({ catalogUrl: url, podRoot: "https://storage.example/alex/" });
  expect(catalogOrigin(url)).toEqual({ catalogUrl: url, podRoot: "" });
  expect(catalogOrigin("javascript:alert(1)")).toBeNull();
});

test("uses a verified root instead of a nested catalog directory guess", () => {
  const catalogUrl = "https://storage.example/alex/shared/catalog/cat.ttl#it";
  const podRoot = "https://storage.example/alex/";
  const data = { catalogUrl, catalogOrigins: [{ catalogUrl, podRoot }], webid: "https://identity.example/bob#me" };
  expect(datasetCatalogOrigins(data)).toEqual([{ catalogUrl, podRoot }]);
  expect(datasetPodRoots(data)).toEqual([podRoot]);
  expect(datasetPodNames(data)).toBe("alex");
});

test("does not manufacture Pod names from creator or data download URLs", () => {
  expect(datasetPodNames({ webid: "https://identity.example/alex#me", access_url_dataset: "https://files.example/data.json" })).toBe("");
  expect(datasetPodNames({ catalogUrl: "https://storage.example/catalog/cat.ttl" })).toBe("storage");
});

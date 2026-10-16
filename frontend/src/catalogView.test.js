import { accessState, catalogPodOptions, datasetKey, highlightParts, selectCatalogDatasets } from "./catalogView";

const datasets = [
  { identifier: "1", datasetUrl: "https://a.example/1#it", title: "Luftqualität Wuppertal", description: "Tägliche Messwerte", theme: "Umwelt;Klima", publisher: "Stadt", is_public: true, modified: "2026-01-01" },
  { identifier: "1", datasetUrl: "https://b.example/1#it", title: "Mobilität", description: "Luftqualität und Radverkehr", theme: "Verkehr", publisher: "Institut", userHasAccess: true, modified: "2026-02-01" },
  { identifier: "3", datasetUrl: "https://a.example/3#it", title: "Klimareihe", theme: "Klima", datasetType: "series", is_public: true, seriesMembers: ["https://a.example/1#it"] },
];

test("searches normalized metadata, combines words, and ranks title matches first", () => {
  expect(selectCatalogDatasets(datasets, { query: "LUFTQUALITAT" })).toEqual([datasets[0], datasets[1]]);
  expect(selectCatalogDatasets(datasets, { query: "messwerte stadt" })).toEqual([datasets[0]]);
  expect(selectCatalogDatasets(datasets, { query: "Messwerte Institut" })).toEqual([]);
});

test("combines filters and honors an explicit sort without mutating sources", () => {
  expect(selectCatalogDatasets(datasets, { theme: "Klima", type: "dataset", access: "public" })).toEqual([datasets[0]]);
  expect(selectCatalogDatasets(datasets, { publisher: "Institut", access: "available" })).toEqual([datasets[1]]);
  expect(selectCatalogDatasets(datasets, { query: "Luftqualität", sort: "modified" })).toEqual([datasets[1], datasets[0]]);
  expect(datasets[0].identifier).toBe("1");
});

test("keeps identity scoped to the metadata URL and does not label a series public", () => {
  expect(datasetKey(datasets[0])).not.toBe(datasetKey(datasets[1]));
  expect(accessState(datasets[2])).toBe("series");
  expect(accessState({})).toBe("restricted");
});

test("highlights literal queries safely and retains original spelling", () => {
  const source = "Straße & Luftqualität <script>";
  const parts = highlightParts(source, "strasse luftqualitat <script>");
  expect(parts.map((part) => part.text).join("")).toBe(source);
  expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual(["Straße", "Luftqualität", "<script>"]);
  expect(highlightParts("A+B [1]", "[1]").filter((part) => part.match)).toEqual([{ text: "[1]", match: true }]);
});


test("filters by catalog storage independently of creator, preserving series and multiple origins", () => {
  const pod = "https://one.example/gesundestal/";
  const other = "https://two.example/gesundestal/";
  const rows = [
    { ...datasets[0], webid: "https://identity.example/creator#me", catalogUrl: pod + "catalog/cat.ttl#it" },
    { ...datasets[1], catalogUrl: other + "catalog/cat.ttl#it" },
    { ...datasets[2], catalogOrigins: [{ catalogUrl: pod + "catalog/cat.ttl" }, { catalogUrl: other + "catalog/cat.ttl" }] },
    { ...datasets[0], identifier: "unknown", webid: pod + "profile/card#me" },
  ];
  expect(selectCatalogDatasets(rows, { pod })).toEqual([rows[0], rows[2]]);
  expect(selectCatalogDatasets(rows, { pod: other })).toEqual([rows[1], rows[2]]);
  expect(selectCatalogDatasets(rows, { pod, query: "Luftqualität", publisher: "Stadt", theme: "Klima", access: "public" })).toEqual([rows[0]]);
  expect(selectCatalogDatasets(rows, { pod, publisher: "Institut" })).toEqual([]);
  expect(selectCatalogDatasets(rows, { pod: "" })).toEqual(rows);
  expect(catalogPodOptions(rows)).toEqual([
    { value: pod, label: "gesundestal (one.example)" },
    { value: other, label: "gesundestal (two.example)" },
  ]);
});

test("Pod options use sorted short names and do not infer storage from creator WebIDs", () => {
  const a = "https://solid.example/alpha/";
  const z = "https://solid.example/zeta/";
  expect(catalogPodOptions([{ catalogUrl: z + "catalog/cat.ttl" }, { catalogUrl: a + "catalog/cat.ttl" }, { catalogUrl: a + "catalog/cat.ttl" }, {}, { webid: z + "profile/card#me" }])).toEqual([
    { value: a, label: "alpha" }, { value: z, label: "zeta" },
  ]);
});

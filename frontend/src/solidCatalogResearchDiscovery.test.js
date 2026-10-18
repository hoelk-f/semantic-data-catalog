import { TextDecoder, TextEncoder } from "util";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const mockGetSolidDataset = jest.fn();
const mockGetContainedResourceUrlAll = jest.fn();

jest.mock("@inrupt/solid-client", () => {
  const actual = jest.requireActual("@inrupt/solid-client");
  return {
    ...actual,
    getSolidDataset: (...args) => mockGetSolidDataset(...args),
    getContainedResourceUrlAll: (...args) =>
      mockGetContainedResourceUrlAll(...args),
  };
});

jest.mock('./publicCatalogCache', () => ({
  ...jest.requireActual('./publicCatalogCache'),
  loadPublicCatalogCache: jest.fn(),
}));
const { loadPublicCatalogCache } = require('./publicCatalogCache');

const {
  addUrl,
  createSolidDataset,
  createThing,
  setStringNoLocale,
  setThing,
  setUrl,
} = require("@inrupt/solid-client");
const { DCAT, DCTERMS, FOAF, RDF } = require("@inrupt/vocab-common-rdf");
const {
  loadAggregatedDatasets,
  SDP_CATALOG,
} = require("./solidCatalog");

const REGISTRY = "https://registry.example/public/research/";
const CURRENT_WEB_ID = "https://pod.example/current/profile/card#me";
const IDENTIFIER = "solid-tours-route-template-shared-name";
const THEME = "https://w3id.org/solid-tours/theme/route-template";

const createMemberDocument = (resourceUrl, webId) => {
  let thing = createThing({ url: `${resourceUrl}#it` });
  thing = setUrl(thing, FOAF.member, webId);
  return setThing(createSolidDataset(), thing);
};

const createProfileDocument = (webId, catalogUrl) => {
  let thing = createThing({ url: webId });
  thing = setUrl(thing, SDP_CATALOG, catalogUrl);
  return setThing(createSolidDataset(), thing);
};

const createCatalogDocument = (catalogUrl, datasetUrl) => {
  let thing = createThing({ url: catalogUrl });
  thing = addUrl(thing, DCAT.dataset, datasetUrl);
  return setThing(createSolidDataset(), thing);
};

const createDatasetDocument = (datasetUrl, distributionUrl, creatorWebId) => {
  const docUrl = datasetUrl.split("#")[0];
  const distributionThingUrl = `${docUrl}#dist`;
  let datasetThing = createThing({ url: datasetUrl });
  datasetThing = addUrl(datasetThing, RDF.type, DCAT.Dataset);
  datasetThing = setStringNoLocale(
    datasetThing,
    DCTERMS.identifier,
    IDENTIFIER
  );
  datasetThing = setStringNoLocale(
    datasetThing,
    DCTERMS.title,
    "Reusable route"
  );
  datasetThing = setStringNoLocale(
    datasetThing,
    DCTERMS.accessRights,
    "public"
  );
  datasetThing = setUrl(datasetThing, DCTERMS.creator, creatorWebId);
  datasetThing = setUrl(datasetThing, DCAT.theme, THEME);
  datasetThing = addUrl(
    datasetThing,
    DCAT.distribution,
    distributionThingUrl
  );

  let distributionThing = createThing({ url: distributionThingUrl });
  distributionThing = addUrl(distributionThing, RDF.type, DCAT.Distribution);
  distributionThing = setUrl(
    distributionThing,
    DCAT.downloadURL,
    distributionUrl
  );
  distributionThing = setStringNoLocale(
    distributionThing,
    DCAT.mediaType,
    "application/geo+json"
  );

  let dataset = createSolidDataset();
  dataset = setThing(dataset, distributionThing);
  return setThing(dataset, datasetThing);
};

test.each([false, true])("waits for the last dataset even when an earlier source fails: %s", async (failFirst) => {
  const memberUrl = `${REGISTRY}member-alice.ttl`;
  const catalogUrl = "https://pod.example/alice/catalog.ttl#it";
  const firstUrl = "https://pod.example/alice/first.ttl#it";
  const lastUrl = "https://pod.example/alice/last.ttl#it";
  const memberWebId = "https://pod.example/alice/profile/card#me";
  let catalogDocument = createCatalogDocument(catalogUrl, firstUrl);
  catalogDocument = setThing(catalogDocument, addUrl(
    require("@inrupt/solid-client").getThing(catalogDocument, catalogUrl), DCAT.dataset, lastUrl
  ));
  const resources = new Map([
    [REGISTRY, { contained: [memberUrl] }],
    [memberUrl, createMemberDocument(memberUrl, memberWebId)],
    [memberWebId.split("#")[0], createProfileDocument(memberWebId, catalogUrl)],
    [catalogUrl.split("#")[0], catalogDocument],
    [firstUrl.split("#")[0], createDatasetDocument(firstUrl, "https://data.example/first.csv", memberWebId)],
  ]);
  let releaseLast;
  const lastRequest = new Promise((resolve) => { releaseLast = resolve; });
  mockGetContainedResourceUrlAll.mockImplementation((doc) => doc.contained || []);
  mockGetSolidDataset.mockImplementation(async (url) => {
    if (url === lastUrl.split("#")[0]) return lastRequest;
    if (failFirst && url === firstUrl.split("#")[0]) throw new Error("source unavailable");
    if (!resources.has(url)) throw new Error(`Unexpected resource: ${url}`);
    return resources.get(url);
  });
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  const onLoadError = jest.fn();
  let completed = false;
  const pending = loadAggregatedDatasets({ info: {}, fetch: jest.fn() }, undefined, {
    researchRegistries: [REGISTRY], onLoadError,
  }).then((result) => { completed = true; return result; });
  for (let step = 0; step < 30; step += 1) await Promise.resolve();
  expect(mockGetSolidDataset).toHaveBeenCalledWith(lastUrl.split("#")[0], expect.anything());
  expect(completed).toBe(false);
  releaseLast(createDatasetDocument(lastUrl, "https://data.example/last.csv", memberWebId));
  const result = await pending;
  expect(result.datasets).toHaveLength(failFirst ? 1 : 2);
  expect(onLoadError).toHaveBeenCalledTimes(failFirst ? 1 : 0);
  if (failFirst) expect(onLoadError).toHaveBeenCalledWith(expect.any(Error), { stage: "dataset" });
  expect(mockGetSolidDataset.mock.calls.some(([url]) => url.startsWith("https://data.example/"))).toBe(false);
  warn.mockRestore();
});

test.each([['researchRegistries', false], ['registryUrl', false], ['registryUrl', true]])("%s reads only registry members and preserves same-id datasets from different Pods (cache=%s)", async (selection, usePublicCache) => {
  const members = ["alice", "bob"].map((name) => {
    const podRoot = `https://pod.example/${name}/`;
    return {
      webId: `${podRoot}profile/card#me`,
      memberUrl: `${REGISTRY}member-${name}.ttl`,
      catalogUrl: `${podRoot}catalog/cat.ttl#it`,
      datasetUrl: `${podRoot}catalog/ds/shared.ttl#it`,
      distributionUrl: `${podRoot}solid-tours/public-routes/shared.geojson`,
    };
  });
  const registryDocument = { contained: members.map(({ memberUrl }) => memberUrl) };
  const resources = new Map([[REGISTRY, registryDocument]]);
  members.forEach((member) => {
    resources.set(
      member.memberUrl,
      createMemberDocument(member.memberUrl, member.webId)
    );
    resources.set(
      member.webId.split("#")[0],
      createProfileDocument(member.webId, member.catalogUrl)
    );
    resources.set(
      member.catalogUrl.split("#")[0],
      createCatalogDocument(member.catalogUrl, member.datasetUrl)
    );
    resources.set(
      member.datasetUrl.split("#")[0],
      createDatasetDocument(
        member.datasetUrl,
        member.distributionUrl,
        member.webId
      )
    );
  });

  mockGetContainedResourceUrlAll.mockImplementation(
    (dataset) => dataset.contained || []
  );
  mockGetSolidDataset.mockImplementation(async (url) => {
    if (!resources.has(url)) throw new Error(`Unexpected read: ${url}`);
    return resources.get(url);
  });
  const session = { info: { webId: CURRENT_WEB_ID }, fetch: jest.fn() };

  loadPublicCatalogCache.mockResolvedValue([{ registryUrl: REGISTRY, discoveryComplete: true,
    members: members.map(member => ({ webId: member.webId, catalogUrl: member.catalogUrl })),
    documents: new Map(), expiresAt: new Date(Date.now() + 60000).toISOString(),
  }]);
  const result = await loadAggregatedDatasets(session, undefined, selection === 'registryUrl'
    ? { registryUrl: REGISTRY, researchRegistries: ['https://other.example/registry/'], usePublicCache }
    : { researchRegistries: [REGISTRY] });

  if (usePublicCache) expect(loadPublicCatalogCache).toHaveBeenCalledWith([REGISTRY]);
  expect(result.catalogs).toEqual(members.map(({ catalogUrl }) => catalogUrl));
  expect(result.datasets).toHaveLength(2);
  expect(result.datasets.map(({ identifier }) => identifier)).toEqual([
    IDENTIFIER,
    IDENTIFIER,
  ]);
  expect(result.datasets.map(({ datasetUrl }) => datasetUrl).sort()).toEqual(
    members.map(({ datasetUrl }) => datasetUrl).sort()
  );
  expect(mockGetSolidDataset).not.toHaveBeenCalledWith(
    CURRENT_WEB_ID.split("#")[0],
    expect.anything()
  );
});

test("one dataset linked by two custom catalogs keeps both storage origins and its separate creator", async () => {
  const { datasetPodRoots } = require('./catalogOrigin');
  const datasetUrl = 'https://metadata.example/shared.ttl#it';
  const creator = 'https://identity.example/author#me';
  const members = ['alpha','beta'].map(name => ({
    memberUrl: `${REGISTRY}${name}.ttl`, webId: `https://identity.example/${name}#me`,
    podRoot: `https://storage.example/${name}/`, catalogUrl: `https://storage.example/${name}/metadata/index.ttl#it`,
  }));
  const resources = new Map([[REGISTRY, { contained: members.map(m => m.memberUrl) }],
    [datasetUrl.split('#')[0], createDatasetDocument(datasetUrl,'https://data.example/shared.json',creator)]]);
  for (const m of members) {
    resources.set(m.memberUrl, createMemberDocument(m.memberUrl,m.webId));
    const profile = createProfileDocument(m.webId,m.catalogUrl);
    const thing = require('@inrupt/solid-client').getThing(profile,m.webId);
    resources.set(m.webId.split('#')[0], setThing(profile,setUrl(thing,'http://www.w3.org/ns/pim/space#storage',m.podRoot)));
    resources.set(m.catalogUrl.split('#')[0],createCatalogDocument(m.catalogUrl,datasetUrl));
  }
  mockGetContainedResourceUrlAll.mockImplementation(doc => doc.contained || []);
  mockGetSolidDataset.mockImplementation(async url => { if (!resources.has(url)) throw new Error(`Unexpected read: ${url}`); return resources.get(url); });
  const result = await loadAggregatedDatasets({ info:{},fetch:jest.fn() },undefined,{researchRegistries:[REGISTRY]});
  expect(result.datasets).toHaveLength(1);
  expect(result.datasets[0].webid).toBe(creator);
  expect(datasetPodRoots(result.datasets[0]).sort()).toEqual(members.map(m=>m.podRoot));
});

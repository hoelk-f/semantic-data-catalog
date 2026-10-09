import {
  addUrl,
  createContainerAt,
  createSolidDataset,
  createThing,
  getDatetime,
  getSolidDataset,
  getSolidDatasetWithAcl,
  getContainedResourceUrlAll,
  getFileWithAcl,
  getPublicResourceAccess,
  getStringNoLocale,
  getStringWithLocaleAll,
  getThing,
  getThingAll,
  getUrl,
  getUrlAll,
  hasAccessibleAcl,
  hasResourceAcl,
  removeAll,
  removeThing,
  saveAclFor,
  saveSolidDatasetAt,
  setDatetime,
  setPublicResourceAccess,
  setStringNoLocale,
  setThing,
  setUrl,
  createAclFromFallbackAcl,
  getResourceAcl,
  deleteFile,
} from "@inrupt/solid-client";
import { DCAT, DCTERMS, FOAF, LDP, RDF, VCARD } from "@inrupt/vocab-common-rdf";
import Parser from "n3/lib/N3Parser";
import Writer from "n3/lib/N3Writer";
import { saveProfileDocument, writeMetadataTurtle, profileDistributions, assertProfileDistributions } from "./profileRdf";
import { deleteCatalogDatasetDocuments } from "./catalogDeletion";
import { loadPublicCatalogCache, cachedCatalogFetch } from "./publicCatalogCache";

const CATALOG_CONTAINER = "catalog/";
const DATASET_CONTAINER = "catalog/ds/";
const SERIES_CONTAINER = "catalog/series/";
const RECORDS_CONTAINER = "catalog/records/";
const CATALOG_DOC = "catalog/cat.ttl";
const CATALOG_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

const CACHE_KEY = "sdm.catalog.cache.v1";
const CACHE_TTL_MS = 0;
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const DROP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const safeNow = () => new Date().toISOString();
const SDP_NS = "http://purl.org/sdp/terms#";
export const LEGACY_SDP_CATALOG = "https://w3id.org/solid-dcat-profile#catalog";
export const SDP_CATALOG = `${SDP_NS}catalog`;
const SDM_NS = "https://w3id.org/solid-dataspace-manager#";
const SDM_REGISTRY_MODE = `${SDM_NS}registryMode`;
const SDM_REGISTRY = `${SDM_NS}registry`;
const SDM_PRIVATE_REGISTRY = `${SDM_NS}privateRegistry`;
export const REGISTRY_PRESETS = [
  {
    id: "stadt-wuppertal",
    label: "Gesundes Tal",
    url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/stadt-wuppertal",
  },
  {
    id: "dace",
    label: "DACE",
    url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/dace",
  },
  {
    id: "timberconnect",
    label: "TimberConnect",
    url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/timberconnect",
  },
  {
    id: "test",
    label: "Test",
    url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/test",
    icon: "flask",
  },
  {
    id: "test2",
    label: "Test 2",
    url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/test2",
    icon: "flask",
  },
];
const SDM_CHANGELOG = `${SDM_NS}changeLog`;
const SDM_CHANGE_EVENT = `${SDM_NS}ChangeEvent`;
const LEGACY_DCAT_CONFORMS_TO = "http://www.w3.org/ns/dcat#conformsTo";
const VCARD_HAS_URL = VCARD.hasURL || "http://www.w3.org/2006/vcard/ns#hasURL";
const VCARD_URL = VCARD.url || "http://www.w3.org/2006/vcard/ns#url";

const resolveUrl = (value, base) => {
  if (!value) return "";
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
};

const isNotFound = (err) =>
  err?.statusCode === 404 ||
  err?.status === 404 ||
  err?.response?.status === 404 ||
  err?.response?.statusCode === 404;

const stripMailto = (value) => {
  if (!value) return "";
  return value.startsWith("mailto:") ? value.replace(/^mailto:/, "") : value;
};

const getThingByTypes = (datasetDoc, types) => {
  const typeSet = new Set(types);
  return (
    getThingAll(datasetDoc).find((thing) => {
      const thingTypes = getUrlAll(thing, RDF.type);
      return thingTypes.some((type) => typeSet.has(type));
    }) || null
  );
};

const resolveDatasetThing = (datasetDoc, datasetUrl) => {
  if (!datasetDoc) return null;
  const docUrl = getDocumentUrl(datasetUrl);
  const candidates = [datasetUrl, `${docUrl}#it`];
  for (const candidate of candidates) {
    const thing = getThing(datasetDoc, candidate);
    if (thing && !getUrlAll(thing, RDF.type).includes(DCAT.CatalogRecord)) return thing;
    if (thing) {
      const topic = getUrl(thing, FOAF.primaryTopic);
      const topicThing = topic && getThing(datasetDoc, topic);
      if (topicThing) return topicThing;
    }
  }
  return (
    getThingByTypes(datasetDoc, [DCAT.Dataset, DCAT.DatasetSeries]) ||
    getThingAll(datasetDoc)[0] ||
    null
  );
};

const toCatalogDatasetRef = (catalogDocUrl, datasetUrl) => {
  if (!catalogDocUrl || !datasetUrl) return datasetUrl;
  try {
    const catalog = new URL(catalogDocUrl);
    const dataset = new URL(datasetUrl, catalogDocUrl);
    if (catalog.origin !== dataset.origin) return datasetUrl;
    const catalogDir = catalog.pathname.replace(/[^/]+$/, "");
    if (!dataset.pathname.startsWith(catalogDir)) return datasetUrl;
    const relPath = dataset.pathname.slice(catalogDir.length);
    return `${relPath}${dataset.hash || ""}`;
  } catch {
    return datasetUrl;
  }
};

const buildCatalogTurtle = ({
  title,
  description,
  modified,
  datasetRefs,
  recordRefs,
  contactPoint,
}) => {
  const lines = [
    "@prefix dcat: <http://www.w3.org/ns/dcat#>.",
    "@prefix dcterms: <http://purl.org/dc/terms/>.",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.",
    "",
    "<#it> a dcat:Catalog ;",
    `  dcterms:title "${(title || "Solid Dataspace Catalog").replace(/\"/g, '\\"')}" ;`,
  ];

  if (description) {
    lines.push(
      `  dcterms:description "${description.replace(/\"/g, '\\"')}" ;`
    );
  }

  const modifiedValue = modified || safeNow();
  lines.push(`  dcterms:modified "${modifiedValue}"^^xsd:dateTime ;`);

  if (contactPoint) {
    lines.push(`  dcat:contactPoint <${contactPoint}> ;`);
  }

  if (datasetRefs && datasetRefs.length) {
    lines.push("  dcat:dataset");
    lines.push(`    ${datasetRefs.map((ref) => `<${ref}>`).join(" ,\n    ")} .`);
  } else if (recordRefs && recordRefs.length) {
    lines.push("  .");
  } else {
    lines.push("  .");
  }

  if (recordRefs && recordRefs.length) {
    lines.push("");
    lines.push("<#it> dcat:record");
    lines.push(`    ${recordRefs.map((ref) => `<${ref}>`).join(" ,\n    ")} .`);
  }

  return lines.join("\n");
};

const CATALOG_CAS_MAX_ATTEMPTS = 4;
const CATALOG_CONFLICT_STATUSES = new Set([409, 412]);

const responseHeader = (response, name) =>
  response?.headers && typeof response.headers.get === "function"
    ? response.headers.get(name)
    : null;

const isStrongEtag = (value) =>
  typeof value === "string" &&
  /^"[\x21\x23-\x7e\x80-\xff]*"$/.test(value.trim());

const assertExactCatalogResponse = (response, catalogDocUrl, operation) => {
  const actualUrl = response?.url;
  let expected;
  let actual;
  try {
    expected = new URL(catalogDocUrl).href;
    actual = actualUrl ? new URL(actualUrl).href : "";
  } catch {
    throw new Error(`Catalog ${operation} did not use a valid exact resource URL.`);
  }
  if (response?.redirected || actual !== expected) {
    throw new Error(`Catalog ${operation} did not use the exact resource URL.`);
  }
};

const parseCatalogSnapshot = (turtle, catalogDocUrl) => {
  let quads;
  try {
    quads = new Parser({ baseIRI: catalogDocUrl }).parse(turtle);
  } catch (error) {
    throw new Error("Catalog document contains invalid Turtle.", { cause: error });
  }

  const catalogResourceUrl = `${catalogDocUrl}#it`;
  const values = (predicate) =>
    quads
      .filter(
        (quad) =>
          quad.subject.value === catalogResourceUrl &&
          quad.predicate.value === predicate
      )
      .map((quad) => quad.object.value);
  const types = values(RDF.type);
  if (!types.includes(DCAT.Catalog)) {
    throw new Error("Catalog document does not contain the expected dcat:Catalog resource.");
  }

  return {
    turtle,
    title: values(DCTERMS.title)[0] || "Solid Dataspace Catalog",
    description: values(DCTERMS.description)[0] || "",
    contactPoint: values(DCAT.contactPoint)[0] || "",
    datasetRefs: Array.from(
      new Set(
        values(DCAT.dataset).map((url) =>
          toCatalogDatasetRef(catalogDocUrl, url)
        )
      )
    ),
    recordRefs: Array.from(
      new Set(
        values(DCAT.record).map((url) =>
          toCatalogDatasetRef(catalogDocUrl, url)
        )
      )
    ),
  };
};

const readCatalogSnapshot = async (fetch, catalogDocUrl) => {
  const response = await fetch(catalogDocUrl, {
    method: "GET",
    headers: {
      Accept: "text/turtle",
      "Cache-Control": "no-store",
    },
    cache: "no-store",
    redirect: "error",
  });
  assertExactCatalogResponse(response, catalogDocUrl, "read");

  if (response.status === 404) {
    return {
      exists: false,
      etag: "",
      title: "Solid Dataspace Catalog",
      description: "",
      contactPoint: "",
      datasetRefs: [],
      recordRefs: [],
    };
  }
  if (!response.ok) {
    throw new Error(`Failed to read catalog document (${response.status}).`);
  }

  const etag = (responseHeader(response, "ETag") || "").trim();
  if (!isStrongEtag(etag)) {
    throw new Error("Catalog document is missing a strong ETag.");
  }
  const turtle = await response.text();
  return {
    exists: true,
    etag,
    ...parseCatalogSnapshot(turtle, catalogDocUrl),
  };
};

const mutateCatalogDocument = async (
  session,
  catalogDocUrl,
  mutateDatasetRefs,
  metadata = {}
) => {
  if (!session || typeof session.fetch !== "function") {
    throw new Error("An authenticated Solid session is required.");
  }

  for (let attempt = 0; attempt < CATALOG_CAS_MAX_ATTEMPTS; attempt += 1) {
    const snapshot = await readCatalogSnapshot(session.fetch, catalogDocUrl);
    const currentRefs = new Set(snapshot.datasetRefs);
    const updatedRefs = mutateDatasetRefs
      ? mutateDatasetRefs(currentRefs, snapshot)
      : currentRefs;
    const datasetRefs = Array.from(updatedRefs || currentRefs);
    let turtle = buildCatalogTurtle({
      title:
        metadata.title !== undefined
          ? metadata.title || "Solid Dataspace Catalog"
          : snapshot.title,
      description:
        metadata.description !== undefined
          ? metadata.description || ""
          : snapshot.description,
      modified: safeNow(),
      datasetRefs,
      recordRefs: snapshot.recordRefs,
      contactPoint:
        metadata.contactPoint !== undefined
          ? metadata.contactPoint || ""
          : snapshot.contactPoint,
    });

    if (snapshot.exists) {
      const managed = new Set([DCTERMS.title, DCTERMS.description, DCTERMS.modified, DCAT.contactPoint, DCAT.dataset, DCAT.record]);
      const extras = new Parser({ baseIRI: catalogDocUrl, blankNodePrefix: "" }).parse(snapshot.turtle).filter((quad) =>
        quad.subject.value !== `${catalogDocUrl}#it` ||
        (!managed.has(quad.predicate.value) && !(quad.predicate.value === RDF.type && quad.object.value === DCAT.Catalog)));
      turtle += "\n" + new Writer({ format: "N-Triples" }).quadsToString(extras);
    }
    let response;
    try {
      response = await writeMetadataTurtle(catalogDocUrl,
        snapshot.exists ? snapshot.turtle : null, turtle, session.fetch, { etag: snapshot.etag });
    } catch (error) {
      if (CATALOG_CONFLICT_STATUSES.has(error.status)) continue;
      throw error;
    }
    if (snapshot.exists) assertExactCatalogResponse(response, catalogDocUrl, "write");
    if (response.ok) {
      return { datasetRefs, created: !snapshot.exists };
    }
    if (!CATALOG_CONFLICT_STATUSES.has(response.status)) {
      throw new Error(`Failed to write catalog document (${response.status}).`);
    }
  }

  const conflict = new Error(
    `Catalog document changed during all ${CATALOG_CAS_MAX_ATTEMPTS} write attempts.`
  );
  conflict.status = 412;
  throw conflict;
};

export const ensureCatalogDocument = async (
  session,
  catalogDocUrl,
  { title, description, contactPoint } = {}
) =>
  mutateCatalogDocument(session, catalogDocUrl, (datasetRefs) => datasetRefs, {
    title: title || "Solid Dataspace Catalog",
    description: description || "",
    contactPoint: contactPoint || "",
  });

const writeCatalogDoc = async (session, catalogDocUrl, datasetRefs) => {
  await mutateCatalogDocument(
    session,
    catalogDocUrl,
    () => new Set(datasetRefs || [])
  );
  await makePublicReadable(catalogDocUrl, session.fetch);
};

export const getPodRoot = (webId) => {
  if (!webId) return "";
  const url = new URL(webId);
  const segments = url.pathname.split("/").filter(Boolean);
  const profileIndex = segments.indexOf("profile");
  const baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
  const basePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
  return `${url.origin}${basePath}`;
};

export const buildDefaultPrivateRegistry = (webId, podRoot = "") => {
  if (!webId && !podRoot) return "";
  return `${podRoot || getPodRoot(webId)}registry/`;
};

const normalizeContainerUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.href.endsWith("/") ? url.href : `${url.href}/`;
  } catch {
    return value.endsWith("/") ? value : `${value}/`;
  }
};

const getDocumentUrl = (resourceUrl) => resourceUrl.split("#")[0];

const COMMON_PREFIXES = {
  dcat: "http://www.w3.org/ns/dcat#",
  dcterms: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
};

const normalizeLocaleValues = (values) => {
  if (!values) return [];
  if (Array.isArray(values)) {
    return values
      .map((value) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
          return value.value || value.literal || value.literalValue || "";
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof values === "object") {
    return Object.values(values)
      .flatMap((value) => normalizeLocaleValues(value))
      .filter(Boolean);
  }
  return [];
};

const getAnyString = (thing, predicate) => {
  if (!thing) return "";
  const noLocale = getStringNoLocale(thing, predicate);
  if (noLocale) return noLocale;
  try {
    const values = normalizeLocaleValues(getStringWithLocaleAll(thing, predicate));
    if (!values || values.length === 0) return "";
    return values[0] || "";
  } catch {
    return "";
  }
};

const safeGetUrlAll = (thing, predicate) => {
  if (!thing) return [];
  try {
    return (getUrlAll(thing, predicate) || []).filter(Boolean);
  } catch (err) {
    console.warn("Invalid URL value for predicate", predicate, err);
    return [];
  }
};

const setLocaleString = (thing, predicate, value) => {
  if (!value) return thing;
  return setStringNoLocale(thing, predicate, value);
};

const getCatalogDocUrl = (webId, podRoot = "") =>
  `${podRoot || getPodRoot(webId)}${CATALOG_DOC}`;
const getCatalogResourceUrl = (webId, podRoot = "") =>
  `${getCatalogDocUrl(webId, podRoot)}#it`;
const getSeriesDocUrl = (webId, identifier) =>
  `${getPodRoot(webId)}${SERIES_CONTAINER}${identifier}.ttl`;
const getSeriesResourceUrl = (seriesDocUrl) => `${seriesDocUrl}#it`;

export const assertCatalogDatasetDeletionTarget = (
  podRoot,
  datasetUrl,
  identifier = ""
) => {
  const fail = () => {
    throw new Error(
      "Dataset URL must identify a direct catalog/ds/{identifier}.ttl#it resource in the selected Pod."
    );
  };

  if (
    typeof podRoot !== "string" ||
    !podRoot ||
    podRoot.trim() !== podRoot ||
    typeof datasetUrl !== "string" ||
    !datasetUrl ||
    datasetUrl.trim() !== datasetUrl
  ) {
    return fail();
  }

  let root;
  let candidate;
  try {
    root = new URL(podRoot);
    candidate = new URL(datasetUrl);
  } catch {
    return fail();
  }
  if (
    (root.protocol !== "https:" && root.protocol !== "http:") ||
    root.username ||
    root.password ||
    root.search ||
    root.hash ||
    (candidate.protocol !== "https:" && candidate.protocol !== "http:") ||
    candidate.username ||
    candidate.password ||
    candidate.search ||
    candidate.hash !== "#it"
  ) {
    return fail();
  }

  if (!root.pathname.endsWith("/")) root.pathname = `${root.pathname}/`;
  const datasetContainer = new URL(DATASET_CONTAINER, root);
  if (
    candidate.origin !== datasetContainer.origin ||
    !candidate.pathname.startsWith(datasetContainer.pathname)
  ) {
    return fail();
  }
  const fileName = candidate.pathname.slice(datasetContainer.pathname.length);
  if (
    !fileName ||
    fileName.includes("/") ||
    !fileName.endsWith(".ttl") ||
    !CATALOG_IDENTIFIER_PATTERN.test(fileName.slice(0, -4))
  ) {
    return fail();
  }

  const normalizedIdentifier = String(identifier || "").trim();
  if (normalizedIdentifier) {
    if (!CATALOG_IDENTIFIER_PATTERN.test(normalizedIdentifier)) return fail();
    const expected = new URL(`${normalizedIdentifier}.ttl#it`, datasetContainer).href;
    if (candidate.href !== expected) return fail();
  }
  return candidate.href;
};

const DISTRIBUTION_ACCESS_TYPES = {
  download: "download",
  access: "access",
};

const normalizeDistributionAccessType = (value) =>
  value === DISTRIBUTION_ACCESS_TYPES.access
    ? DISTRIBUTION_ACCESS_TYPES.access
    : DISTRIBUTION_ACCESS_TYPES.download;

const validateDatasetInput = (input) => {
  const distributions = profileDistributions(input);
  assertProfileDistributions(distributions);
  if (distributions.some(distribution => new URL(distribution.downloadURL).pathname.endsWith("/"))) {
    throw new Error("Solid containers must be cataloged as a Dataset Series.");
  }
};

const loadCache = () => ({ updatedAt: 0, catalogs: {} });
const saveCache = () => {};
const clearCache = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CACHE_KEY);
};

const ensureContainer = async (containerUrl, fetch) => {
  try {
    const res = await fetch(containerUrl, {
      method: "GET",
      headers: { Accept: "text/turtle" },
    });
    if (res.ok) return;
    if (res.status !== 404) return;
  } catch {
    // Continue and attempt creation.
  }

  try {
    await createContainerAt(containerUrl, { fetch });
  } catch (err) {
    const status = err?.statusCode || err?.response?.status;
    if (status === 409 || status === 412) {
      return;
    }
    throw err;
  }
};

const getResourceWithAcl = async (url, fetch) => {
  try {
    return await getSolidDatasetWithAcl(url, { fetch });
  } catch (datasetErr) {
    try {
      return await getFileWithAcl(url, { fetch });
    } catch (fileErr) {
      throw isNotFound(datasetErr) ? datasetErr : fileErr;
    }
  }
};

const getResourceAndAcl = async (url, fetch) => {
  const resource = await getResourceWithAcl(url, fetch);
  let resourceAcl;
  if (!hasResourceAcl(resource)) {
    if (!hasAccessibleAcl(resource)) {
      throw new Error("No access to ACL.");
    }
    resourceAcl = createAclFromFallbackAcl(resource);
  } else {
    resourceAcl = getResourceAcl(resource);
  }
  return { resource, resourceAcl };
};

const setPublicReadAccess = async (url, fetch, read) => {
  const { resource, resourceAcl } = await getResourceAndAcl(url, fetch);
  const updatedAcl = setPublicResourceAccess(resourceAcl, {
    read,
    append: false,
    write: false,
    control: false,
  });
  await saveAclFor(resource, updatedAcl, { fetch });
};

const makePublicReadable = async (url, fetch) => {
  try {
    await setPublicReadAccess(url, fetch, true);
  } catch (err) {
    console.warn("Failed to set public read ACL for", url, err);
  }
};

const setCatalogLinkInProfile = async (webId, catalogUrl, fetch) => {
  if (!webId || !catalogUrl) return;
  const profileDocUrl = webId.split("#")[0];
  const profileDataset = await getSolidDataset(profileDocUrl, { fetch });
  let profileThing = getThing(profileDataset, webId);
  if (!profileThing) {
    profileThing = createThing({ url: webId });
  }
  profileThing = removeAll(profileThing, SDP_CATALOG);
  profileThing = removeAll(profileThing, DCAT.catalog);
  profileThing = setUrl(profileThing, SDP_CATALOG, catalogUrl);
  // Keep older deployed applications able to discover the same catalog.
  profileThing = setUrl(profileThing, LEGACY_SDP_CATALOG, catalogUrl);
  const updatedProfile = setThing(profileDataset, profileThing);
  await saveSolidDatasetAt(profileDocUrl, updatedProfile, { fetch });
};

export const loadRegistryConfig = async (webId, fetch, { podRoot = "", onLoadError } = {}) => {
  if (!webId || !fetch) {
    return { mode: "research", registries: [], privateRegistry: "" };
  }
  const profileDocUrl = webId.split("#")[0];
  try {
    const profileDataset = await getSolidDataset(profileDocUrl, { fetch });
    const profileThing = getThing(profileDataset, webId);
    const mode = (getStringNoLocale(profileThing, SDM_REGISTRY_MODE) || "research").toLowerCase();
    const registries = (getUrlAll(profileThing, SDM_REGISTRY) || [])
      .filter(Boolean)
      .map((url) => url.replace(/\/+$/, ""));
    const privateRegistry =
      getUrl(profileThing, SDM_PRIVATE_REGISTRY) ||
      buildDefaultPrivateRegistry(webId, podRoot);
    return {
      mode: mode === "private" ? "private" : "research",
      registries,
      privateRegistry,
    };
  } catch (err) {
    console.warn("Failed to load registry config from profile:", err);
    onLoadError?.(err);
    return {
      mode: "research",
      registries: [],
      privateRegistry: buildDefaultPrivateRegistry(webId, podRoot),
    };
  }
};

export const saveRegistryConfig = async (
  webId,
  fetch,
  config,
  { podRoot = "" } = {}
) => {
  if (!webId || !fetch) return;
  const profileDocUrl = webId.split("#")[0];
  const profileDataset = await getSolidDataset(profileDocUrl, { fetch });
  let profileThing = getThing(profileDataset, webId);
  if (!profileThing) {
    profileThing = createThing({ url: webId });
  }

  const mode = config?.mode === "private" ? "private" : "research";
  const registries = (config?.registries || [])
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ""));
  const privateRegistry =
    config?.privateRegistry || buildDefaultPrivateRegistry(webId, podRoot);

  profileThing = removeAll(profileThing, SDM_REGISTRY_MODE);
  profileThing = setStringNoLocale(profileThing, SDM_REGISTRY_MODE, mode);
  profileThing = removeAll(profileThing, SDM_REGISTRY);
  registries.forEach((url) => {
    profileThing = addUrl(profileThing, SDM_REGISTRY, url);
  });
  profileThing = removeAll(profileThing, SDM_PRIVATE_REGISTRY);
  if (privateRegistry) {
    profileThing = setUrl(profileThing, SDM_PRIVATE_REGISTRY, privateRegistry);
  }

  const updatedProfile = setThing(profileDataset, profileThing);
  await saveSolidDatasetAt(profileDocUrl, updatedProfile, { fetch });
};

const ensureRegistryContainer = async (containerUrl, fetch) => {
  await ensureContainer(containerUrl, fetch);
  await makePublicReadable(containerUrl, fetch);
};

export const ensurePrivateRegistryContainer = async (
  webId,
  fetch,
  privateRegistryUrl,
  { podRoot = "" } = {}
) => {
  if (!webId || !fetch) return "";
  const target =
    normalizeContainerUrl(
      privateRegistryUrl || buildDefaultPrivateRegistry(webId, podRoot)
    );
  if (!target) return "";
  await ensureRegistryContainer(target, fetch);
  return target;
};

const resolveRegistryConfig = async (webId, fetch, override, podRoot = "") => {
  const base = override || (await loadRegistryConfig(webId, fetch, { podRoot }));
  const mode = base?.mode === "private" ? "private" : "research";
  const registries = (base?.registries || []).filter(Boolean);
  const privateRegistry =
    base?.privateRegistry || buildDefaultPrivateRegistry(webId, podRoot);
  return { mode, registries, privateRegistry };
};

const registerWebIdInRegistryContainer = async (
  containerUrl,
  fetch,
  memberWebId,
  { allowCreate } = {}
) => {
  const normalizedUrl = normalizeContainerUrl(containerUrl);
  if (!normalizedUrl || !memberWebId) return;

  if (allowCreate) {
    await ensureRegistryContainer(normalizedUrl, fetch);
  }

  const containerDataset = await getSolidDataset(normalizedUrl, { fetch });
  const resources = getContainedResourceUrlAll(containerDataset);
  for (const resourceUrl of resources) {
    try {
      const memberDataset = await getSolidDataset(resourceUrl, { fetch });
      const memberThing =
        getThing(memberDataset, `${resourceUrl}#it`) || getThingAll(memberDataset)[0];
        const existingWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
        if (existingWebId === memberWebId) return;
    } catch {
      // Ignore malformed entries.
    }
  }

  const turtle = [
    "@prefix foaf: <http://xmlns.com/foaf/0.1/>.",
    "@prefix dcterms: <http://purl.org/dc/terms/>.",
    "",
    "<#it> a foaf:Group ;",
    `  foaf:member <${memberWebId}> ;`,
    `  dcterms:modified "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`,
    "",
  ].join("\n");

  const res = await fetch(normalizedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/turtle",
      "Slug": `member-${encodeURIComponent(memberWebId)}`,
    },
    body: turtle,
  });
  if (!res.ok) {
    throw new Error(`Failed to write registry (${normalizedUrl}): ${res.status}`);
  }
};

const registerWebIdInRegistries = async (
  webId,
  fetch,
  registryConfig,
  podRoot = ""
) => {
  if (!webId) return;
  const config = await resolveRegistryConfig(webId, fetch, registryConfig, podRoot);
  let containers = [];
  let allowCreate = false;

  if (config.mode === "private") {
    allowCreate = true;
    containers = [config.privateRegistry];
  } else {
    containers = config.registries;
  }

  const normalized = Array.from(
    new Set(containers.map(normalizeContainerUrl).filter(Boolean))
  );
  if (!normalized.length) return;

  for (const containerUrl of normalized) {
    try {
      await registerWebIdInRegistryContainer(containerUrl, fetch, webId, { allowCreate });
    } catch (err) {
      throw new Error(
        `Failed to access registry (${containerUrl}): ${err?.message || err}`
      );
    }
  }
};

export const loadRegistryMembersFromContainer = async (containerUrl, fetch, { onLoadError } = {}) => {
  const normalizedUrl = normalizeContainerUrl(containerUrl);
  if (!normalizedUrl || !fetch) return [];
  try {
    const containerDataset = await getSolidDataset(normalizedUrl, { fetch });
    const resourceUrls = getContainedResourceUrlAll(containerDataset);
    const members = new Set();
    for (const resourceUrl of resourceUrls) {
      try {
        const memberDataset = await getSolidDataset(resourceUrl, { fetch });
        const memberThing =
          getThing(memberDataset, `${resourceUrl}#it`) || getThingAll(memberDataset)[0];
        const memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
        if (memberWebId) members.add(memberWebId);
      } catch (error) {
        onLoadError?.(error);
      }
    }
    return Array.from(members);
  } catch (err) {
    const status = err?.statusCode || err?.response?.status;
    onLoadError?.(err);
    if (status === 404) return [];
    console.warn("Failed to load registry container", normalizedUrl, err);
    return [];
  }
};

export const syncRegistryMembersInContainer = async (
  containerUrl,
  fetch,
  members,
  { allowCreate } = {}
) => {
  const normalizedUrl = normalizeContainerUrl(containerUrl);
  if (!normalizedUrl || !fetch) return;
  const cleanedMembers = Array.from(
    new Set((members || []).map((m) => (m || "").trim()).filter(Boolean))
  );

  if (allowCreate) {
    await ensureRegistryContainer(normalizedUrl, fetch);
  }

  const containerDataset = await getSolidDataset(normalizedUrl, { fetch });
  const resourceUrls = getContainedResourceUrlAll(containerDataset);
  const existing = new Map();
  for (const resourceUrl of resourceUrls) {
    try {
      const memberDataset = await getSolidDataset(resourceUrl, { fetch });
      const memberThing =
        getThing(memberDataset, `${resourceUrl}#it`) || getThingAll(memberDataset)[0];
      const memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
      if (memberWebId) {
        existing.set(memberWebId, resourceUrl);
      }
    } catch {
      // Ignore malformed entries.
    }
  }

  for (const [memberWebId, resourceUrl] of existing.entries()) {
    if (!cleanedMembers.includes(memberWebId)) {
      await deleteFile(resourceUrl, { fetch });
      existing.delete(memberWebId);
    }
  }

  for (const memberWebId of cleanedMembers) {
    if (!existing.has(memberWebId)) {
      await registerWebIdInRegistryContainer(normalizedUrl, fetch, memberWebId, { allowCreate });
    }
  }
};

export const ensureCatalogStructure = async (
  session,
  { title, description, registryConfig, podRoot: podRootOverride } = {}
) => {
  if (!session?.info?.webId) {
    throw new Error("No Solid WebID available.");
  }
  const webId = session.info.webId;
  const podRoot = podRootOverride || getPodRoot(webId);
  const fetch = session.fetch;

  await ensureContainer(`${podRoot}${CATALOG_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${DATASET_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${SERIES_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${RECORDS_CONTAINER}`, fetch);

  // Legacy local registry.ttl is no longer used.

  const catalogDocUrl = getCatalogDocUrl(webId, podRoot);
  const catalogResourceUrl = getCatalogResourceUrl(webId, podRoot);

  await ensureCatalogDocument(session, catalogDocUrl, {
    title: title || "Solid Dataspace Catalog",
    description: description || "",
    contactPoint: webId,
  });

  await makePublicReadable(catalogDocUrl, fetch);
  await makePublicReadable(`${podRoot}${CATALOG_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${DATASET_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${SERIES_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${RECORDS_CONTAINER}`, fetch);

  await setCatalogLinkInProfile(webId, catalogResourceUrl, fetch);
  await registerWebIdInRegistries(webId, fetch, registryConfig, podRoot);

  return {
    catalogDocUrl,
    catalogUrl: catalogResourceUrl,
  };
};

const deleteResourcesInContainer = async (containerUrl, fetch) => {
  try {
    const containerDataset = await getSolidDataset(containerUrl, { fetch });
    const resourceUrls = getContainedResourceUrlAll(containerDataset);
    for (const resourceUrl of resourceUrls) {
      try {
        await deleteFile(resourceUrl, { fetch });
      } catch (err) {
        console.warn("Failed to delete resource", resourceUrl, err);
      }
    }
  } catch (err) {
    const status = err?.statusCode || err?.response?.status;
    if (status === 404) return;
    console.warn("Failed to read container", containerUrl, err);
  }
};

export const resetCatalog = async (session, { registryConfig } = {}) => {
  if (!session?.info?.webId) {
    throw new Error("No Solid WebID available.");
  }
  await ensureCatalogStructure(session, { registryConfig });
  const webId = session.info.webId;
  const podRoot = getPodRoot(webId);
  const fetch = session.fetch;

  await deleteResourcesInContainer(`${podRoot}${DATASET_CONTAINER}`, fetch);
  await deleteResourcesInContainer(`${podRoot}${SERIES_CONTAINER}`, fetch);
  await deleteResourcesInContainer(`${podRoot}${RECORDS_CONTAINER}`, fetch);

  await writeCatalogDoc(session, getCatalogDocUrl(webId), []);
  clearCache();
};

export const resolveCatalogUrlFromWebId = async (webId, fetch) => {
  if (!webId || !fetch) return getCatalogResourceUrl(webId);
  try {
    const profileDocUrl = webId.split("#")[0];
    const profileDoc = await getSolidDataset(profileDocUrl, { fetch });
    const profileThing = getThing(profileDoc, webId);
    const profileCatalog = profileThing
      ? getUrl(profileThing, SDP_CATALOG) || getUrl(profileThing, LEGACY_SDP_CATALOG) || getUrl(profileThing, DCAT.catalog)
      : null;
    if (profileCatalog) return profileCatalog;
  } catch (err) {
    console.warn("Failed to resolve catalog URL from profile:", err);
  }

  return getCatalogResourceUrl(webId);
};

const loadRegistryMembers = async (webId, fetch, { podRoot = "", onLoadError } = {}) => {
  const members = new Set();
  if (webId) members.add(webId);

  const config = await loadRegistryConfig(webId, fetch, { podRoot, onLoadError });
  let containers = [];
  if (config.mode === "private") {
    containers = [config.privateRegistry];
  } else {
    containers = config.registries || [];
  }

  const normalized = Array.from(
    new Set(containers.map(normalizeContainerUrl).filter(Boolean))
  );
  if (!normalized.length) return Array.from(members);

  for (const containerUrl of normalized) {
    try {
      const containerDataset = await getSolidDataset(containerUrl, { fetch });
      const resourceUrls = getContainedResourceUrlAll(containerDataset);
      for (const resourceUrl of resourceUrls) {
        try {
          const memberDataset = await getSolidDataset(resourceUrl, { fetch });
          const memberThing =
            getThing(memberDataset, `${resourceUrl}#it`) || getThingAll(memberDataset)[0];
          const memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
          if (memberWebId) members.add(memberWebId);
        } catch (error) {
          onLoadError?.(error);
        }
      }
    } catch (err) {
      console.warn("Failed to load registry container:", containerUrl, err);
      onLoadError?.(err);
    }
  }

  return Array.from(members);
};

export const parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  const datasetThing = resolveDatasetThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;

  const baseIri =
    datasetDoc?.internal_resourceInfo?.sourceIri || getDocumentUrl(datasetUrl);

  const identifier = getStringNoLocale(datasetThing, DCTERMS.identifier) || datasetUrl;
  const types = getUrlAll(datasetThing, RDF.type) || [];
  const seriesMembersRaw = safeGetUrlAll(datasetThing, DCAT_SERIES_MEMBER);
  const isSeries =
    types.includes(DCAT_DATASET_SERIES) ||
    types.includes(DCAT.DatasetSeries) ||
    types.includes("http://www.w3.org/ns/dcat#DatasetSeries") ||
    seriesMembersRaw.length > 0;
  const title = getAnyString(datasetThing, DCTERMS.title) || "Untitled dataset";
  const description = getAnyString(datasetThing, DCTERMS.description) || "";
  const issued = getDatetime(datasetThing, DCTERMS.issued);
  const modified = getDatetime(datasetThing, DCTERMS.modified);
  const publisherLiteral = getAnyString(datasetThing, DCTERMS.publisher) || "";
  const publisherRef = getUrl(datasetThing, DCTERMS.publisher) || "";
  let publisher = publisherLiteral;
  if (!publisher && publisherRef) {
    const publisherThing = getThing(datasetDoc, publisherRef);
    if (publisherThing) {
      publisher =
        getAnyString(publisherThing, FOAF.name) ||
        getAnyString(publisherThing, VCARD.fn) ||
        getAnyString(publisherThing, DCTERMS.title) ||
        "";
    }
  }
  if (!publisher) publisher = publisherRef;
  const creator = getUrl(datasetThing, DCTERMS.creator) || "";
  let theme =
    getStringNoLocale(datasetThing, DCAT.theme) || getUrl(datasetThing, DCAT.theme) || "";
  if (!theme) {
    theme = getAnyString(datasetThing, DCAT.theme) || "";
  }
  const accessRights = getStringNoLocale(datasetThing, DCTERMS.accessRights) || "";

  const contactRef = getUrl(datasetThing, DCAT.contactPoint) || "";
  const contactLiteral =
    getStringNoLocale(datasetThing, DCAT.contactPoint) ||
    getAnyString(datasetThing, DCAT.contactPoint) ||
    "";
  let contact = stripMailto(contactLiteral);
  let contactType = contact
    ? contactLiteral.startsWith("mailto:") || contact.includes("@")
      ? "email"
      : isValidUrl(contact)
        ? "url"
        : "text"
    : "";
  if (!contact && contactRef) {
    const contactThing = getThing(datasetDoc, contactRef);
    if (contactThing) {
      const mailto =
        getUrl(contactThing, VCARD.hasEmail) ||
        getUrl(contactThing, VCARD.value) ||
        getStringNoLocale(contactThing, VCARD.hasEmail) ||
        getStringNoLocale(contactThing, VCARD.value) ||
        getUrl(contactThing, FOAF.mbox) ||
        getStringNoLocale(contactThing, FOAF.mbox) ||
        "";
      if (mailto) {
        contact = stripMailto(mailto);
        contactType = "email";
      } else {
        const contactUrl =
          getUrl(contactThing, VCARD_HAS_URL) || getUrl(contactThing, VCARD_URL) || "";
        if (contactUrl) {
          contact = contactUrl;
          contactType = "url";
        } else {
          contact = getAnyString(contactThing, VCARD.fn) || "";
          contactType = contact ? "text" : "";
        }
      }
    } else if (isValidUrl(contactRef)) {
      contact = contactRef;
      contactType = "url";
    }
  }

  const legacyModels = [
    ...safeGetUrlAll(datasetThing, DCTERMS.conformsTo),
    ...safeGetUrlAll(datasetThing, LEGACY_DCAT_CONFORMS_TO),
  ];
  const distributions = safeGetUrlAll(datasetThing, DCAT.distribution).map((url) => {
    const distributionUrl = resolveUrl(url, baseIri);
    const thing = getThing(datasetDoc, distributionUrl) || getThing(datasetDoc, url);
    if (!thing) return null;
    const downloadURL = getUrl(thing, DCAT.downloadURL) || "";
    const accessURL = getUrl(thing, DCAT.accessURL) || "";
    const conformsTo = safeGetUrlAll(thing, DCTERMS.conformsTo);
    return {
      url: distributionUrl,
      downloadURL: downloadURL ? resolveUrl(downloadURL, baseIri) : "",
      accessURL: accessURL ? resolveUrl(accessURL, baseIri) : "",
      mediaType: getUrl(thing, DCAT.mediaType) || getStringNoLocale(thing, DCAT.mediaType) ||
        getAnyString(thing, DCTERMS.format) || getUrl(thing, DCTERMS.format) || "",
      conformsTo: [...new Set(conformsTo.length ? conformsTo : legacyModels)],
    };
  }).filter(Boolean);
  const primaryDistribution = distributions.find((item) => item.downloadURL || item.accessURL);
  const accessUrlDataset = primaryDistribution?.downloadURL || primaryDistribution?.accessURL || "";
  const semanticModels = [...new Set(distributions.flatMap((item) => item.conformsTo).concat(legacyModels))];
  const accessUrlModel = primaryDistribution?.conformsTo?.[0] || semanticModels[0] || "";
  const fileFormat = primaryDistribution?.mediaType || "";
  const distributionAccessType = !primaryDistribution || primaryDistribution.downloadURL ? "download" : "access";

  const isPublic = (accessRights || "").toLowerCase() === "public";
  const seriesMembers = isSeries ? seriesMembersRaw : [];
  const inSeries = safeGetUrlAll(datasetThing, DCAT_IN_SERIES);

  return {
    identifier,
    title,
    description,
    issued: issued ? issued.toISOString() : "",
    modified: modified ? modified.toISOString() : "",
    publisher,
    publisher_url: publisherRef,
    contact_point: contact,
    contact_point_type: contactType,
    access_url_dataset: accessUrlDataset,
    access_url_semantic_model: accessUrlModel,
    distributions,
    semanticModels,
    file_format: fileFormat,
    distribution_access_type: distributionAccessType,
    theme,
    is_public: isPublic,
    webid: creator,
    datasetUrl,
    datasetType: isSeries ? "series" : "dataset",
    seriesMembers,
    inSeries,
  };
};

export const loadCatalogDatasets = async (catalogUrl, fetch, onLoadError) => {
  const documents = new Map();
  const visited = new Set();
  const datasets = new Map();
  const read = (url) => {
    const docUrl = getDocumentUrl(url);
    if (!documents.has(docUrl)) {
      if (documents.size >= 1000) throw new Error("Catalog metadata document limit reached.");
      documents.set(docUrl, getSolidDataset(docUrl, { fetch }));
    }
    return documents.get(docUrl);
  };
  let pending = [catalogUrl];
  while (pending.length) {
    const next = [];
    await Promise.all(pending.map(async (url) => {
      if (visited.has(url)) return;
      visited.add(url);
      try {
        let doc = await read(url);
        const thing = getThing(doc, url) || getThingByTypes(doc, [DCAT.Catalog, DCAT.CatalogRecord, DCAT.Dataset, DCAT.DatasetSeries]);
        if (!thing) return;
        const types = getUrlAll(thing, RDF.type);
        if (url === catalogUrl || types.includes(DCAT.Catalog)) {
          next.push(...safeGetUrlAll(thing, DCAT.dataset), ...safeGetUrlAll(thing, DCAT.record),
            ...safeGetUrlAll(thing, "http://www.w3.org/ns/dcat#datasetSeries"));
          return;
        }
        if (types.includes(DCAT.CatalogRecord)) {
          next.push(...safeGetUrlAll(thing, FOAF.primaryTopic));
          return;
        }
        // Distribution descriptions are metadata. Never fetch downloadURL,
        // accessURL or conformsTo targets during catalog discovery.
        for (const distribution of safeGetUrlAll(thing, DCAT.distribution)) {
          if (!getThing(doc, distribution)) {
            const distributionDoc = await read(distribution);
            getThingAll(distributionDoc).forEach((item) => { doc = setThing(doc, item); });
          }
        }
        const dataset = parseDatasetFromDoc(doc, thing.url);
        if (dataset) datasets.set(dataset.datasetUrl, dataset);
        next.push(...safeGetUrlAll(thing, DCAT_SERIES_MEMBER));
      } catch (err) {
        console.warn("Failed to load catalog metadata", url, err);
        onLoadError?.(err, { stage: url === catalogUrl ? "catalog" : "dataset" });
        if (url === catalogUrl) throw err;
      }
    }));
    pending = [...new Set(next)].filter((url) => !visited.has(url));
  }
  return [...datasets.values()];
};

const mergeDatasets = (lists) => {
  const map = new Map();
  lists.flat().forEach((dataset) => {
    if (!dataset) return;
    const key =
      dataset.datasetUrl ||
      `${dataset.catalogUrl || "unknown-catalog"}::${dataset.identifier || ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, dataset);
      return;
    }
    const existingModified = existing.modified ? new Date(existing.modified).getTime() : 0;
    const nextModified = dataset.modified ? new Date(dataset.modified).getTime() : 0;
    if (nextModified >= existingModified) {
      map.set(key, dataset);
    }
  });
  return Array.from(map.values());
};

export const loadAggregatedDatasets = async (
  session,
  fetchOverride,
  { researchRegistries, onLoadError, usePublicCache = false } = {}
) => {
  const webId = session?.info?.webId || "";
  let fetch =
    fetchOverride ||
    session?.fetch ||
    (typeof window !== "undefined" ? window.fetch.bind(window) : fetchOverride);
  if (!fetch) return { datasets: [], catalogs: [] };

  let snapshots = [];
  let selectedRegistries = researchRegistries;
  if (usePublicCache) {
    if (!Array.isArray(selectedRegistries)) {
      const registryConfig = await loadRegistryConfig(webId, fetch, { onLoadError });
      if (registryConfig.mode !== "private") selectedRegistries = registryConfig.registries;
    }
    if (Array.isArray(selectedRegistries)) snapshots = await loadPublicCatalogCache(selectedRegistries);
  }
  const cachedMembers = new Map(snapshots.filter((s) => s.discoveryComplete).map((s) => [s.registryUrl, s.members]));
  const cachedCatalogs = new Map(snapshots.flatMap((s) => s.members.map((m) => [m.webId, m.catalogUrl])));
  let registryMembers;
  if (Array.isArray(selectedRegistries)) {
    const membersByRegistry = await Promise.all(
      selectedRegistries.map((registryUrl) =>
        cachedMembers.get(normalizeContainerUrl(registryUrl))?.map((m) => m.webId) ||
        loadRegistryMembersFromContainer(registryUrl, fetch, { onLoadError })
      )
    );
    registryMembers = Array.from(
      new Set(
        membersByRegistry
          .flat()
          .filter((memberWebId) => {
            try {
              const url = new URL(memberWebId);
              return (
                (url.protocol === "https:" || url.protocol === "http:") &&
                !url.username &&
                !url.password &&
                !url.search
              );
            } catch {
              return false;
            }
          })
      )
    );
    if (!Array.isArray(researchRegistries) && webId && !registryMembers.includes(webId)) registryMembers.push(webId);
  } else {
    registryMembers = await loadRegistryMembers(webId, fetch, { onLoadError });
  }
  const catalogUrls = await Promise.all(
    registryMembers.map((member) => (member !== webId && cachedCatalogs.get(member)) || resolveCatalogUrlFromWebId(member, fetch))
  );
  if (snapshots.length) {
    const ownIndex = registryMembers.indexOf(webId);
    fetch = cachedCatalogFetch(snapshots, fetch, { ownCatalogUrl: catalogUrls[ownIndex], isLoggedIn: Boolean(session?.info?.isLoggedIn) });
  }
  const uniqueCatalogUrls = Array.from(
    new Set(
      catalogUrls.filter((catalogUrl) => {
        if (!catalogUrl) return false;
        try {
          const url = new URL(catalogUrl);
          return (
            (url.protocol === "https:" || url.protocol === "http:") &&
            !url.username &&
            !url.password &&
            !url.search
          );
        } catch {
          return false;
        }
      })
    )
  );

  const cache = loadCache();
  const now = Date.now();
  const useCacheOnly = now - cache.updatedAt < CACHE_TTL_MS;
  const results = [];
  const updatedCache = { ...cache, catalogs: { ...cache.catalogs } };

  const fetchCatalog = async (catalogUrl) => {
    try {
      const datasets = await loadCatalogDatasets(catalogUrl, fetch, onLoadError);
      updatedCache.catalogs[catalogUrl] = {
        datasets,
        lastSuccess: now,
      };
      return { datasets, lastSuccess: now, failed: false };
    } catch (err) {
      console.warn("Catalog load failed", catalogUrl, err);
      onLoadError?.(err, { stage: "catalog" });
      const cached = cache.catalogs[catalogUrl];
      if (cached?.datasets) {
        return { datasets: cached.datasets, lastSuccess: cached.lastSuccess || 0, failed: true };
      }
      return { datasets: [], lastSuccess: 0, failed: true };
    }
  };

  for (const catalogUrl of uniqueCatalogUrls) {
    if (useCacheOnly && cache.catalogs[catalogUrl]) {
      results.push({
        catalogUrl,
        datasets: cache.catalogs[catalogUrl].datasets || [],
        lastSuccess: cache.catalogs[catalogUrl].lastSuccess || 0,
        failed: false,
      });
      continue;
    }
    const catalogResult = await fetchCatalog(catalogUrl);
    results.push({ catalogUrl, ...catalogResult });
  }

  updatedCache.updatedAt = now;
  saveCache(updatedCache);

  const annotated = results.flatMap((result) => {
    const lastSeen = result.lastSuccess || 0;
    const age = now - lastSeen;
    if (lastSeen && age > DROP_AFTER_MS) {
      return [];
    }
    const stale = lastSeen && age > STALE_AFTER_MS;
    return (result.datasets || []).map((dataset) => ({
      ...dataset,
      catalogUrl: result.catalogUrl,
      lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : "",
      isStale: Boolean(stale),
    }));
  });

  return {
    datasets: mergeDatasets(annotated),
    catalogs: uniqueCatalogUrls,
  };
};

const DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";
const DCAT_DATASET_SERIES = "http://www.w3.org/ns/dcat#DatasetSeries";
const DCAT_SERIES_MEMBER = DCAT.seriesMember || "http://www.w3.org/ns/dcat#seriesMember";
const DCAT_IN_SERIES = DCAT.inSeries || "http://www.w3.org/ns/dcat#inSeries";

const toThemeIri = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return `${DEFAULT_THEME_NS}${encodeURIComponent(slug)}`;
};

const isValidUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const buildDatasetResource = (datasetDocUrl, input, previous = null) => {
  const datasetUrl = `${datasetDocUrl}#it`;
  let datasetThing = previous || createThing({ url: datasetUrl });
  datasetThing = addUrl(datasetThing, RDF.type, DCAT.Dataset);
  datasetThing = removeAll(datasetThing, DCTERMS.identifier);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.identifier, input.identifier);
  datasetThing = removeAll(datasetThing, DCTERMS.title);
  datasetThing = setLocaleString(datasetThing, DCTERMS.title, input.title || "");
  datasetThing = removeAll(datasetThing, DCTERMS.description);
  datasetThing = setLocaleString(datasetThing, DCTERMS.description, input.description || "");
  datasetThing = removeAll(datasetThing, DCTERMS.issued);
  datasetThing = setDatetime(datasetThing, DCTERMS.issued, new Date(input.issued || safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.modified);
  datasetThing = setDatetime(datasetThing, DCTERMS.modified, new Date(safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.publisher);
  if (input.publisher_url) {
    datasetThing = setUrl(datasetThing, DCTERMS.publisher, input.publisher_url);
  } else if (input.publisher) {
    datasetThing = setLocaleString(datasetThing, DCTERMS.publisher, input.publisher);
  }
  datasetThing = removeAll(datasetThing, DCTERMS.creator);
  if (input.webid) {
    datasetThing = setUrl(datasetThing, DCTERMS.creator, input.webid);
  }
  datasetThing = removeAll(datasetThing, DCAT.contactPoint);
  datasetThing = removeAll(datasetThing, DCAT.theme);
  if (input.theme) {
    datasetThing = setUrl(datasetThing, DCAT.theme, toThemeIri(input.theme));
  }
  datasetThing = removeAll(datasetThing, DCTERMS.conformsTo);
  datasetThing = removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  datasetThing = removeAll(datasetThing, DCTERMS.accessRights);
  datasetThing = setStringNoLocale(
    datasetThing,
    DCTERMS.accessRights,
    input.is_public ? "public" : "restricted"
  );
  const inSeries = input.in_series ?? input.inSeries ?? (previous ? getUrlAll(previous, DCAT_IN_SERIES) : []);
  datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
  if (inSeries) {
    const seriesList = Array.isArray(inSeries) ? inSeries : [inSeries];
    seriesList.filter(Boolean).forEach((seriesUrl) => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }

  return datasetThing;
};

const buildSeriesResource = (seriesDocUrl, input, previous = null) => {
  const seriesUrl = input.seriesUrl || `${seriesDocUrl}#it`;
  let seriesThing = previous || createThing({ url: seriesUrl });
  seriesThing = addUrl(seriesThing, RDF.type, DCAT_DATASET_SERIES);
  seriesThing = addUrl(seriesThing, RDF.type, DCAT.Dataset);
  seriesThing = removeAll(seriesThing, DCTERMS.identifier);
  if (input.identifier) {
    seriesThing = setStringNoLocale(seriesThing, DCTERMS.identifier, input.identifier);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.title);
  seriesThing = setLocaleString(seriesThing, DCTERMS.title, input.title || "");
  seriesThing = removeAll(seriesThing, DCTERMS.description);
  if (input.description) {
    seriesThing = setLocaleString(seriesThing, DCTERMS.description, input.description);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.issued);
  if (input.issued) {
    seriesThing = setDatetime(seriesThing, DCTERMS.issued, new Date(input.issued));
  }
  seriesThing = removeAll(seriesThing, DCTERMS.modified);
  seriesThing = setDatetime(seriesThing, DCTERMS.modified, new Date(safeNow()));
  seriesThing = removeAll(seriesThing, DCTERMS.publisher);
  if (input.publisher_url) {
    seriesThing = setUrl(seriesThing, DCTERMS.publisher, input.publisher_url);
  } else if (input.publisher) {
    seriesThing = setLocaleString(seriesThing, DCTERMS.publisher, input.publisher);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.creator);
  if (input.webid) {
    seriesThing = setUrl(seriesThing, DCTERMS.creator, input.webid);
  }
  seriesThing = removeAll(seriesThing, DCAT.contactPoint);
  if (input.contact_point || input.contact_url) {
    const contactThing = buildContactThing(seriesDocUrl, input);
    input.__contactThing = contactThing;
    seriesThing = setUrl(seriesThing, DCAT.contactPoint, contactThing.url);
  }
  if (input.publisher_url && input.publisher) {
    input.__publisherThing = buildPublisherThing(input);
  }
  seriesThing = removeAll(seriesThing, DCAT.theme);
  if (input.theme) {
    seriesThing = setUrl(seriesThing, DCAT.theme, toThemeIri(input.theme));
  }
  seriesThing = removeAll(seriesThing, DCTERMS.accessRights);
  seriesThing = removeAll(seriesThing, DCAT_SERIES_MEMBER);
  (input.seriesMembers || [])
    .filter((memberUrl) => isValidUrl(memberUrl))
    .forEach((memberUrl) => {
      seriesThing = addUrl(seriesThing, DCAT_SERIES_MEMBER, memberUrl);
    });

  return seriesThing;
};

export const buildContactThing = (datasetDocUrl, input) => {
  if (!input.contact_point && !input.contact_url) return null;
  const contactUrl = `${datasetDocUrl}#contact`;
  let contactThing = createThing({ url: contactUrl });
  contactThing = addUrl(contactThing, RDF.type, VCARD.Individual);
  if (input.publisher) {
    contactThing = setLocaleString(contactThing, VCARD.fn, input.publisher);
  }
  contactThing = removeAll(contactThing, VCARD.hasEmail);
  if (input.contact_point) {
    contactThing = setUrl(contactThing, VCARD.hasEmail, `mailto:${input.contact_point}`);
  }
  contactThing = removeAll(contactThing, VCARD_HAS_URL);
  if (input.contact_url) {
    contactThing = setUrl(contactThing, VCARD_HAS_URL, input.contact_url);
  }
  return contactThing;
};

export const buildPublisherThing = (input) => {
  if (!input.publisher_url || !input.publisher) return null;
  let publisherThing = createThing({ url: input.publisher_url });
  publisherThing = addUrl(publisherThing, RDF.type, FOAF.Agent);
  publisherThing = setLocaleString(publisherThing, FOAF.name, input.publisher);
  return publisherThing;
};

const isLocalPodResource = (webId, targetUrl, podRootOverride = "") => {
  if (!webId || !targetUrl) return false;
  try {
    const root = new URL(podRootOverride || getPodRoot(webId));
    const target = new URL(targetUrl);
    if (
      (root.protocol !== "https:" && root.protocol !== "http:") ||
      root.username ||
      root.password ||
      root.search ||
      root.hash ||
      (target.protocol !== "https:" && target.protocol !== "http:") ||
      target.username ||
      target.password ||
      target.search
    ) {
      return false;
    }
    const rootPath = root.pathname.endsWith("/")
      ? root.pathname
      : `${root.pathname}/`;
    return target.origin === root.origin && target.pathname.startsWith(rootPath);
  } catch {
    return false;
  }
};

const getAclTargetUrl = (resourceUrl) => {
  const target = new URL(resourceUrl);
  target.hash = "";
  return target.href;
};

export const ensurePublicReadOnlyResourceAccess = async (
  session,
  resourceUrl,
  { podRoot = "" } = {}
) => {
  if (!session?.info?.webId || typeof session.fetch !== "function") {
    throw new Error("An authenticated Solid session is required.");
  }
  if (!isLocalPodResource(session.info.webId, resourceUrl, podRoot)) {
    throw new Error("Public programmatic datasets must use a resource in the owner's Pod.");
  }
  const aclTargetUrl = getAclTargetUrl(resourceUrl);
  if (new URL(aclTargetUrl).pathname.endsWith("/")) {
    throw new Error("Public programmatic datasets must use a non-container resource.");
  }

  await setPublicReadAccess(aclTargetUrl, session.fetch, true);
  const { resourceAcl } = await getResourceAndAcl(aclTargetUrl, session.fetch);
  const publicAccess = getPublicResourceAccess(resourceAcl) || {};
  if (
    publicAccess.read !== true ||
    publicAccess.append !== false ||
    publicAccess.write !== false ||
    publicAccess.control !== false
  ) {
    throw new Error(
      `Resource does not have verified public read-only access after ACL update: ${resourceUrl}`
    );
  }
};

export const ensureRestrictedResourceAccess = async (
  session,
  resourceUrl,
  { podRoot = "" } = {}
) => {
  if (!session?.info?.webId || typeof session.fetch !== "function") {
    throw new Error("An authenticated Solid session is required.");
  }
  if (!isLocalPodResource(session.info.webId, resourceUrl, podRoot)) {
    throw new Error("Restricted programmatic datasets must use a resource in the owner's Pod.");
  }

  const aclTargetUrl = getAclTargetUrl(resourceUrl);
  await setPublicReadAccess(aclTargetUrl, session.fetch, false);
  const { resourceAcl } = await getResourceAndAcl(aclTargetUrl, session.fetch);
  const publicAccess = getPublicResourceAccess(resourceAcl);
  if (
    publicAccess.read ||
    publicAccess.append ||
    publicAccess.write ||
    publicAccess.control
  ) {
    throw new Error(`Resource still has public access after ACL update: ${resourceUrl}`);
  }
};

const syncLinkedResourceAccess = async (session, input) => {
  const distributions = profileDistributions(input);
  const downloadUrls = new Set(distributions.map((item) => item.downloadURL).filter(Boolean));
  const urls = [...new Set([...downloadUrls, ...distributions.flatMap((item) => item.conformsTo)])];
  for (const url of urls) {
    if (!isLocalPodResource(session?.info?.webId, url, input.podRoot)) {
      // External schema references describe local data; their ACL is not ours to change.
      // Restricted downloads must still be in the owner's Pod, even when also used as a model.
      if (downloadUrls.has(url) && input.strict_restricted_acl && !input.is_public) {
        throw new Error(`Restricted linked resource is outside the owner's Pod: ${url}`);
      }
      continue;
    }
    try {
      if (input.strict_restricted_acl && !input.is_public) {
        await ensureRestrictedResourceAccess(session, url, { podRoot: input.podRoot });
      } else if (input.strict_public_acl && input.is_public) {
        await ensurePublicReadOnlyResourceAccess(session, url, {
          podRoot: input.podRoot,
        });
      } else {
        await setPublicReadAccess(url, session.fetch, Boolean(input.is_public));
      }
    } catch (err) {
      console.warn("Failed to sync linked resource ACL for", url, err);
      if (
        input.is_public ||
        input.strict_restricted_acl ||
        input.strict_public_acl
      ) {
        const accessLabel = input.is_public ? "public" : "restricted";
        throw new Error(`Failed to make linked resource ${accessLabel}: ${url}`);
      }
    }
  }
};

const withCatalogRecord = (document, docUrl, datasetUrl, operationId = "") => {
  let record = getThing(document, docUrl) || createThing({ url: docUrl });
  record = addUrl(record, RDF.type, DCAT.CatalogRecord);
  record = setUrl(record, FOAF.primaryTopic, datasetUrl);
  record = setDatetime(record, DCTERMS.modified, new Date());
  if (operationId) {
    const changeUrl = `${docUrl}#change-${operationId}`;
    let change = createThing({ url: changeUrl });
    change = addUrl(change, RDF.type, SDM_CHANGE_EVENT);
    change = setDatetime(change, DCTERMS.modified, new Date());
    document = setThing(document, change);
    if (!getUrlAll(record, SDM_CHANGELOG).includes(changeUrl)) record = addUrl(record, SDM_CHANGELOG, changeUrl);
  }
  return setThing(document, record);
};

const readExistingMetadata = async (url, fetch, allowCreate = true) => {
  try { return await getSolidDataset(url, { fetch }); }
  catch (error) { if (isNotFound(error) && allowCreate) return null; throw error; }
};

const addDistributionDescriptions = (document, datasetThing, docUrl, input) => {
  const values = profileDistributions(input);
  assertProfileDistributions(values);
  const original = document;
  const oldThing = getThing(document, datasetThing.url);
  for (const oldUrl of oldThing ? getUrlAll(oldThing, DCAT.distribution) : []) {
    if (oldUrl.startsWith(`${docUrl}#`)) document = removeThing(document, oldUrl);
  }
  datasetThing = removeAll(datasetThing, DCAT.distribution);
  values.forEach((distribution, index) => {
    // All descriptions are secondary resources of this record document.
    const url = distribution.url?.startsWith(`${docUrl}#`) ? distribution.url : `${docUrl}#dist${index || ""}`;
    let thing = getThing(original, url) || createThing({ url });
    for (const predicate of [DCAT.downloadURL, DCAT.accessURL, DCAT.mediaType, DCTERMS.format, DCTERMS.conformsTo]) {
      thing = removeAll(thing, predicate);
    }
    thing = addUrl(thing, RDF.type, DCAT.Distribution);
    thing = setUrl(thing, DCAT.downloadURL, distribution.downloadURL);
    if (distribution.accessURL) thing = setUrl(thing, DCAT.accessURL, distribution.accessURL);
    thing = /^https?:/.test(distribution.mediaType)
      ? setUrl(thing, DCAT.mediaType, distribution.mediaType)
      : setStringNoLocale(thing, DCAT.mediaType, distribution.mediaType);
    distribution.conformsTo.forEach((model) => { thing = addUrl(thing, DCTERMS.conformsTo, model); });
    document = setThing(document, thing);
    datasetThing = addUrl(datasetThing, DCAT.distribution, url);
  });
  return setThing(document, datasetThing);
};

const writeDatasetDocument = async (session, datasetDocUrl, input, { allowCreate = true } = {}) => {
  const previous = await readExistingMetadata(datasetDocUrl, session.fetch, allowCreate);
  let document = previous || createSolidDataset();
  let datasetThing = buildDatasetResource(datasetDocUrl, input, getThing(document, `${datasetDocUrl}#it`));
  const publisher = buildPublisherThing(input);
  if (publisher) document = setThing(document, publisher);
  const contact = buildContactThing(datasetDocUrl, input);
  if (contact) {
    document = setThing(document, contact);
    datasetThing = setUrl(datasetThing, DCAT.contactPoint, contact.url);
  }
  document = addDistributionDescriptions(document, datasetThing, datasetDocUrl, input);
  document = withCatalogRecord(document, datasetDocUrl, datasetThing.url, input.operation_id);
  await saveProfileDocument(datasetDocUrl, previous, document, session.fetch);
  await makePublicReadable(datasetDocUrl, session.fetch);
  await syncLinkedResourceAccess(session, input);
};

export const validateSeriesMembers = async (session, urls) => {
  const members = [];
  for (const url of urls) {
    let doc = await getSolidDataset(getDocumentUrl(url), { fetch: session.fetch });
    const thing = resolveDatasetThing(doc, url);
    for (const distribution of thing ? getUrlAll(thing, DCAT.distribution) : []) {
      if (!getThing(doc, distribution)) {
        const linked = await getSolidDataset(getDocumentUrl(distribution), { fetch: session.fetch });
        getThingAll(linked).forEach(item => { doc = setThing(doc, item); });
      }
    }
    const member = parseDatasetFromDoc(doc, url);
    if (!member) throw new Error("Series member metadata is unavailable.");
    // Legacy fallback is for reading only; do not publish new series on that basis.
    const distributions = member.distributions.map(distribution => ({
      ...distribution,
      conformsTo: getUrlAll(getThing(doc, distribution.url), DCTERMS.conformsTo),
    }));
    assertProfileDistributions(distributions);
    members.push(member);
  }
  return members;
};

export const validateSeriesContainer = async (session, containerUrl, resourceUrls = []) => {
  if (!containerUrl || !containerUrl.endsWith("/")) {
    throw new Error("A dataset series must describe a Solid container. Select files from one container or supply its URL.");
  }
  const container = await getSolidDataset(containerUrl, { fetch: session.fetch });
  const root = getThing(container, containerUrl);
  const containerTypes = root ? getUrlAll(root, RDF.type) : [];
  const containerType = containerTypes.find(type => [LDP.Container, LDP.BasicContainer,
    "http://www.w3.org/ns/ldp#DirectContainer", "http://www.w3.org/ns/ldp#IndirectContainer"].includes(type));
  if (!containerType) throw new Error("The series URL is not an RDF description of a Solid container.");
  const contained = new Set(getContainedResourceUrlAll(container));
  if (resourceUrls.some(url => !contained.has(url))) {
    throw new Error("All series members must describe resources contained in the selected Solid container.");
  }
  return containerType;
};

const seriesInput = async (session, input) => {
  const members = await validateSeriesMembers(session, input.seriesMembers || []);
  const parents = [...new Set(members.map(member => new URL("./", member.access_url_dataset).href))];
  const containerUrl = input.container_url || input.access_url_dataset || (parents.length === 1 ? parents[0] : "");
  const containerType = await validateSeriesContainer(session, containerUrl, members.map(member => member.access_url_dataset));
  return { ...input, access_url_dataset: containerUrl, file_format: "text/turtle",
    access_url_semantic_model: containerType, distribution_access_type: "download",
    distributions: [{ downloadURL: containerUrl, mediaType: "text/turtle", conformsTo: [containerType] }] };
};

const writeSeriesDocument = async (session, seriesDocUrl, input) => {
  const normalized = await seriesInput(session, input);
  const previous = await readExistingMetadata(seriesDocUrl, session.fetch);
  let document = previous || createSolidDataset();
  const seriesThing = buildSeriesResource(seriesDocUrl, normalized, getThing(document, input.seriesUrl || `${seriesDocUrl}#it`));
  if (normalized.__publisherThing) document = setThing(document, normalized.__publisherThing);
  if (normalized.__contactThing) document = setThing(document, normalized.__contactThing);
  document = addDistributionDescriptions(document, seriesThing, seriesDocUrl, normalized);
  document = withCatalogRecord(document, seriesDocUrl, seriesThing.url);
  await saveProfileDocument(seriesDocUrl, previous, document, session.fetch);
  await makePublicReadable(seriesDocUrl, session.fetch);
};

export const updateCatalogDatasets = async (
  session,
  catalogDocUrl,
  datasetUrl,
  { remove, recordUrls = [] } = {}
) => {
  const datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
  await mutateCatalogDocument(session, catalogDocUrl, (current, snapshot) => {
    const recordRef = toCatalogDatasetRef(catalogDocUrl, getDocumentUrl(datasetUrl));
    const records = new Set(snapshot.recordRefs);
    if (remove) {
      current.delete(datasetRef);
      records.delete(recordRef);
      recordUrls.forEach(url => records.delete(toCatalogDatasetRef(catalogDocUrl, url)));
    } else {
      current.add(datasetRef);
      records.add(recordRef);
    }
    snapshot.recordRefs = [...records];
    return current;
  });
  await makePublicReadable(catalogDocUrl, session.fetch);
};

const linkDatasetToSeries = async (session, datasetUrl, seriesUrl) => {
  if (!datasetUrl || !seriesUrl) return;
  const datasetDocUrl = getDocumentUrl(datasetUrl);
  let solidDataset;
  try {
    solidDataset = await getSolidDataset(datasetDocUrl, { fetch: session.fetch });
  } catch (err) {
    console.warn("Failed to read dataset for series link", datasetDocUrl, err);
    return;
  }
  const previous = solidDataset;
  let datasetThing = getThing(solidDataset, datasetUrl);
  if (!datasetThing) {
    datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
  }
  if (!datasetThing) return;
  const existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
  if (existing.includes(seriesUrl)) return;
  datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
  solidDataset = setThing(solidDataset, datasetThing);
  await saveProfileDocument(datasetDocUrl, previous, solidDataset, session.fetch);
  await makePublicReadable(datasetDocUrl, session.fetch);
};

const unlinkDatasetFromSeries = async (session, datasetUrl, seriesUrl) => {
  if (!datasetUrl || !seriesUrl) return;
  const datasetDocUrl = getDocumentUrl(datasetUrl);
  let solidDataset;
  try {
    solidDataset = await getSolidDataset(datasetDocUrl, { fetch: session.fetch });
  } catch (err) {
    console.warn("Failed to read dataset for series unlink", datasetDocUrl, err);
    return;
  }
  const previous = solidDataset;
  let datasetThing = getThing(solidDataset, datasetUrl);
  if (!datasetThing) {
    datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
  }
  if (!datasetThing) return;
  const existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
  datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
  existing
    .filter((url) => url !== seriesUrl)
    .forEach((url) => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, url);
    });
  solidDataset = setThing(solidDataset, datasetThing);
  await saveProfileDocument(datasetDocUrl, previous, solidDataset, session.fetch);
};

const generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dataset-${Date.now()}`;
};

export const createDataset = async (session, input) => {
  validateDatasetInput(input);
  const podRoot = input?.podRoot || getPodRoot(session?.info?.webId);
  await ensureCatalogStructure(session, {
    podRoot,
    registryConfig: input?.registryConfig,
  });
  const identifier = input.identifier || generateIdentifier();
  const datasetDocUrl = `${podRoot}${DATASET_CONTAINER}${identifier}.ttl`;
  const datasetUrl = `${datasetDocUrl}#it`;
  await writeDatasetDocument(session, datasetDocUrl, { ...input, identifier });
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), datasetUrl, {
    remove: false,
  });
  clearCache();
  return { datasetUrl, identifier, recordUrl: datasetDocUrl };
};

export const createDatasetSeries = async (session, input) => {
  if (!session?.info?.webId) throw new Error("No Solid WebID available.");
  await ensureCatalogStructure(session);
  const identifier = input.identifier || generateIdentifier();
  const seriesDocUrl = getSeriesDocUrl(session.info.webId, identifier);
  const seriesUrl = getSeriesResourceUrl(seriesDocUrl);
  const seriesMembers = Array.isArray(input.seriesMembers)
    ? input.seriesMembers.filter((memberUrl) => isValidUrl(memberUrl))
    : [];

  await writeSeriesDocument(session, seriesDocUrl, {
    ...input,
    identifier,
    seriesUrl,
    seriesMembers,
  });
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
    remove: false,
  });
  for (const memberUrl of seriesMembers) {
    await linkDatasetToSeries(session, memberUrl, seriesUrl);
  }
  clearCache();
  return { seriesUrl, identifier, recordUrl: seriesDocUrl };
};

export const updateDataset = async (session, input) => {
  if (!input.datasetUrl) throw new Error("Missing dataset URL.");
  validateDatasetInput(input);
  const podRoot = input?.podRoot || getPodRoot(session?.info?.webId);
  const datasetDocUrl = getDocumentUrl(input.datasetUrl);
  await writeDatasetDocument(session, datasetDocUrl, input, {
    allowCreate: false,
  });
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), input.datasetUrl, {
    remove: false,
  });
  clearCache();
};

export const updateDatasetSeries = async (session, input) => {
  const seriesUrl = input.seriesUrl || input.datasetUrl;
  if (!seriesUrl) throw new Error("Missing series URL.");
  const seriesDocUrl = getDocumentUrl(seriesUrl);
  const nextMembers = Array.isArray(input.seriesMembers)
    ? input.seriesMembers.filter((memberUrl) => isValidUrl(memberUrl))
    : [];

  let previousMembers = [];
  try {
    const seriesDoc = await getSolidDataset(seriesDocUrl, { fetch: session.fetch });
    const seriesThing = getThing(seriesDoc, seriesUrl) || getThingAll(seriesDoc)[0];
    if (seriesThing) {
      previousMembers = getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
    }
  } catch (err) {
    console.warn("Failed to read series for update", seriesDocUrl, err);
  }

  await writeSeriesDocument(session, seriesDocUrl, {
    ...input,
    seriesUrl,
    seriesMembers: nextMembers,
  });
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
    remove: false,
  });

  const prevSet = new Set(previousMembers);
  const nextSet = new Set(nextMembers);
  const added = nextMembers.filter((url) => !prevSet.has(url));
  const removed = previousMembers.filter((url) => !nextSet.has(url));

  for (const memberUrl of added) {
    await linkDatasetToSeries(session, memberUrl, seriesUrl);
  }
  for (const memberUrl of removed) {
    await unlinkDatasetFromSeries(session, memberUrl, seriesUrl);
  }

  clearCache();
};

const unlinkFromParentSeries = async (session, datasetUrl, podRoot) => {
  const doc = await readExistingMetadata(getDocumentUrl(datasetUrl), session.fetch);
  if (!doc) return;
  const thing = resolveDatasetThing(doc, datasetUrl);
  for (const seriesUrl of thing ? getUrlAll(thing, DCAT_IN_SERIES) : []) {
    if (!isLocalPodResource(session.info.webId, seriesUrl, podRoot)) {
      throw new Error("A parent series belongs to another Pod; remove its member link before deleting this entry.");
    }
    const seriesDocUrl = getDocumentUrl(seriesUrl);
    const previous = await readExistingMetadata(seriesDocUrl, session.fetch);
    if (!previous) continue;
    let series = getThing(previous, seriesUrl);
    if (!series) continue;
    const members = getUrlAll(series, DCAT_SERIES_MEMBER).filter(url => url !== datasetUrl);
    series = removeAll(series, DCAT_SERIES_MEMBER);
    members.forEach(url => { series = addUrl(series, DCAT_SERIES_MEMBER, url); });
    await saveProfileDocument(seriesDocUrl, previous, setThing(previous, series), session.fetch);
  }
};

export const deleteSeriesEntry = async (session, seriesUrl, identifier) => {
  if (!seriesUrl) return;
  const seriesDocUrl = getDocumentUrl(seriesUrl);
  await unlinkFromParentSeries(session, seriesUrl, getPodRoot(session.info.webId));
  let memberUrls = [];
  try {
    const seriesDoc = await getSolidDataset(seriesDocUrl, { fetch: session.fetch });
    const seriesThing = getThing(seriesDoc, seriesUrl) || getThingAll(seriesDoc)[0];
    if (seriesThing) {
      memberUrls = getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
    }
  } catch (err) {
    console.warn("Failed to read series document", seriesDocUrl, err);
  }

  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
    remove: true,
  });

  for (const memberUrl of memberUrls) {
    await unlinkDatasetFromSeries(session, memberUrl, seriesUrl);
  }

  try {
    await deleteFile(seriesDocUrl, { fetch: session.fetch });
  } catch (err) {
    console.warn("Failed to delete series doc", seriesDocUrl, err);
  }
  clearCache();
};

export const deleteDatasetEntry = async (
  session,
  datasetUrl,
  identifier,
  { podRoot: podRootOverride = "" } = {}
) => {
  if (!datasetUrl) return;
  const podRoot = podRootOverride || getPodRoot(session.info.webId);
  const safeDatasetUrl = assertCatalogDatasetDeletionTarget(
    podRoot,
    datasetUrl,
    identifier
  );
  const datasetDocUrl = getDocumentUrl(safeDatasetUrl);
  try {
    const recordDocUrl = identifier
      ? `${podRoot}${RECORDS_CONTAINER}${identifier}.ttl`
      : "";
    await unlinkFromParentSeries(session, safeDatasetUrl, podRoot);
    await updateCatalogDatasets(
      session,
      getCatalogDocUrl(session.info.webId, podRoot),
      safeDatasetUrl,
      { remove: true, recordUrls: recordDocUrl ? [recordDocUrl, `${recordDocUrl}#desc`] : [] }
    );
    await deleteCatalogDatasetDocuments({
      datasetDocUrl,
      recordDocUrl,
      fetch: session.fetch,
      deleteResource: deleteFile,
    });
  } finally {
    clearCache();
  }
};

export const cleanupCatalogSeriesLinks = async (session) => {
  if (!session?.info?.webId) throw new Error("No Solid WebID available.");
  const catalogDocUrl = getCatalogDocUrl(session.info.webId);
  const catalogUrl = `${catalogDocUrl}#it`;
  const datasetSeriesPredicate =
    DCAT.datasetSeries || "http://www.w3.org/ns/dcat#datasetSeries";

  const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch: session.fetch });
  const catalogThing = getThing(catalogDataset, catalogUrl);
  if (!catalogThing) throw new Error("Catalog thing not found.");

  const datasetRefs = safeGetUrlAll(catalogThing, DCAT.dataset);
  const seriesRefs = safeGetUrlAll(catalogThing, datasetSeriesPredicate);
  const allRefs = Array.from(new Set([...datasetRefs, ...seriesRefs]));
  const resolvedUrls = allRefs
    .map((url) => resolveUrl(url, catalogDocUrl))
    .filter(Boolean);

  const catalogDatasets = new Set(datasetRefs.map((url) => toCatalogDatasetRef(catalogDocUrl, url)));
  const catalogSeries = new Set(seriesRefs.map((url) => toCatalogDatasetRef(catalogDocUrl, url)));
  const finalRefs = new Set([...catalogDatasets, ...catalogSeries]);

  for (const resourceUrl of resolvedUrls) {
    try {
      const docUrl = getDocumentUrl(resourceUrl);
      const doc = await getSolidDataset(docUrl, { fetch: session.fetch });
      const thing = resolveDatasetThing(doc, resourceUrl);
      if (!thing) continue;
      const types = getUrlAll(thing, RDF.type) || [];
      const isSeries =
        types.includes(DCAT_DATASET_SERIES) ||
        types.includes(DCAT.DatasetSeries) ||
        safeGetUrlAll(thing, DCAT_SERIES_MEMBER).length > 0;
      if (isSeries) {
        finalRefs.add(toCatalogDatasetRef(catalogDocUrl, resourceUrl));
        const members = safeGetUrlAll(thing, DCAT_SERIES_MEMBER);
        for (const memberUrl of members) {
          const resolvedMember = resolveUrl(memberUrl, docUrl);
          await linkDatasetToSeries(session, resolvedMember, resourceUrl);
        }
      } else {
        finalRefs.add(toCatalogDatasetRef(catalogDocUrl, resourceUrl));
      }
    } catch (err) {
      console.warn("Cleanup failed for resource", resourceUrl, err);
    }
  }

  await mutateCatalogDocument(session, catalogDocUrl, (current) => {
    finalRefs.forEach((ref) => current.add(ref));
    return current;
  });
  await makePublicReadable(catalogDocUrl, session.fetch);
  clearCache();
};

export const buildCatalogDownload = (datasets) => {
  const lines = [
    "@prefix dcat: <http://www.w3.org/ns/dcat#>.",
    "@prefix dcterms: <http://purl.org/dc/terms/>.",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.",
    "",
    "<#it> a dcat:Catalog ;",
    `  dcterms:title "Aggregated Solid Dataspace Catalog" ;`,
    `  dcterms:modified "${safeNow()}"^^xsd:dateTime ;`,
  ];

  const datasetLines = (datasets || [])
    .filter((dataset) => dataset.datasetUrl)
    .map((dataset) => `    <${dataset.datasetUrl}>`);
  if (datasetLines.length) {
    lines.push("  dcat:dataset");
    lines.push(`${datasetLines.join(" ,\n")} .`);
  } else {
    lines.push("  .");
  }

  return lines.join("\n");
};

const parseTurtleIntoStore = async (store, turtle, baseIRI) =>
  new Promise((resolve, reject) => {
    const parser = new Parser({ baseIRI });
    parser.parse(turtle, (err, quad) => {
      if (err) {
        reject(err);
        return;
      }
      if (quad) {
        store.addQuad(quad);
        return;
      }
      resolve();
    });
  });

const createQuadStore = () => {
  const quads = [];
  return {
    addQuad: (quad) => quads.push(quad),
    getQuads: () => quads,
  };
};

export const buildMergedCatalogDownload = async (
  session,
  { catalogs = [], datasets = [] } = {}
) => {
  const fetch =
    session?.fetch ||
    (typeof window !== "undefined" ? window.fetch.bind(window) : null);
  if (!fetch) throw new Error("No fetch available.");

  const store = createQuadStore();
  const docUrls = new Set();

  (catalogs || []).forEach((catalogUrl) => {
    if (catalogUrl) docUrls.add(getDocumentUrl(catalogUrl));
  });
  (datasets || []).forEach((dataset) => {
    if (dataset?.datasetUrl) docUrls.add(getDocumentUrl(dataset.datasetUrl));
  });

  let visitedDocuments = 0;
  for (const docUrl of docUrls) {
    if (++visitedDocuments > 1000) throw new Error("Catalog metadata export limit reached.");
    try {
      const res = await fetch(docUrl, { headers: { Accept: "text/turtle" } });
      if (!res.ok) {
        console.warn("Failed to fetch catalog/data doc", docUrl, res.status);
        continue;
      }
      const turtle = await res.text();
      await parseTurtleIntoStore(store, turtle, docUrl);
      const quads = new Parser({ baseIRI: docUrl }).parse(turtle);
      const subjects = new Set(quads.map(quad => quad.subject.value));
      const links = [DCAT.record, DCAT.dataset, FOAF.primaryTopic, DCAT.distribution, DCAT_IN_SERIES, DCAT_SERIES_MEMBER];
      for (const quad of quads) {
        if (links.includes(quad.predicate.value) && quad.object.termType === "NamedNode" && !subjects.has(quad.object.value)) {
          docUrls.add(getDocumentUrl(quad.object.value));
        }
      }
    } catch (err) {
      console.warn("Failed to parse catalog/data doc", docUrl, err);
    }
  }

  const writer = new Writer({ prefixes: COMMON_PREFIXES });
  writer.addQuads(store.getQuads(null, null, null, null));
  return new Promise((resolve, reject) => {
    writer.end((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

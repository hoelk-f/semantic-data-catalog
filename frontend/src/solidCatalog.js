import {
  addUrl,
  createContainerAt,
  createSolidDataset,
  createThing,
  getDatetime,
  getSolidDataset,
  getSolidDatasetWithAcl,
  getContainedResourceUrlAll,
  getStringNoLocale,
  getStringWithLocaleAll,
  getThing,
  getThingAll,
  getUrl,
  getUrlAll,
  hasAccessibleAcl,
  hasResourceAcl,
  removeAll,
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
import { DCAT, DCTERMS, FOAF, RDF, VCARD } from "@inrupt/vocab-common-rdf";
import { Parser, Writer, Store } from "n3";

const CATALOG_CONTAINER = "catalog/";
const DATASET_CONTAINER = "catalog/ds/";
const SERIES_CONTAINER = "catalog/series/";
const RECORDS_CONTAINER = "catalog/records/";
const CATALOG_DOC = "catalog/cat.ttl";

const CACHE_KEY = "sdm.catalog.cache.v1";
const CACHE_TTL_MS = 0;
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const DROP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const safeNow = () => new Date().toISOString();
const SDM_NS = "https://w3id.org/solid-dataspace-manager#";
const SDM_REGISTRY_MODE = `${SDM_NS}registryMode`;
const SDM_REGISTRY = `${SDM_NS}registry`;
const SDM_PRIVATE_REGISTRY = `${SDM_NS}privateRegistry`;
export const REGISTRY_PRESETS = [
  {
    id: "stadt-wuppertal",
    label: "Stadt Wuppertal",
    url: "https://tmdt-solid-community-server.de/semanticdatacatalog/public/stadt-wuppertal",
  },
  {
    id: "dace",
    label: "DACE",
    url: "https://tmdt-solid-community-server.de/semanticdatacatalog/public/dace",
  },
  {
    id: "timberconnect",
    label: "TimberConnect",
    url: "https://tmdt-solid-community-server.de/semanticdatacatalog/public/timberconnect",
  },
];
const SDM_CHANGELOG = `${SDM_NS}changeLog`;
const SDM_CHANGE_EVENT = `${SDM_NS}ChangeEvent`;
const LEGACY_DCAT_CONFORMS_TO = "http://www.w3.org/ns/dcat#conformsTo";

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
    if (thing) return thing;
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
  } else {
    lines.push("  .");
  }

  return lines.join("\n");
};

const writeCatalogDoc = async (session, catalogDocUrl, datasetRefs) => {
  let title = "Solid Dataspace Catalog";
  let description = "";
  let contactPoint = "";
  try {
    const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch: session.fetch });
    const catalogThing = getThing(catalogDataset, `${catalogDocUrl}#it`);
    if (catalogThing) {
      title = getAnyString(catalogThing, DCTERMS.title) || title;
      description = getAnyString(catalogThing, DCTERMS.description) || "";
      contactPoint = getUrl(catalogThing, DCAT.contactPoint) || "";
    }
  } catch {
    // Use defaults.
  }

  const turtle = buildCatalogTurtle({
    title,
    description,
    modified: safeNow(),
    datasetRefs,
    contactPoint,
  });

  const res = await session.fetch(catalogDocUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/turtle" },
    body: turtle,
  });
  if (!res.ok) {
    throw new Error(`Failed to write catalog document (${res.status})`);
  }
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

export const buildDefaultPrivateRegistry = (webId) => {
  if (!webId) return "";
  return `${getPodRoot(webId)}registry/`;
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

const getCatalogDocUrl = (webId) => `${getPodRoot(webId)}${CATALOG_DOC}`;
const getCatalogResourceUrl = (webId) => `${getCatalogDocUrl(webId)}#it`;
const getSeriesDocUrl = (webId, identifier) =>
  `${getPodRoot(webId)}${SERIES_CONTAINER}${identifier}.ttl`;
const getSeriesResourceUrl = (seriesDocUrl) => `${seriesDocUrl}#it`;

const validateDatasetInput = (input) => {
  if (!input?.access_url_dataset) {
    throw new Error("Dataset file URL is required (dcat:downloadURL).");
  }
  if (!input?.file_format) {
    throw new Error("Dataset media type is required (dcat:mediaType).");
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

const getResourceAndAcl = async (url, fetch) => {
  const resource = await getSolidDatasetWithAcl(url, { fetch });
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

const makePublicReadable = async (url, fetch) => {
  try {
    const { resource, resourceAcl } = await getResourceAndAcl(url, fetch);
    const updatedAcl = setPublicResourceAccess(resourceAcl, {
      read: true,
      append: false,
      write: false,
      control: false,
    });
    await saveAclFor(resource, updatedAcl, { fetch });
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
  profileThing = removeAll(profileThing, DCAT.catalog);
  profileThing = setUrl(profileThing, DCAT.catalog, catalogUrl);
  const updatedProfile = setThing(profileDataset, profileThing);
  await saveSolidDatasetAt(profileDocUrl, updatedProfile, { fetch });
};

export const loadRegistryConfig = async (webId, fetch) => {
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
      getUrl(profileThing, SDM_PRIVATE_REGISTRY) || buildDefaultPrivateRegistry(webId);
    return {
      mode: mode === "private" ? "private" : "research",
      registries,
      privateRegistry,
    };
  } catch (err) {
    console.warn("Failed to load registry config from profile:", err);
    return {
      mode: "research",
      registries: [],
      privateRegistry: buildDefaultPrivateRegistry(webId),
    };
  }
};

export const saveRegistryConfig = async (webId, fetch, config) => {
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
  const privateRegistry = config?.privateRegistry || buildDefaultPrivateRegistry(webId);

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

const resolveRegistryConfig = async (webId, fetch, override) => {
  const base = override || (await loadRegistryConfig(webId, fetch));
  const mode = base?.mode === "private" ? "private" : "research";
  const registries = (base?.registries || []).filter(Boolean);
  const privateRegistry =
    base?.privateRegistry || buildDefaultPrivateRegistry(webId);
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

const registerWebIdInRegistries = async (webId, fetch, registryConfig) => {
  if (!webId) return;
  const config = await resolveRegistryConfig(webId, fetch, registryConfig);
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

export const loadRegistryMembersFromContainer = async (containerUrl, fetch) => {
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
      } catch {
        // Ignore malformed entries.
      }
    }
    return Array.from(members);
  } catch (err) {
    const status = err?.statusCode || err?.response?.status;
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
  { title, description, registryConfig } = {}
) => {
  if (!session?.info?.webId) {
    throw new Error("No Solid WebID available.");
  }
  const webId = session.info.webId;
  const podRoot = getPodRoot(webId);
  const fetch = session.fetch;

  await ensureContainer(`${podRoot}${CATALOG_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${DATASET_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${SERIES_CONTAINER}`, fetch);
  await ensureContainer(`${podRoot}${RECORDS_CONTAINER}`, fetch);

  // Legacy local registry.ttl is no longer used.

  const catalogDocUrl = getCatalogDocUrl(webId);
  const catalogResourceUrl = getCatalogResourceUrl(webId);

  let catalogDataset;
  try {
    catalogDataset = await getSolidDataset(catalogDocUrl, { fetch });
  } catch (err) {
    if (err?.statusCode === 404 || err?.response?.status === 404) {
      catalogDataset = createSolidDataset();
    } else {
      throw err;
    }
  }

  let catalogThing = getThing(catalogDataset, catalogResourceUrl);
  if (!catalogThing) {
    catalogThing = createThing({ url: catalogResourceUrl });
  }
  catalogThing = removeAll(catalogThing, RDF.type);
  catalogThing = addUrl(catalogThing, RDF.type, DCAT.Catalog);
  catalogThing = removeAll(catalogThing, DCAT.contactPoint);
  catalogThing = setUrl(catalogThing, DCAT.contactPoint, webId);
  catalogThing = removeAll(catalogThing, DCTERMS.title);
  catalogThing = setLocaleString(
    catalogThing,
    DCTERMS.title,
    title || "Solid Dataspace Catalog"
  );
  catalogThing = removeAll(catalogThing, DCTERMS.description);
  if (description) {
    catalogThing = setLocaleString(catalogThing, DCTERMS.description, description);
  }
  catalogThing = removeAll(catalogThing, DCTERMS.modified);
  catalogThing = setDatetime(catalogThing, DCTERMS.modified, new Date());

  catalogDataset = setThing(catalogDataset, catalogThing);
  await saveSolidDatasetAt(catalogDocUrl, catalogDataset, { fetch });

  await makePublicReadable(catalogDocUrl, fetch);
  await makePublicReadable(`${podRoot}${CATALOG_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${DATASET_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${SERIES_CONTAINER}`, fetch);
  await makePublicReadable(`${podRoot}${RECORDS_CONTAINER}`, fetch);

  await setCatalogLinkInProfile(webId, catalogResourceUrl, fetch);
  await registerWebIdInRegistries(webId, fetch, registryConfig);

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
    const profileCatalog = profileThing ? getUrl(profileThing, DCAT.catalog) : null;
    if (profileCatalog) return profileCatalog;
  } catch (err) {
    console.warn("Failed to resolve catalog URL from profile:", err);
  }

  return getCatalogResourceUrl(webId);
};

const loadRegistryMembers = async (webId, fetch) => {
  const members = new Set();
  if (webId) members.add(webId);

  const config = await loadRegistryConfig(webId, fetch);
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
        } catch {
          // Ignore malformed registry entries.
        }
      }
    } catch (err) {
      console.warn("Failed to load registry container:", containerUrl, err);
    }
  }

  return Array.from(members);
};

const parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
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
  let publisher = publisherLiteral;
  if (!publisher) {
    const publisherRef = getUrl(datasetThing, DCTERMS.publisher) || "";
    if (publisherRef) {
      const publisherThing = getThing(datasetDoc, publisherRef);
      if (publisherThing) {
        publisher =
          getAnyString(publisherThing, FOAF.name) ||
          getAnyString(publisherThing, VCARD.fn) ||
          getAnyString(publisherThing, DCTERMS.title) ||
          "";
      }
    }
  }
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
      } else {
        contact = getAnyString(contactThing, VCARD.fn) || "";
      }
    }
  }

  const conformsTo =
    getUrl(datasetThing, DCTERMS.conformsTo) ||
    getUrl(datasetThing, LEGACY_DCAT_CONFORMS_TO) ||
    "";
  const distributions = safeGetUrlAll(datasetThing, DCAT.distribution);
  let accessUrlDataset = "";
  let accessUrlModel = "";
  let fileFormat = "";

  distributions.forEach((distUrl) => {
    const resolvedDistUrl = resolveUrl(distUrl, baseIri);
    const distThing = getThing(datasetDoc, resolvedDistUrl) || getThing(datasetDoc, distUrl);
    if (!distThing) return;
    const downloadUrl = resolveUrl(
      getUrl(distThing, DCAT.downloadURL) ||
        getUrl(distThing, DCAT.accessURL) ||
        "",
      baseIri
    );
    const mediaType =
      getStringNoLocale(distThing, DCAT.mediaType) ||
      getStringNoLocale(distThing, DCTERMS.format) ||
      getAnyString(distThing, DCTERMS.format) ||
      "";
    if (!accessUrlDataset) {
      accessUrlDataset = downloadUrl;
      fileFormat = mediaType;
    }
  });

  if (conformsTo) {
    accessUrlModel = conformsTo;
  }

  const isPublic = (accessRights || "").toLowerCase() === "public";
  const seriesMembers = isSeries ? seriesMembersRaw : [];
  const inSeries = !isSeries ? safeGetUrlAll(datasetThing, DCAT_IN_SERIES) : [];

  return {
    identifier,
    title,
    description,
    issued: issued ? issued.toISOString() : "",
    modified: modified ? modified.toISOString() : "",
    publisher,
    contact_point: contact,
    access_url_dataset: accessUrlDataset,
    access_url_semantic_model: accessUrlModel,
    file_format: fileFormat,
    theme,
    is_public: isPublic,
    webid: creator,
    datasetUrl,
    datasetType: isSeries ? "series" : "dataset",
    seriesMembers,
    inSeries,
  };
};

const loadCatalogDatasets = async (catalogUrl, fetch) => {
  const catalogDocUrl = getDocumentUrl(catalogUrl);
  const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch });
  const catalogThing = getThing(catalogDataset, catalogUrl);
  const datasetUrls = catalogThing ? safeGetUrlAll(catalogThing, DCAT.dataset) : [];
  const resolvedUrls = Array.from(new Set(datasetUrls))
    .map((url) => resolveUrl(url, catalogDocUrl))
    .filter(Boolean);

  const datasets = await Promise.all(
    resolvedUrls.map(async (datasetUrl) => {
      try {
        const datasetDoc = await getSolidDataset(getDocumentUrl(datasetUrl), {
          fetch,
        });
        return parseDatasetFromDoc(datasetDoc, datasetUrl);
      } catch (err) {
        console.warn("Failed to load dataset", datasetUrl, err);
        return null;
      }
    })
  );

  return datasets.filter(Boolean);
};

const mergeDatasets = (lists) => {
  const map = new Map();
  lists.flat().forEach((dataset) => {
    if (!dataset) return;
    const key = dataset.identifier || dataset.datasetUrl;
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

export const loadAggregatedDatasets = async (session, fetchOverride) => {
  const webId = session?.info?.webId || "";
  const fetch =
    fetchOverride ||
    session?.fetch ||
    (typeof window !== "undefined" ? window.fetch.bind(window) : fetchOverride);
  if (!fetch) return { datasets: [], catalogs: [] };

  const registryMembers = await loadRegistryMembers(webId, fetch);
  const catalogUrls = await Promise.all(
    registryMembers.map((member) => resolveCatalogUrlFromWebId(member, fetch))
  );
  const uniqueCatalogUrls = Array.from(new Set(catalogUrls.filter(Boolean)));

  const cache = loadCache();
  const now = Date.now();
  const useCacheOnly = now - cache.updatedAt < CACHE_TTL_MS;
  const results = [];
  const updatedCache = { ...cache, catalogs: { ...cache.catalogs } };

  const fetchCatalog = async (catalogUrl) => {
    try {
      const datasets = await loadCatalogDatasets(catalogUrl, fetch);
      updatedCache.catalogs[catalogUrl] = {
        datasets,
        lastSuccess: now,
      };
      return { datasets, lastSuccess: now, failed: false };
    } catch (err) {
      console.warn("Catalog load failed", catalogUrl, err);
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

const buildDatasetResource = (datasetDocUrl, input) => {
  const datasetUrl = `${datasetDocUrl}#it`;
  let datasetThing = createThing({ url: datasetUrl });
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
  datasetThing = setLocaleString(datasetThing, DCTERMS.publisher, input.publisher || "");
  datasetThing = removeAll(datasetThing, DCTERMS.creator);
  if (input.webid) {
    datasetThing = setUrl(datasetThing, DCTERMS.creator, input.webid);
  }
  datasetThing = removeAll(datasetThing, DCAT.theme);
  if (input.theme) {
    datasetThing = setUrl(datasetThing, DCAT.theme, toThemeIri(input.theme));
  }
  datasetThing = removeAll(datasetThing, DCTERMS.conformsTo);
  datasetThing = removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  if (input.access_url_semantic_model) {
    datasetThing = setUrl(datasetThing, DCTERMS.conformsTo, input.access_url_semantic_model);
  }
  datasetThing = removeAll(datasetThing, DCTERMS.accessRights);
  datasetThing = setStringNoLocale(
    datasetThing,
    DCTERMS.accessRights,
    input.is_public ? "public" : "restricted"
  );
  datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
  if (input.in_series) {
    const seriesList = Array.isArray(input.in_series) ? input.in_series : [input.in_series];
    seriesList.filter(Boolean).forEach((seriesUrl) => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }

  return datasetThing;
};

const buildSeriesResource = (seriesDocUrl, input) => {
  const seriesUrl = input.seriesUrl || `${seriesDocUrl}#it`;
  let seriesThing = createThing({ url: seriesUrl });
  seriesThing = addUrl(seriesThing, RDF.type, DCAT_DATASET_SERIES);
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
  if (input.publisher) {
    seriesThing = setLocaleString(seriesThing, DCTERMS.publisher, input.publisher);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.creator);
  if (input.webid) {
    seriesThing = setUrl(seriesThing, DCTERMS.creator, input.webid);
  }
  seriesThing = removeAll(seriesThing, DCAT.contactPoint);
  if (input.contact_point) {
    const contactUrl = `${seriesDocUrl}#contact`;
    let contactThing = createThing({ url: contactUrl });
    contactThing = setLocaleString(contactThing, VCARD.fn, input.publisher || "");
    contactThing = removeAll(contactThing, VCARD.hasEmail);
    contactThing = setUrl(contactThing, VCARD.hasEmail, `mailto:${input.contact_point}`);
    input.__contactThing = contactThing;
    seriesThing = setUrl(seriesThing, DCAT.contactPoint, contactUrl);
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

const buildContactThing = (datasetDocUrl, input) => {
  if (!input.contact_point) return null;
  const contactUrl = `${datasetDocUrl}#contact`;
  let contactThing = createThing({ url: contactUrl });
  contactThing = setLocaleString(contactThing, VCARD.fn, input.publisher || "");
  contactThing = removeAll(contactThing, VCARD.hasEmail);
  contactThing = setUrl(contactThing, VCARD.hasEmail, `mailto:${input.contact_point}`);
  return contactThing;
};

const buildDistributionThing = (datasetDocUrl, slug, downloadUrl, mediaType) => {
  if (!downloadUrl) return null;
  const distUrl = `${datasetDocUrl}#${slug}`;
  let distThing = createThing({ url: distUrl });
  distThing = addUrl(distThing, RDF.type, DCAT.Distribution);
  distThing = removeAll(distThing, DCAT.downloadURL);
  distThing = setUrl(distThing, DCAT.downloadURL, downloadUrl);
  distThing = removeAll(distThing, DCAT.mediaType);
  if (mediaType) {
    distThing = setStringNoLocale(distThing, DCAT.mediaType, mediaType);
  }
  return distThing;
};

const writeDatasetDocument = async (session, datasetDocUrl, input) => {
  let solidDataset;
  try {
    solidDataset = await getSolidDataset(datasetDocUrl, { fetch: session.fetch });
  } catch (err) {
    if (isNotFound(err)) {
      solidDataset = createSolidDataset();
    } else {
      throw err;
    }
  }

  let datasetThing = buildDatasetResource(datasetDocUrl, input);

  const contactThing = buildContactThing(datasetDocUrl, input);
  if (contactThing) {
    solidDataset = setThing(solidDataset, contactThing);
    datasetThing = setUrl(datasetThing, DCAT.contactPoint, contactThing.url);
  }

  const distDataset = buildDistributionThing(
    datasetDocUrl,
    "dist",
    input.access_url_dataset,
    input.file_format
  );
  if (distDataset) {
    solidDataset = setThing(solidDataset, distDataset);
    datasetThing = addUrl(datasetThing, DCAT.distribution, distDataset.url);
  }

  solidDataset = setThing(solidDataset, datasetThing);
  await saveSolidDatasetAt(datasetDocUrl, solidDataset, { fetch: session.fetch });
  const head = await session.fetch(datasetDocUrl, { method: "HEAD" });
  if (!head.ok) {
    throw new Error(`Dataset write failed (${head.status})`);
  }
  await makePublicReadable(datasetDocUrl, session.fetch);
};

const writeSeriesDocument = async (session, seriesDocUrl, input) => {
  let solidDataset;
  try {
    solidDataset = await getSolidDataset(seriesDocUrl, { fetch: session.fetch });
  } catch (err) {
    if (isNotFound(err)) {
      solidDataset = createSolidDataset();
    } else {
      throw err;
    }
  }

  const seriesThing = buildSeriesResource(seriesDocUrl, input);
  if (input.__contactThing) {
    solidDataset = setThing(solidDataset, input.__contactThing);
  }
  solidDataset = setThing(solidDataset, seriesThing);
  await saveSolidDatasetAt(seriesDocUrl, solidDataset, { fetch: session.fetch });
  const head = await session.fetch(seriesDocUrl, { method: "HEAD" });
  if (!head.ok) {
    throw new Error(`Series write failed (${head.status})`);
  }
  // Skip ACL update here to avoid noisy 404s on servers without WAC ACL support.
};

const updateCatalogDatasets = async (session, catalogDocUrl, datasetUrl, { remove } = {}) => {
  let current = new Set();
  try {
    const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch: session.fetch });
    const catalogThing = getThing(catalogDataset, `${catalogDocUrl}#it`);
    const existing = catalogThing ? getUrlAll(catalogThing, DCAT.dataset) : [];
    current = new Set(existing.map((url) => toCatalogDatasetRef(catalogDocUrl, url)));
  } catch {
    current = new Set();
  }

  const datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
  if (remove) {
    current.delete(datasetRef);
  } else {
    current.add(datasetRef);
  }

  await writeCatalogDoc(session, catalogDocUrl, Array.from(current));
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
  let datasetThing = getThing(solidDataset, datasetUrl);
  if (!datasetThing) {
    datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
  }
  if (!datasetThing) return;
  const existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
  if (existing.includes(seriesUrl)) return;
  datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
  solidDataset = setThing(solidDataset, datasetThing);
  await saveSolidDatasetAt(datasetDocUrl, solidDataset, { fetch: session.fetch });
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
  await saveSolidDatasetAt(datasetDocUrl, solidDataset, { fetch: session.fetch });
};

const writeRecordDocument = async (session, datasetDocUrl, identifier) => {
  const recordDocUrl = `${getPodRoot(session.info.webId)}${RECORDS_CONTAINER}${identifier}.ttl`;
  let recordDataset;
  try {
    recordDataset = await getSolidDataset(recordDocUrl, { fetch: session.fetch });
  } catch (err) {
    if (err?.statusCode === 404 || err?.response?.status === 404) {
      recordDataset = createSolidDataset();
    } else {
      throw err;
    }
  }

  const descUrl = `${recordDocUrl}#desc`;
  const existingDesc = getThing(recordDataset, descUrl);
  const existingChanges = existingDesc ? getUrlAll(existingDesc, SDM_CHANGELOG) : [];
  let descThing = createThing({ url: descUrl });
  descThing = addUrl(descThing, RDF.type, DCAT.CatalogRecord);
  descThing = setStringNoLocale(descThing, DCTERMS.title, "Dataset description record");
  descThing = setStringNoLocale(descThing, DCTERMS.description, "Catalog record for dataset metadata.");
  descThing = setUrl(descThing, FOAF.primaryTopic, datasetDocUrl);
  descThing = setDatetime(descThing, DCTERMS.modified, new Date());

  const changeUrl = `${recordDocUrl}#change-${Date.now()}`;
  let changeThing = createThing({ url: changeUrl });
  changeThing = addUrl(changeThing, RDF.type, SDM_CHANGE_EVENT);
  changeThing = setDatetime(changeThing, DCTERMS.modified, new Date());
  changeThing = setStringNoLocale(changeThing, DCTERMS.description, "Dataset metadata updated.");
  recordDataset = setThing(recordDataset, changeThing);

  existingChanges.forEach((url) => {
    descThing = addUrl(descThing, SDM_CHANGELOG, url);
  });
  descThing = addUrl(descThing, SDM_CHANGELOG, changeUrl);
  recordDataset = setThing(recordDataset, descThing);

  const aclUrl = `${datasetDocUrl}.acl`;
  const wacUrl = `${recordDocUrl}#wac`;
  let wacThing = createThing({ url: wacUrl });
  wacThing = addUrl(wacThing, RDF.type, DCAT.CatalogRecord);
  wacThing = setStringNoLocale(wacThing, DCTERMS.title, "Dataset ACL record");
  wacThing = setStringNoLocale(
    wacThing,
    DCTERMS.description,
    "Catalog record for the dataset access control."
  );
  wacThing = setUrl(wacThing, FOAF.primaryTopic, aclUrl);
  wacThing = setDatetime(wacThing, DCTERMS.modified, new Date());
  recordDataset = setThing(recordDataset, wacThing);

  await saveSolidDatasetAt(recordDocUrl, recordDataset, { fetch: session.fetch });
  await makePublicReadable(recordDocUrl, session.fetch);
};

const generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dataset-${Date.now()}`;
};

export const createDataset = async (session, input) => {
  await ensureCatalogStructure(session);
  validateDatasetInput(input);
  const identifier = input.identifier || generateIdentifier();
  const datasetDocUrl = `${getPodRoot(session.info.webId)}${DATASET_CONTAINER}${identifier}.ttl`;
  const datasetUrl = `${datasetDocUrl}#it`;
  await writeDatasetDocument(session, datasetDocUrl, { ...input, identifier });
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), datasetUrl, {
    remove: false,
  });
  await writeRecordDocument(session, datasetDocUrl, identifier);
  clearCache();
  return { datasetUrl, identifier };
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
  return { seriesUrl, identifier };
};

export const updateDataset = async (session, input) => {
  if (!input.datasetUrl) throw new Error("Missing dataset URL.");
  validateDatasetInput(input);
  const datasetDocUrl = getDocumentUrl(input.datasetUrl);
  await writeDatasetDocument(session, datasetDocUrl, input);
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), input.datasetUrl, {
    remove: false,
  });
  if (input.identifier) {
    await writeRecordDocument(session, datasetDocUrl, input.identifier);
  }
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

export const deleteSeriesEntry = async (session, seriesUrl, identifier) => {
  if (!seriesUrl) return;
  const seriesDocUrl = getDocumentUrl(seriesUrl);
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


export const deleteDatasetEntry = async (session, datasetUrl, identifier) => {
  if (!datasetUrl) return;
  const datasetDocUrl = getDocumentUrl(datasetUrl);
  await updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), datasetUrl, {
    remove: true,
  });
  try {
    await deleteFile(datasetDocUrl, { fetch: session.fetch });
  } catch (err) {
    console.warn("Failed to delete dataset doc", datasetDocUrl, err);
  }
  if (identifier) {
    const recordDocUrl = `${getPodRoot(session.info.webId)}${RECORDS_CONTAINER}${identifier}.ttl`;
    try {
      await deleteFile(recordDocUrl, { fetch: session.fetch });
    } catch (err) {
      console.warn("Failed to delete record doc", recordDocUrl, err);
    }
  }
  clearCache();
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

  await writeCatalogDoc(session, catalogDocUrl, Array.from(finalRefs));
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

export const buildMergedCatalogDownload = async (
  session,
  { catalogs = [], datasets = [] } = {}
) => {
  const fetch =
    session?.fetch ||
    (typeof window !== "undefined" ? window.fetch.bind(window) : null);
  if (!fetch) throw new Error("No fetch available.");

  const store = new Store();
  const docUrls = new Set();

  (catalogs || []).forEach((catalogUrl) => {
    if (catalogUrl) docUrls.add(getDocumentUrl(catalogUrl));
  });
  (datasets || []).forEach((dataset) => {
    if (dataset?.datasetUrl) docUrls.add(getDocumentUrl(dataset.datasetUrl));
  });

  for (const docUrl of docUrls) {
    try {
      const res = await fetch(docUrl, { headers: { Accept: "text/turtle" } });
      if (!res.ok) {
        console.warn("Failed to fetch catalog/data doc", docUrl, res.status);
        continue;
      }
      const turtle = await res.text();
      await parseTurtleIntoStore(store, turtle, docUrl);
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

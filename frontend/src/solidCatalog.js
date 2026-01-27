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

const CATALOG_CONTAINER = "catalog/";
const DATASET_CONTAINER = "catalog/ds/";
const SERIES_CONTAINER = "catalog/series/";
const RECORDS_CONTAINER = "catalog/records/";
const CATALOG_DOC = "catalog/cat.ttl";
const CENTRAL_REGISTRY_CONTAINER =
  "https://tmdt-solid-community-server.de/semanticdatacatalog/public/registry/";

const CACHE_KEY = "sdm.catalog.cache.v1";
const CACHE_TTL_MS = 0;
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const DROP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const safeNow = () => new Date().toISOString();
const SDM_NS = "https://w3id.org/solid-dataspace-manager#";
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

const buildCatalogTurtle = ({ title, description, modified, datasetRefs, contactPoint }) => {
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

const getDocumentUrl = (resourceUrl) => resourceUrl.split("#")[0];

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

const setLocaleString = (thing, predicate, value) => {
  if (!value) return thing;
  return setStringNoLocale(thing, predicate, value);
};

const getCatalogDocUrl = (webId) => `${getPodRoot(webId)}${CATALOG_DOC}`;
const getCatalogResourceUrl = (webId) => `${getCatalogDocUrl(webId)}#it`;

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


export const ensureCatalogStructure = async (session, { title, description } = {}) => {
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

export const resetCatalog = async (session) => {
  if (!session?.info?.webId) {
    throw new Error("No Solid WebID available.");
  }
  await ensureCatalogStructure(session);
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
  return getCatalogResourceUrl(webId);
};

const loadRegistryMembers = async (webId, fetch) => {
  try {
    const containerDataset = await getSolidDataset(CENTRAL_REGISTRY_CONTAINER, { fetch });
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
        // Ignore malformed registry entries.
      }
    }
    if (webId) members.add(webId);
    return Array.from(members);
  } catch (err) {
    console.warn("Failed to load central registry container:", err);
    return webId ? [webId] : [];
  }
};

const parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  const datasetThing = resolveDatasetThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;

  const baseIri =
    datasetDoc?.internal_resourceInfo?.sourceIri || getDocumentUrl(datasetUrl);

  const identifier = getStringNoLocale(datasetThing, DCTERMS.identifier) || datasetUrl;
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
  const distributions = getUrlAll(datasetThing, DCAT.distribution);
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
  };
};

const loadCatalogDatasets = async (catalogUrl, fetch) => {
  const catalogDocUrl = getDocumentUrl(catalogUrl);
  const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch });
  const catalogThing = getThing(catalogDataset, catalogUrl);
  const datasetUrls = catalogThing ? getUrlAll(catalogThing, DCAT.dataset) : [];
  const resolvedUrls = datasetUrls
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

const toThemeIri = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return `${DEFAULT_THEME_NS}${encodeURIComponent(slug)}`;
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
  datasetThing = setDatetime(datasetThing, DCTERMS.modified, new Date(input.modified || safeNow()));
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

  return datasetThing;
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
    if (err?.statusCode === 404 || err?.response?.status === 404) {
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

const updateCatalogDatasets = async (session, catalogDocUrl, datasetUrl, { remove }) => {
  let current = new Set();
  try {
    const catalogDataset = await getSolidDataset(catalogDocUrl, { fetch: session.fetch });
    const catalogThing = getThing(catalogDataset, `${catalogDocUrl}#it`);
    const existing = catalogThing ? getUrlAll(catalogThing, DCAT.dataset) : [];
    current = new Set(
      existing.map((url) => toCatalogDatasetRef(catalogDocUrl, url))
    );
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

  const datasetLines = datasets
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

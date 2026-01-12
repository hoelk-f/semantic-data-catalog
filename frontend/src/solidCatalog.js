import {
  addUrl,
  createContainerAt,
  createSolidDataset,
  createThing,
  getDatetime,
  getSolidDataset,
  getSolidDatasetWithAcl,
  getStringNoLocale,
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
const REGISTRY_DOC = "catalog/registry.ttl";
const CATALOG_DOC = "catalog/cat.ttl";
const CENTRAL_REGISTRY_URL =
  "https://tmdt-solid-community-server.de/semanticdatacatalog/public/registry.ttl";

const CACHE_KEY = "sdm.catalog.cache.v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const DROP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const safeNow = () => new Date().toISOString();
const SDM_NS = "https://w3id.org/solid-dataspace-manager#";
const SDM_CHANGELOG = `${SDM_NS}changeLog`;
const SDM_CHANGE_EVENT = `${SDM_NS}ChangeEvent`;
const SOLID = {
  publicTypeIndex: "http://www.w3.org/ns/solid/terms#publicTypeIndex",
  TypeIndex: "http://www.w3.org/ns/solid/terms#TypeIndex",
  TypeRegistration: "http://www.w3.org/ns/solid/terms#TypeRegistration",
  forClass: "http://www.w3.org/ns/solid/terms#forClass",
  instance: "http://www.w3.org/ns/solid/terms#instance",
};

const resolveUrl = (value, base) => {
  if (!value) return "";
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
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

const getCatalogDocUrl = (webId) => `${getPodRoot(webId)}${CATALOG_DOC}`;
const getCatalogResourceUrl = (webId) => `${getCatalogDocUrl(webId)}#it`;
const getRegistryDocUrl = (webId) => `${getPodRoot(webId)}${REGISTRY_DOC}`;

const loadCache = () => {
  if (typeof window === "undefined") return { updatedAt: 0, catalogs: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
    return {
      updatedAt: parsed.updatedAt || 0,
      catalogs: parsed.catalogs || {},
    };
  } catch {
    return { updatedAt: 0, catalogs: {} };
  }
};

const saveCache = (cache) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

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

const ensurePublicTypeIndex = async (webId, fetch) => {
  const profileDocUrl = getDocumentUrl(webId);
  const profileDs = await getSolidDataset(profileDocUrl, { fetch });
  let profileThing = getThing(profileDs, webId);
  if (!profileThing) {
    profileThing = createThing({ url: webId });
  }

  let publicTypeIndexUrl = getUrl(profileThing, SOLID.publicTypeIndex);
  if (!publicTypeIndexUrl) {
    const podRoot = getPodRoot(webId);
    const settingsContainer = `${podRoot}settings/`;
    await ensureContainer(settingsContainer, fetch);
    publicTypeIndexUrl = `${settingsContainer}publicTypeIndex.ttl`;
    const ptiDataset = createSolidDataset();
    let ptiThing = createThing({ url: `${publicTypeIndexUrl}#it` });
    ptiThing = addUrl(ptiThing, RDF.type, SOLID.TypeIndex);
    ptiThing = setStringNoLocale(ptiThing, DCTERMS.title, "Public Type Index");
    const withPti = setThing(ptiDataset, ptiThing);
    await saveSolidDatasetAt(publicTypeIndexUrl, withPti, { fetch });
    await makePublicReadable(publicTypeIndexUrl, fetch);

    profileThing = setUrl(profileThing, SOLID.publicTypeIndex, publicTypeIndexUrl);
    const updatedProfile = setThing(profileDs, profileThing);
    await saveSolidDatasetAt(profileDocUrl, updatedProfile, { fetch });
  }

  return publicTypeIndexUrl;
};

const registerCatalogInTypeIndex = async (publicTypeIndexUrl, catalogUrl, fetch) => {
  const ptiDataset = await getSolidDataset(publicTypeIndexUrl, { fetch });
  const existing = getThingAll(ptiDataset).find((thing) => {
    const types = getUrlAll(thing, RDF.type);
    if (!types.includes(SOLID.TypeRegistration)) return false;
    const forClass = getUrl(thing, SOLID.forClass);
    return forClass === DCAT.Catalog;
  });

  let registration = existing || createThing({ url: `${publicTypeIndexUrl}#catalog` });
  registration = removeAll(registration, RDF.type);
  registration = addUrl(registration, RDF.type, SOLID.TypeRegistration);
  registration = removeAll(registration, SOLID.forClass);
  registration = setUrl(registration, SOLID.forClass, DCAT.Catalog);
  registration = removeAll(registration, SOLID.instance);
  registration = setUrl(registration, SOLID.instance, catalogUrl);

  const updated = setThing(ptiDataset, registration);
  await saveSolidDatasetAt(publicTypeIndexUrl, updated, { fetch });
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
  catalogThing = removeAll(catalogThing, DCTERMS.title);
  catalogThing = setStringNoLocale(
    catalogThing,
    DCTERMS.title,
    title || "Solid Dataspace Catalog"
  );
  catalogThing = removeAll(catalogThing, DCTERMS.description);
  if (description) {
    catalogThing = setStringNoLocale(catalogThing, DCTERMS.description, description);
  }
  catalogThing = removeAll(catalogThing, DCTERMS.modified);
  catalogThing = setDatetime(catalogThing, DCTERMS.modified, new Date());

  catalogDataset = setThing(catalogDataset, catalogThing);
  await saveSolidDatasetAt(catalogDocUrl, catalogDataset, { fetch });

  const registryDocUrl = getRegistryDocUrl(webId);
  let registryDataset;
  try {
    registryDataset = await getSolidDataset(registryDocUrl, { fetch });
  } catch (err) {
    if (err?.statusCode === 404 || err?.response?.status === 404) {
      registryDataset = createSolidDataset();
    } else {
      throw err;
    }
  }

  const registryUrl = `${registryDocUrl}#it`;
  let registryThing = getThing(registryDataset, registryUrl);
  if (!registryThing) {
    registryThing = createThing({ url: registryUrl });
  }
  registryThing = removeAll(registryThing, RDF.type);
  registryThing = addUrl(registryThing, RDF.type, FOAF.Group);
  registryThing = removeAll(registryThing, DCTERMS.title);
  registryThing = setStringNoLocale(
    registryThing,
    DCTERMS.title,
    "Dataspace Catalog Registry"
  );
  registryThing = removeAll(registryThing, FOAF.member);
  registryThing = addUrl(registryThing, FOAF.member, webId);
  registryThing = removeAll(registryThing, DCTERMS.modified);
  registryThing = setDatetime(registryThing, DCTERMS.modified, new Date());

  registryDataset = setThing(registryDataset, registryThing);
  await saveSolidDatasetAt(registryDocUrl, registryDataset, { fetch });

  await makePublicReadable(catalogDocUrl, fetch);
  await makePublicReadable(registryDocUrl, fetch);
  await makePublicReadable(`${podRoot}${CATALOG_CONTAINER}`, fetch);

  const publicTypeIndexUrl = await ensurePublicTypeIndex(webId, fetch);
  await registerCatalogInTypeIndex(publicTypeIndexUrl, catalogResourceUrl, fetch);

  return {
    catalogDocUrl,
    catalogUrl: catalogResourceUrl,
    registryDocUrl,
    publicTypeIndexUrl,
  };
};

export const resolveCatalogUrlFromWebId = async (webId, fetch) => {
  try {
    const profileDocUrl = getDocumentUrl(webId);
    const profileDoc = await getSolidDataset(profileDocUrl, { fetch });
    const profileThing = getThing(profileDoc, webId);
    const publicTypeIndexUrl = profileThing
      ? getUrl(profileThing, SOLID.publicTypeIndex)
      : null;
    if (publicTypeIndexUrl) {
      const ptiDataset = await getSolidDataset(publicTypeIndexUrl, { fetch });
      const registration = getThingAll(ptiDataset).find((thing) => {
        const types = getUrlAll(thing, RDF.type);
        const forClass = getUrl(thing, SOLID.forClass);
        return types.includes(SOLID.TypeRegistration) && forClass === DCAT.Catalog;
      });
      const instance = registration ? getUrl(registration, SOLID.instance) : null;
      if (instance) return instance;
    }
  } catch (err) {
    console.warn("Failed to resolve public type index for", webId, err);
  }

  return getCatalogResourceUrl(webId);
};

const loadRegistryMembers = async (webId, fetch) => {
  if (!webId) return [];
  try {
    const registryDataset = await getSolidDataset(CENTRAL_REGISTRY_URL, { fetch });
    const registryThing = getThing(registryDataset, `${CENTRAL_REGISTRY_URL}#it`);
    const members = registryThing ? getUrlAll(registryThing, FOAF.member) : [];
    const unique = new Set([webId, ...members]);
    return Array.from(unique);
  } catch (err) {
    console.warn("Failed to load central registry:", err);
    return [webId];
  }
};

const parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  const datasetThing = getThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;

  const identifier = getStringNoLocale(datasetThing, DCTERMS.identifier) || datasetUrl;
  const title = getStringNoLocale(datasetThing, DCTERMS.title) || "Untitled dataset";
  const description = getStringNoLocale(datasetThing, DCTERMS.description) || "";
  const issued = getDatetime(datasetThing, DCTERMS.issued);
  const modified = getDatetime(datasetThing, DCTERMS.modified);
  const publisher = getStringNoLocale(datasetThing, DCTERMS.publisher) || "";
  const creator = getUrl(datasetThing, DCTERMS.creator) || "";
  const theme = getStringNoLocale(datasetThing, DCAT.theme) || "";
  const accessRights = getStringNoLocale(datasetThing, DCTERMS.accessRights) || "";

  const contactRef = getUrl(datasetThing, DCAT.contactPoint);
  let contact = "";
  if (contactRef) {
    const contactThing = getThing(datasetDoc, contactRef);
    const mailto =
      getUrl(contactThing, VCARD.hasEmail) ||
      getUrl(contactThing, VCARD.value) ||
      "";
    if (mailto.startsWith("mailto:")) {
      contact = mailto.replace(/^mailto:/, "");
    }
  }

  const distributions = getUrlAll(datasetThing, DCAT.distribution);
  let accessUrlDataset = "";
  let accessUrlModel = "";
  let fileFormat = "";

  distributions.forEach((distUrl) => {
    const resolvedDistUrl = resolveUrl(distUrl, datasetDoc.internal_resourceInfo.sourceIri);
    const distThing = getThing(datasetDoc, resolvedDistUrl) || getThing(datasetDoc, distUrl);
    if (!distThing) return;
    const downloadUrl = resolveUrl(
      getUrl(distThing, DCAT.downloadURL) || "",
      datasetDoc.internal_resourceInfo.sourceIri
    );
    const mediaType = getStringNoLocale(distThing, DCAT.mediaType) || "";
    if (downloadUrl.endsWith(".ttl") || mediaType === "text/turtle") {
      if (!accessUrlModel) accessUrlModel = downloadUrl;
    } else if (!accessUrlDataset) {
      accessUrlDataset = downloadUrl;
      fileFormat = mediaType;
    }
  });

  const isPublic = accessRights.toLowerCase() === "public";

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

export const loadAggregatedDatasets = async (session) => {
  if (!session?.info?.webId) {
    return { datasets: [], catalogs: [] };
  }
  const webId = session.info.webId;
  const fetch = session.fetch;

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

const buildDatasetResource = (datasetDocUrl, input) => {
  const datasetUrl = `${datasetDocUrl}#it`;
  let datasetThing = createThing({ url: datasetUrl });
  datasetThing = addUrl(datasetThing, RDF.type, DCAT.Dataset);
  datasetThing = removeAll(datasetThing, DCTERMS.identifier);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.identifier, input.identifier);
  datasetThing = removeAll(datasetThing, DCTERMS.title);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.title, input.title || "");
  datasetThing = removeAll(datasetThing, DCTERMS.description);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.description, input.description || "");
  datasetThing = removeAll(datasetThing, DCTERMS.issued);
  datasetThing = setDatetime(datasetThing, DCTERMS.issued, new Date(input.issued || safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.modified);
  datasetThing = setDatetime(datasetThing, DCTERMS.modified, new Date(input.modified || safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.publisher);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.publisher, input.publisher || "");
  datasetThing = removeAll(datasetThing, DCTERMS.creator);
  if (input.webid) {
    datasetThing = setUrl(datasetThing, DCTERMS.creator, input.webid);
  }
  datasetThing = removeAll(datasetThing, DCAT.theme);
  if (input.theme) {
    datasetThing = setStringNoLocale(datasetThing, DCAT.theme, input.theme);
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
  contactThing = setStringNoLocale(contactThing, VCARD.fn, input.publisher || "");
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
  let solidDataset = createSolidDataset();
  let datasetThing = buildDatasetResource(datasetDocUrl, input);

  const contactThing = buildContactThing(datasetDocUrl, input);
  if (contactThing) {
    solidDataset = setThing(solidDataset, contactThing);
    datasetThing = setUrl(datasetThing, DCAT.contactPoint, contactThing.url);
  }

  const distDataset = buildDistributionThing(
    datasetDocUrl,
    "dist-data",
    input.access_url_dataset,
    input.file_format
  );
  if (distDataset) {
    solidDataset = setThing(solidDataset, distDataset);
    datasetThing = addUrl(datasetThing, DCAT.distribution, distDataset.url);
  }

  const distModel = buildDistributionThing(
    datasetDocUrl,
    "dist-model",
    input.access_url_semantic_model,
    "text/turtle"
  );
  if (distModel) {
    solidDataset = setThing(solidDataset, distModel);
    datasetThing = addUrl(datasetThing, DCAT.distribution, distModel.url);
  }

  solidDataset = setThing(solidDataset, datasetThing);
  await saveSolidDatasetAt(datasetDocUrl, solidDataset, { fetch: session.fetch });
  await makePublicReadable(datasetDocUrl, session.fetch);
};

const updateCatalogDatasets = async (session, catalogDocUrl, datasetUrl, { remove }) => {
  let catalogDataset;
  try {
    catalogDataset = await getSolidDataset(catalogDocUrl, { fetch: session.fetch });
  } catch (err) {
    catalogDataset = createSolidDataset();
  }
  let catalogThing = getThing(catalogDataset, `${catalogDocUrl}#it`);
  if (!catalogThing) {
    catalogThing = createThing({ url: `${catalogDocUrl}#it` });
    catalogThing = addUrl(catalogThing, RDF.type, DCAT.Catalog);
    catalogThing = setStringNoLocale(catalogThing, DCTERMS.title, "Solid Dataspace Catalog");
  }

  const current = new Set(getUrlAll(catalogThing, DCAT.dataset));
  if (remove) {
    current.delete(datasetUrl);
  } else {
    current.add(datasetUrl);
  }
  catalogThing = removeAll(catalogThing, DCAT.dataset);
  current.forEach((url) => {
    catalogThing = addUrl(catalogThing, DCAT.dataset, url);
  });
  catalogThing = removeAll(catalogThing, DCTERMS.modified);
  catalogThing = setDatetime(catalogThing, DCTERMS.modified, new Date());

  catalogDataset = setThing(catalogDataset, catalogThing);
  await saveSolidDatasetAt(catalogDocUrl, catalogDataset, { fetch: session.fetch });
  await makePublicReadable(catalogDocUrl, session.fetch);
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

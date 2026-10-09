import { assertProfileDistributions, profileDistributions } from "./profileRdf";
import {
  assertCatalogDatasetDeletionTarget,
  createDataset,
  deleteDatasetEntry,
  ensureCatalogStructure,
  ensurePublicReadOnlyResourceAccess,
  ensureRestrictedResourceAccess,
  getPodRoot,
  loadAggregatedDatasets,
  loadRegistryConfig,
  REGISTRY_PRESETS,
  saveRegistryConfig,
  updateDataset,
} from "./solidCatalog";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";

const generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dataset-${Date.now()}`;
};

const normalizeContactEmail = (value) => {
  const candidate = String(value || "").trim().replace(/^mailto:/, "");
  return candidate.includes("@") && !candidate.includes(":") ? candidate : "";
};

const normalizeContactUrl = (value) => {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
};

const normalizePodRoot = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim() !== value) {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  return url.href.endsWith("/") ? url.href : `${url.href}/`;
};

const normalizeHttpUrl = (
  value,
  label,
  { allowHash = false, allowEmpty = false } = {}
) => {
  const candidate = String(value || "").trim();
  if (!candidate && allowEmpty) return "";
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${label} must be an absolute HTTP(S) URL.`);
  }
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password ||
    url.search ||
    (!allowHash && url.hash)
  ) {
    throw new Error(`${label} must be an absolute HTTP(S) URL.`);
  }
  return url.href;
};

const normalizeRegistryUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    const localHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !localHttp) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return "";
    }
    return url.href.replace(/\/+$/, "");
  } catch {
    return "";
  }
};

const normalizeTheme = (value) => {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return normalizeHttpUrl(candidate, "Theme", { allowHash: true });
  }
  const slug = candidate.toLowerCase().replace(/\s+/g, "-");
  return `${DEFAULT_THEME_NS}${encodeURIComponent(slug)}`;
};

const normalizeOperationId = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim() !== value) {
    throw new Error("Operation ID contains unsupported characters.");
  }
  if (!OPERATION_ID_PATTERN.test(value)) {
    throw new Error("Operation ID contains unsupported characters.");
  }
  return value;
};

const requireSession = (session) => {
  if (!session?.info?.webId || typeof session.fetch !== "function") {
    throw new Error("An authenticated Solid session is required.");
  }
};

const loadResearchRegistryContext = async (session, { podRoot = "" } = {}) => {
  requireSession(session);
  const registryConfig = await loadRegistryConfig(
    session.info.webId,
    session.fetch,
    { podRoot }
  );
  const publicRegistries = Array.from(
    new Set(
      (Array.isArray(registryConfig?.registries)
        ? registryConfig.registries
        : []
      )
        .map(normalizeRegistryUrl)
        .filter(Boolean)
    )
  );
  return {
    catalogConfigured:
      registryConfig?.mode === "research" && publicRegistries.length > 0,
    publicRegistries:
      registryConfig?.mode === "research" ? publicRegistries : [],
    registryConfig: {
      ...registryConfig,
      mode: registryConfig?.mode === "private" ? "private" : "research",
      registries: publicRegistries,
    },
  };
};

const discoverableRegistryError = () => {
  const error = new Error(
    "A public Dataspace registry must be configured before this operation can continue."
  );
  error.code = "discoverable-registry-required";
  return error;
};

export function normalizeRestrictedDatasetInput(session, input = {}) {
  requireSession(session);
  const identifier = String(input.identifier || generateIdentifier()).trim();
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error("Dataset identifier contains unsupported characters.");
  }
  const primary = input.distributions?.[0] || {};
  const distributionUrl = String(
    input.distributionUrl || input.access_url_dataset || input.dataUrl || primary.downloadURL || ""
  ).trim();
  if (!distributionUrl) throw new Error("A dataset distribution URL is required.");
  const includeCreator = input.includeCreator !== false && input.omitCreator !== true;
  const contactPoint = input.contactPoint || input.contact_point || "";
  const explicitContactUrl =
    input.contactPointWebId ||
    input.contactWebId ||
    input.contactPointUrl ||
    input.contactUrl ||
    input.contact_url ||
    contactPoint;

  const normalized = {
    podRoot: normalizePodRoot(input.podRoot || input.pod_root),
    identifier,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    issued: input.issued || new Date().toISOString(),
    publisher: String(input.publisher || "").trim(),
    publisher_url: normalizeContactUrl(
      input.publisherWebId || input.publisherUrl || input.publisher_url
    ),
    contact_point: normalizeContactEmail(contactPoint),
    contact_url: normalizeContactUrl(explicitContactUrl),
    access_url_dataset: distributionUrl,
    distributions: input.distributions,
    semanticModels: input.conformsTo || input.semanticModels || [],
    access_url_semantic_model: String(
      input.semanticModelUrl || input.access_url_semantic_model || input.conformsTo?.[0] || input.semanticModels?.[0] || primary.conformsTo?.[0] || ""
    ).trim(),
    file_format: String(input.mediaType || input.file_format || primary.mediaType || "").trim(),
    theme: String(input.theme || "").trim(),
    webid: includeCreator
      ? String(input.creatorWebId || input.webid || session.info.webId).trim()
      : "",
    distribution_access_type: "download",
    is_public: false,
    strict_restricted_acl: true,
    require_discoverable_registry:
      input.requireDiscoverableRegistry === true ||
      input.require_discoverable_registry === true,
  };
  assertProfileDistributions(profileDistributions(normalized));
  return normalized;
}

export function normalizePublicDatasetInput(session, input = {}) {
  const normalized = normalizeRestrictedDatasetInput(session, input);
  if (!normalized.title) {
    throw new Error("A public dataset title is required.");
  }
  if (!normalized.file_format) {
    throw new Error("A public dataset media type is required.");
  }

  return {
    ...normalized,
    access_url_dataset: normalizeHttpUrl(
      normalized.access_url_dataset,
      "Dataset distribution URL"
    ),
    access_url_semantic_model: normalized.access_url_semantic_model,
    theme: normalizeTheme(normalized.theme),
    is_public: true,
    strict_restricted_acl: false,
    strict_public_acl: true,
    require_discoverable_registry: true,
  };
}

export async function getCatalogReadiness(session, options = {}) {
  const explicitPodRoot = normalizePodRoot(
    options.podRoot || options.pod_root
  );
  const podRoot = explicitPodRoot || getPodRoot(session?.info?.webId);
  const { catalogConfigured, publicRegistries } =
    await loadResearchRegistryContext(session, { podRoot });
  return { catalogConfigured, publicRegistries };
}

export function getPublicRegistryPresets() {
  const presets = new Map();
  for (const preset of REGISTRY_PRESETS || []) {
    const url = normalizeRegistryUrl(preset?.url);
    const id = String(preset?.id || "").trim();
    const label = String(preset?.label || "").trim();
    if (!id || !label || !url || presets.has(url)) continue;
    presets.set(url, { id, label, url });
  }
  return Array.from(presets.values());
}

export async function ensurePublicCatalogReadiness(session, options = {}) {
  requireSession(session);
  const explicitPodRoot = normalizePodRoot(
    options.podRoot || options.pod_root
  );
  const podRoot = explicitPodRoot || getPodRoot(session.info.webId);
  const registryUrl = normalizeRegistryUrl(
    options.registryUrl || options.registry_url
  );
  if (!registryUrl) {
    throw new Error("Choose a valid public research registry.");
  }

  const current = await loadResearchRegistryContext(session, { podRoot });
  const allowedRegistries = new Set([
    ...getPublicRegistryPresets().map((preset) => preset.url),
    ...current.publicRegistries,
  ]);
  if (!allowedRegistries.has(registryUrl)) {
    throw new Error("The selected public research registry is not an available preset.");
  }

  // Preserve already-active public memberships and the user's private registry
  // location. Only the explicit app consent switches the profile to research
  // mode and adds the selected public registry.
  const registryConfig = {
    ...current.registryConfig,
    mode: "research",
    registries: Array.from(
      new Set([...current.publicRegistries, registryUrl])
    ),
  };
  await saveRegistryConfig(session.info.webId, session.fetch, registryConfig, {
    podRoot,
  });
  await ensureCatalogStructure(session, {
    podRoot,
    registryConfig,
    title: String(options.catalogTitle || "Solid Dataspace Catalog").trim(),
  });

  const verified = await loadResearchRegistryContext(session, { podRoot });
  if (
    !verified.catalogConfigured ||
    !verified.publicRegistries.includes(registryUrl)
  ) {
    throw new Error("The public research registry setup could not be verified.");
  }
  return {
    catalogConfigured: true,
    publicRegistries: verified.publicRegistries,
    selectedRegistry: registryUrl,
  };
}

const prepareDistributionAccess = async (session, input, podRoot) => {
  const ensureAccess = input.is_public ? ensurePublicReadOnlyResourceAccess : ensureRestrictedResourceAccess;
  const root = new URL(podRoot);
  const localModel = url => {
    const target = new URL(url);
    return target.origin === root.origin && target.pathname.startsWith(root.pathname);
  };
  const resources = new Set();
  for (const distribution of profileDistributions(input)) {
    resources.add(distribution.downloadURL);
    distribution.conformsTo.filter(localModel).forEach(url => resources.add(url));
  }
  for (const url of resources) await ensureAccess(session, url, { podRoot });
};

export async function publishPublicDataset(session, input = {}) {
  const normalized = normalizePublicDatasetInput(session, input);
  const podRoot = normalized.podRoot || getPodRoot(session.info.webId);
  const datasetUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl#it`;
  const recordUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl`;
  const catalogUrl = `${podRoot}catalog/cat.ttl`;
  const readiness = await loadResearchRegistryContext(session, { podRoot });
  if (!readiness.catalogConfigured) throw discoverableRegistryError();
  normalized.registryConfig = readiness.registryConfig;

  await prepareDistributionAccess(session, normalized, podRoot);

  try {
    const created = await createDataset(session, normalized);
    await ensurePublicReadOnlyResourceAccess(session, created.datasetUrl, {
      podRoot,
    });
    await ensurePublicReadOnlyResourceAccess(session, recordUrl, { podRoot });
    await ensurePublicReadOnlyResourceAccess(session, catalogUrl, { podRoot });
    return {
      ...created,
      recordUrl,
      distributionUrl: normalized.access_url_dataset,
    };
  } catch (error) {
    try {
      await deleteDatasetEntry(session, datasetUrl, normalized.identifier, {
        podRoot,
      });
    } catch (cleanupError) {
      console.warn(
        "Failed to clean up incomplete public dataset metadata.",
        cleanupError
      );
    }
    throw error;
  }
}

export async function updatePublicDataset(session, input = {}) {
  const normalized = normalizePublicDatasetInput(session, input);
  const operationId = normalizeOperationId(
    input.operationId ?? input.operation_id
  );
  const podRoot = normalized.podRoot || getPodRoot(session.info.webId);
  const expectedDatasetUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl#it`;
  const requestedDatasetUrl = String(
    input.datasetUrl || input.catalogDatasetUrl || ""
  ).trim();
  if (!requestedDatasetUrl) {
    throw new Error("An existing catalog dataset URL is required for an update.");
  }
  const datasetUrl = assertCatalogDatasetDeletionTarget(
    podRoot,
    requestedDatasetUrl,
    normalized.identifier
  );
  if (new URL(datasetUrl).href !== new URL(expectedDatasetUrl).href) {
    throw new Error(
      "Dataset URL must match the deterministic catalog URL for its identifier."
    );
  }

  const recordUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl`;
  const catalogUrl = `${podRoot}catalog/cat.ttl`;
  const readiness = await loadResearchRegistryContext(session, { podRoot });
  if (!readiness.catalogConfigured) throw discoverableRegistryError();
  normalized.registryConfig = readiness.registryConfig;

  await prepareDistributionAccess(session, normalized, podRoot);

  // Updating an existing deterministic entry deliberately has no create-style
  // cleanup path. If a later verification fails, keep the existing metadata in
  // place so callers can retry or compensate without losing the Catalog entry.
  await updateDataset(session, {
    ...normalized,
    podRoot,
    datasetUrl,
    ...(operationId ? { operation_id: operationId } : {}),
  });
  await ensurePublicReadOnlyResourceAccess(session, datasetUrl, { podRoot });
  await ensurePublicReadOnlyResourceAccess(session, recordUrl, { podRoot });
  await ensurePublicReadOnlyResourceAccess(session, catalogUrl, { podRoot });

  return {
    identifier: normalized.identifier,
    datasetUrl,
    recordUrl,
    distributionUrl: normalized.access_url_dataset,
  };
}

const normalizeDiscoveryOptions = (options = {}) => {
  const identifierPrefix = String(options.identifierPrefix || "").trim();
  if (identifierPrefix && !IDENTIFIER_PATTERN.test(identifierPrefix)) {
    throw new Error("Dataset identifier prefix contains unsupported characters.");
  }
  return {
    podRoot: normalizePodRoot(options.podRoot || options.pod_root),
    identifierPrefix,
    mediaType: String(options.mediaType || "").trim().toLowerCase(),
    theme: options.theme ? normalizeTheme(options.theme) : "",
  };
};

const safeDiscoveredUrl = (value, { allowHash = false } = {}) => {
  try {
    return normalizeHttpUrl(value, "Discovered URL", { allowHash });
  } catch {
    return "";
  }
};

export async function discoverPublicDatasets(session, options = {}) {
  requireSession(session);
  const filters = normalizeDiscoveryOptions(options);
  const podRoot = filters.podRoot || getPodRoot(session.info.webId);
  const readiness = await loadResearchRegistryContext(session, { podRoot });
  if (!readiness.catalogConfigured) throw discoverableRegistryError();

  const aggregated = await loadAggregatedDatasets(session, undefined, {
    researchRegistries: readiness.publicRegistries,
  });
  const discovered = new Map();
  for (const dataset of aggregated?.datasets || []) {
    const identifier = String(dataset?.identifier || "").trim();
    const title = String(dataset?.title || "").trim();
    const mediaType = String(dataset?.file_format || "").trim();
    const theme = String(dataset?.theme || "").trim();
    const datasetUrl = safeDiscoveredUrl(dataset?.datasetUrl, {
      allowHash: true,
    });
    const distributionUrl = safeDiscoveredUrl(dataset?.access_url_dataset);
    if (
      dataset?.datasetType !== "dataset" ||
      dataset?.is_public !== true ||
      !IDENTIFIER_PATTERN.test(identifier) ||
      !title ||
      !mediaType ||
      !theme ||
      !datasetUrl ||
      !distributionUrl ||
      (filters.identifierPrefix &&
        !identifier.startsWith(filters.identifierPrefix)) ||
      (filters.mediaType && mediaType.toLowerCase() !== filters.mediaType) ||
      (filters.theme && theme !== filters.theme)
    ) {
      continue;
    }

    discovered.set(datasetUrl, {
      identifier,
      title,
      description: String(dataset.description || "").trim(),
      publisher: String(dataset.publisher || "").trim(),
      creatorWebId: safeDiscoveredUrl(dataset.webid, { allowHash: true }),
      datasetUrl,
      distributionUrl,
      mediaType,
      theme,
    });
  }
  return Array.from(discovered.values());
}

export async function publishRestrictedDataset(session, input = {}) {
  const normalized = normalizeRestrictedDatasetInput(session, input);
  const podRoot = normalized.podRoot || getPodRoot(session.info.webId);
  const datasetUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl#it`;
  const recordUrl = `${podRoot}catalog/ds/${normalized.identifier}.ttl`;

  if (normalized.require_discoverable_registry) {
    const registryConfig = await loadRegistryConfig(
      session.info.webId,
      session.fetch,
      { podRoot }
    );
    if (
      registryConfig?.mode !== "research" ||
      !Array.isArray(registryConfig.registries) ||
      registryConfig.registries.length === 0
    ) {
      const error = new Error(
        "A public Dataspace registry must be configured before this dataset can be published."
      );
      error.code = "discoverable-registry-required";
      throw error;
    }
    normalized.registryConfig = registryConfig;
  }

  await prepareDistributionAccess(session, normalized, podRoot);

  try {
    const created = await createDataset(session, normalized);
    return {
      ...created,
      recordUrl,
      distributionUrl: normalized.access_url_dataset,
    };
  } catch (error) {
    try {
      await deleteDatasetEntry(session, datasetUrl, normalized.identifier, { podRoot });
    } catch (cleanupError) {
      console.warn("Failed to clean up incomplete restricted dataset metadata.", cleanupError);
    }
    throw error;
  }
}

export async function removeDataset(session, reference = {}) {
  requireSession(session);
  const input = typeof reference === "string" ? { datasetUrl: reference } : reference;
  const explicitPodRoot = normalizePodRoot(input.podRoot || input.pod_root);
  const podRoot = explicitPodRoot || getPodRoot(session.info.webId);
  const identifier = String(input.identifier || "").trim();
  if (identifier && !IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error("Dataset identifier contains unsupported characters.");
  }
  const datasetUrl = String(
    input.datasetUrl ||
      (identifier
        ? `${podRoot}catalog/ds/${identifier}.ttl#it`
        : "")
  ).trim();
  if (!datasetUrl) throw new Error("datasetUrl or identifier is required.");
  const safeDatasetUrl = assertCatalogDatasetDeletionTarget(
    podRoot,
    datasetUrl,
    identifier
  );

  await deleteDatasetEntry(session, safeDatasetUrl, identifier, { podRoot });
  return { removed: true, datasetUrl: safeDatasetUrl, identifier };
}

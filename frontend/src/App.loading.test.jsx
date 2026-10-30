import React, { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { session } from "./solidSession";
import { cleanupCatalogSeriesLinks, loadAggregatedDatasets, loadRegistryConfig, parseDatasetFromDoc } from "./solidCatalog";
import { getSolidDataset } from "@inrupt/solid-client";
import { loadProfilePhoto } from "./components/HeaderBar";

jest.mock("./solidSession", () => ({ session: {
  info: { isLoggedIn: true, webId: "https://pod.example/alice/profile/card#me" },
  fetch: jest.fn(), login: jest.fn(), logout: jest.fn(),
} }));
jest.mock("./solidCatalog", () => ({
  cleanupCatalogSeriesLinks: jest.fn(), loadAggregatedDatasets: jest.fn(),
  parseDatasetFromDoc: jest.fn(), loadRegistryConfig: jest.fn(), SDP_CATALOG: "catalog", buildDefaultPrivateRegistry: jest.fn(),
}));
jest.mock("@inrupt/solid-client", () => ({
  getSolidDataset: jest.fn(), getThing: (doc) => doc, getThingAll: (doc) => [doc],
  getStringNoLocale: (thing, key) => thing?.[key] || "",
  getUrl: (thing, key) => thing?.[key] || "",
  getUrlAll: (thing, key) => thing?.[key] || [],
}));
jest.mock("@inrupt/vocab-common-rdf", () => ({
  FOAF: { name: "name" }, LDP: { inbox: "inbox" },
  VCARD: { fn: "name", organization_name: "org", role: "role", hasEmail: "emails", email: "directEmails" },
}));
jest.mock("./components/CatalogWorkspace", () => ({ datasets, accessService, actions, detail, onSemanticSearch }) => (
  <><button data-testid="check-access" onClick={() => accessService.check(datasets[0], undefined, {force:true})}>Check access</button><div data-testid="datasets">{datasets.map((item) => item.title).join(",")}</div>{actions((text) => text)}<button data-testid="semantic-search-trigger" onClick={onSemanticSearch}>Semantic Search</button>{detail}</>
));
jest.mock("./components/HeaderBar", () => ({
  __esModule: true, default: ({ initialUserInfo }) => <header>{initialUserInfo?.name}</header>,
  loadProfilePhoto: jest.fn().mockResolvedValue(""),
}));
jest.mock("./components/FooterBar", () => () => null);
jest.mock("./components/DatasetAddModal", () => () => null);
jest.mock("./components/DatasetDetailModal", () => ({ dataset, onClose }) => <div role="dialog">{dataset?.title}<button data-testid="close-detail" onClick={onClose}>Close detail</button></div>);
jest.mock("./components/SemanticSearch", () => ({ onOpenDataset }) => <button data-testid="open-result" onClick={() => onOpenDataset("https://pod.example/private/dataset.ttl#it")}>Open result</button>);
jest.mock("./components/DatasetDeleteModal", () => () => null);
jest.mock("./components/DatasetEditModal", () => () => null);
jest.mock("./components/PrivateRegistryModal", () => () => null);
jest.mock("./components/CatalogSurvey", () => () => null);
jest.mock("./components/OnboardingWizard", () => ({ onComplete }) => (
  <button data-testid="onboarding" onClick={onComplete}>Complete setup</button>
));

const WEB_ID = "https://pod.example/alice/profile/card#me";
const profile = { name: "Alice", org: "Example", role: "Researcher", inbox: "https://pod.example/inbox/",
  emails: ["mailto:alice@example.test"], catalog: "https://pod.example/catalog.ttl#it" };
const catalog = { datasets: [{ title: "Fully loaded dataset", datasetUrl: "https://pod.example/private/dataset.ttl#it", is_public: true }], catalogs: [] };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

describe("catalog startup gate", () => {
  let root, container;
  beforeAll(() => { global.IS_REACT_ACT_ENVIRONMENT = true; });
  beforeEach(() => {
    jest.clearAllMocks();
    window.__APP_CONFIG__ = { catalog: { defaultRegistry: 'https://registry.example/public/test/' } };
    window.history.replaceState({}, "", "/");
    parseDatasetFromDoc.mockReturnValue({ title: "Opened dataset", datasetUrl: "https://pod.example/private/dataset.ttl#it" });
    session.info = { isLoggedIn: true, webId: WEB_ID };
    cleanupCatalogSeriesLinks.mockResolvedValue(undefined);
    loadAggregatedDatasets.mockResolvedValue(catalog);
    loadRegistryConfig.mockResolvedValue({ mode: "research", privateRegistry: "https://pod.example/registry.ttl" });
    getSolidDataset.mockResolvedValue(profile);
    loadProfilePhoto.mockResolvedValue("");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    jest.restoreAllMocks();
    delete window.__APP_CONFIG__;
  });
  const render = async (props = {}) => {
    await act(async () => root.render(<App embedded webIdOverride={session.info.webId} language="en" {...props} />));
  };
  const table = () => container.querySelector('[data-testid="datasets"]');
  const loading = () => container.querySelector('[role="progressbar"]');

  test.each([true, false])("waits for all datasets after the profile is ready (embedded=%s)", async (embedded) => {
    const pending = deferred();
    loadAggregatedDatasets.mockReturnValue(pending.promise);
    await render({ embedded });
    expect(loading()).not.toBeNull();
    expect(table()).toBeNull();
    await act(async () => pending.resolve(catalog));
    expect(loading()).toBeNull();
    expect(table().textContent).toBe("Fully loaded dataset");
    expect(loadAggregatedDatasets).toHaveBeenCalledTimes(1);
  });

  test("waits for profile and registry even if datasets arrive first", async () => {
    const pendingProfile = deferred(), pendingRegistry = deferred();
    getSolidDataset.mockReturnValueOnce(pendingProfile.promise);
    loadRegistryConfig.mockReturnValue(pendingRegistry.promise);
    await render();
    expect(table()).toBeNull();
    await act(async () => pendingProfile.resolve(profile));
    expect(table()).toBeNull();
    expect(loading()).not.toBeNull();
    await act(async () => pendingRegistry.resolve({ mode: "private", privateRegistry: "https://pod.example/registry.ttl" }));
    expect(table()).not.toBeNull();
    expect(container.textContent).toContain("Private Registry");
  });

  test("browsing registry members never runs maintenance on the viewer's catalog, including Strict Mode", async () => {
    await act(async () => root.render(<StrictMode><App embedded webIdOverride={WEB_ID} /></StrictMode>));
    expect(cleanupCatalogSeriesLinks).not.toHaveBeenCalled();
    expect(table()).not.toBeNull();
  });

  test.each(['research', 'private'])("personal %s membership does not replace the registry for this address", async mode => {
    loadRegistryConfig.mockResolvedValue({ mode, privateRegistry: 'https://pod.example/private-registry/', registries: ['https://other.example/registry/'] });
    await render();
    expect(loadAggregatedDatasets).toHaveBeenCalledWith(session, null, expect.objectContaining({ registryUrl: 'https://registry.example/public/test/', usePublicCache: true }));
    expect(loadAggregatedDatasets.mock.calls[0][2].requireEnrollment).toBeUndefined();
    expect(table()).not.toBeNull();
  });

  test("a successfully loaded empty catalog opens normally", async () => {
    loadAggregatedDatasets.mockResolvedValue({ datasets: [], catalogs: [] });
    await render();
    expect(table()).not.toBeNull();
    expect(loading()).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  test.each(["rejection", "discovery"])("keeps complete load or registry discovery failures blocking: %s", async (failure) => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    loadAggregatedDatasets.mockImplementationOnce(async (_session, _fetch, options) => {
      if (failure === "rejection") throw new Error("offline");
      options.onLoadError(new Error("registry offline"));
      return catalog;
    });
    await render();
    expect(table()).toBeNull();
    expect(loading()).toBeNull();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    const next = deferred();
    loadAggregatedDatasets.mockReturnValue(next.promise);
    await act(async () => container.querySelector("button").click());
    expect(loading()).not.toBeNull();
    await act(async () => next.resolve(catalog));
    expect(table()).not.toBeNull();
  });

  test.each([
    ["dataset", 403], ["dataset", 404], ["dataset", 500],
    ["catalog", 403], ["catalog", 404], ["catalog", 500],
  ])("shows available data without a partial-load banner after a %s returns %s", async (stage, statusCode) => {
    const pending = deferred();
    loadAggregatedDatasets.mockImplementationOnce((_session, _fetch, options) => {
      options.onLoadError(Object.assign(new Error("source unavailable"), { statusCode }), { stage });
      return pending.promise;
    });
    await render();
    expect(loading()).not.toBeNull();
    expect(table()).toBeNull();
    expect(container.querySelector(".catalog-load-warning")).toBeNull();
    await act(async () => pending.resolve(catalog));
    expect(loading()).toBeNull();
    expect(table().textContent).toBe("Fully loaded dataset");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector(".catalog-load-warning")).toBeNull();
  });

  test("shows an empty result without a partial-load banner when entries are skipped", async () => {
    loadAggregatedDatasets.mockImplementationOnce(async (_session, _fetch, options) => {
      options.onLoadError({ statusCode: 404 }, { stage: "dataset" });
      return { datasets: [], catalogs: [profile.catalog] };
    });
    await render();
    expect(table()).not.toBeNull();
    expect(container.querySelector(".catalog-load-warning")).toBeNull();
    expect(loading()).toBeNull();
  });

  test("a failed profile request is not mistaken for missing onboarding", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    getSolidDataset.mockRejectedValueOnce(new Error("network offline"));
    await render();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="onboarding"]')).toBeNull();
    expect(table()).toBeNull();
  });

  test("reloads the completed catalog after onboarding", async () => {
    getSolidDataset.mockResolvedValueOnce({ ...profile, name: "" });
    await render();
    expect(container.querySelector('[data-testid="onboarding"]')).not.toBeNull();
    const next = deferred();
    loadAggregatedDatasets.mockReturnValue(next.promise);
    await act(async () => container.querySelector("button").click());
    expect(loading()).not.toBeNull();
    expect(table()).toBeNull();
    await act(async () => next.resolve(catalog));
    expect(table()).not.toBeNull();
  });

  test("late results from the previous account cannot open or overwrite the new account", async () => {
    const old = deferred(), next = deferred();
    loadAggregatedDatasets.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    await render();
    session.info = { isLoggedIn: true, webId: "https://pod.example/bob/profile/card#me" };
    await render();
    await act(async () => old.resolve(catalog));
    expect(table()).toBeNull();
    await act(async () => next.resolve({ datasets: [{ title: "Bob's catalog" }], catalogs: [] }));
    expect(table().textContent).toBe("Bob's catalog");
  });

  test("anonymous standalone users can log in without waiting for catalogs", async () => {
    session.info = { isLoggedIn: false, webId: null };
    window.fetch = jest.fn();
    loadAggregatedDatasets.mockReturnValue(new Promise(() => {}));
    await render({ embedded: false, LoginScreenComponent: () => <button>Log in</button> });
    expect(loading()).toBeNull();
    expect(container.textContent).toContain("Log in");
  });
});


describe("dataset links and semantic search results", () => {
  let root, container;
  const documentUrl = "https://pod.example/private/dataset.ttl";
  const datasetUrl = `${documentUrl}#it`;
  beforeEach(() => {
    jest.clearAllMocks();
    window.__APP_CONFIG__ = { catalog: { defaultRegistry: 'https://registry.example/public/test/' } };
    window.history.replaceState({}, "", "/");
    session.info = { isLoggedIn: true, webId: WEB_ID };
    cleanupCatalogSeriesLinks.mockResolvedValue(undefined);
    loadAggregatedDatasets.mockResolvedValue(catalog);
    loadRegistryConfig.mockResolvedValue({ mode: "research", privateRegistry: "https://pod.example/registry.ttl" });
    loadProfilePhoto.mockResolvedValue("");
    getSolidDataset.mockResolvedValue(profile);
    parseDatasetFromDoc.mockReturnValue({ title: "Opened dataset", datasetUrl });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    window.history.replaceState({}, "", "/");
    jest.restoreAllMocks();
    delete window.__APP_CONFIG__;
  });

  test.each([true, false])("opens a direct dataset link with the active Solid session (embedded=%s)", async embedded => {
    if (!embedded) window.history.replaceState({}, "", `/?dataset=${encodeURIComponent(datasetUrl)}`);
    await act(async () => root.render(<App embedded={embedded} webIdOverride={WEB_ID}
      datasetUrl={embedded ? datasetUrl : undefined} language="en" />));
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Opened dataset");
    expect(parseDatasetFromDoc).toHaveBeenCalledWith(profile, datasetUrl);
    const options = getSolidDataset.mock.calls.find(([url]) => url === documentUrl)[1];
    await options.fetch(documentUrl, { headers: { Accept: "text/turtle" } });
    expect(session.fetch).toHaveBeenCalledWith(documentUrl, { headers: { Accept: "text/turtle" }, cache: "no-store" });
  });

  test("personal access updates do not replace fresh direct-link metadata with an older catalog snapshot", async () => {
    loadAggregatedDatasets.mockResolvedValue({ datasets: [{ ...catalog.datasets[0], is_public: false,
      webid: "https://pod.example/bob/profile/card#me", access_url_dataset: "https://pod.example/bob/data.csv" }], catalogs: [] });
    session.fetch.mockResolvedValue({ ok: true, status: 200 });
    await act(async () => root.render(<App embedded webIdOverride={WEB_ID} datasetUrl={datasetUrl} language="en" />));
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Opened dataset");
    await act(async () => container.querySelector('[data-testid="check-access"]').click());
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Opened dataset");
    expect(loadAggregatedDatasets).toHaveBeenCalledTimes(1);
  });

  test("opens a semantic search result instead of throwing a missing-import error", async () => {
    window.history.replaceState({}, "", "/?view=semantic-search");
    await act(async () => root.render(<App language="en" />));
    await act(async () => container.querySelector('[data-testid="open-result"]').click());
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Opened dataset");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  test.each([true, false])("opens semantic search over the existing catalog and closes with Escape (embedded=%s)", async embedded => {
    window.history.replaceState({}, "", embedded ? "/web/catalog" : "/catalog");
    const path = window.location.pathname;
    await act(async () => root.render(<App embedded={embedded} webIdOverride={WEB_ID} language="en" />));
    const listing = container.querySelector('[data-testid="datasets"]');
    expect(container.textContent).not.toContain("Download Catalog");
    await act(async () => container.querySelector('[data-testid="semantic-search-trigger"]').click());
    expect(window.location.pathname).toBe(path);
    expect(container.querySelector('[data-testid="datasets"]')).toBe(listing);
    const modal = container.querySelector('dialog[aria-label="Semantic Search"]');
    expect(modal.open).toBe(true);
    await act(async () => {
      const popped = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
      modal.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: true }));
      await popped;
    });
    expect(container.querySelector('dialog[open]')).toBeNull();
    expect(container.querySelector('[data-testid="datasets"]')).toBe(listing);
  });

  test("keeps semantic search mounted behind result details and shows denied access inside the modal", async () => {
    window.history.replaceState({}, "", "/?view=semantic-search");
    await act(async () => root.render(<App language="en" />));
    const search = container.querySelector('[data-testid="open-result"]');
    getSolidDataset.mockRejectedValueOnce(new Error("Access denied (403)"));
    await act(async () => search.click());
    expect(container.querySelector('dialog[open] [role="alert"]').textContent).toContain('403');
    await act(async () => search.click());
    expect(container.querySelector('dialog[aria-label="Semantic Search"]').open).toBe(false);
    expect(container.querySelector('[data-testid="open-result"]')).toBe(search);
    await act(async () => {
      const popped = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
      container.querySelector('[data-testid="close-detail"]').click();
      await popped;
    });
    expect(container.querySelector('dialog[aria-label="Semantic Search"]').open).toBe(true);
    expect(container.querySelector('[data-testid="open-result"]')).toBe(search);
  });

  test("reports denied access without presenting dataset details", async () => {
    getSolidDataset.mockImplementation(async url => {
      if (url === documentUrl) throw new Error("Access denied (403)");
      return profile;
    });
    await act(async () => root.render(<App embedded webIdOverride={WEB_ID} datasetUrl={datasetUrl} language="en" />));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[role="alert"]').textContent).toContain("403");
    expect(parseDatasetFromDoc).not.toHaveBeenCalled();
  });

  test.each([true, false])("does not open a dataset outside the host registry (embedded=%s)", async embedded => {
    loadAggregatedDatasets.mockResolvedValue({ datasets: [], catalogs: [] });
    if (!embedded) window.history.replaceState({}, '', `/?dataset=${encodeURIComponent(datasetUrl)}`);
    await act(async () => root.render(<App embedded={embedded} webIdOverride={WEB_ID} datasetUrl={embedded ? datasetUrl : undefined} language="en" />));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[role="alert"]').textContent).toContain('not part of this registry');
    expect(getSolidDataset.mock.calls.some(([url]) => url === documentUrl)).toBe(false);
  });

  test("rejects unsafe direct links before fetching them", async () => {
    await act(async () => root.render(<App embedded webIdOverride={WEB_ID} datasetUrl="javascript:alert(1)" language="en" />));
    expect(container.querySelector('[role="alert"]').textContent).toContain("Invalid dataset URL");
    expect(getSolidDataset.mock.calls.every(([url]) => url.startsWith("https://"))).toBe(true);
    expect(parseDatasetFromDoc).not.toHaveBeenCalled();
  });
});

import React, { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { session } from "./solidSession";
import { cleanupCatalogSeriesLinks, loadAggregatedDatasets, loadRegistryConfig } from "./solidCatalog";
import { getSolidDataset } from "@inrupt/solid-client";
import { loadProfilePhoto } from "./components/HeaderBar";

jest.mock("./solidSession", () => ({ session: {
  info: { isLoggedIn: true, webId: "https://pod.example/alice/profile/card#me" },
  fetch: jest.fn(), login: jest.fn(), logout: jest.fn(),
} }));
jest.mock("./solidCatalog", () => ({
  cleanupCatalogSeriesLinks: jest.fn(), loadAggregatedDatasets: jest.fn(),
  loadRegistryConfig: jest.fn(), SDP_CATALOG: "catalog", buildDefaultPrivateRegistry: jest.fn(),
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
jest.mock("./components/DatasetTable", () => ({ datasets }) => (
  <div data-testid="datasets">{datasets.map((item) => item.title).join(",")}</div>
));
jest.mock("./components/HeaderBar", () => ({
  __esModule: true, default: ({ initialUserInfo }) => <header>{initialUserInfo?.name}</header>,
  loadProfilePhoto: jest.fn().mockResolvedValue(""),
}));
jest.mock("./components/SearchBar", () => () => null);
jest.mock("./components/FooterBar", () => () => null);
jest.mock("./components/DatasetAddModal", () => () => null);
jest.mock("./components/DatasetDetailModal", () => () => null);
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
const catalog = { datasets: [{ title: "Fully loaded dataset", is_public: true }], catalogs: [] };
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

  test("finishes maintenance before loading once, including Strict Mode", async () => {
    const pending = deferred();
    cleanupCatalogSeriesLinks.mockReturnValue(pending.promise);
    await act(async () => root.render(<StrictMode><App embedded webIdOverride={WEB_ID} /></StrictMode>));
    expect(cleanupCatalogSeriesLinks).toHaveBeenCalledTimes(1);
    expect(loadAggregatedDatasets).not.toHaveBeenCalled();
    expect(table()).toBeNull();
    await act(async () => pending.resolve());
    expect(loadAggregatedDatasets).toHaveBeenCalledTimes(1);
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

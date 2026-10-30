import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DatasetDetailModal from "./DatasetDetailModal";
import { session } from "../solidSession";
import { openExternalLink } from "../catalogActions";
import { applyDocumentTranslations } from "../i18n";

jest.mock("../solidSession", () => ({ session: { info: { isLoggedIn: true, webId: "https://pod.example/bob/profile/card#me" }, fetch: jest.fn() } }));
jest.mock("@inrupt/solid-client", () => ({}));
jest.mock("../catalogActions", () => ({
  downloadCatalogResource: jest.fn(), openExternalLink: jest.fn(), openDatasetAccess: jest.fn(),
}));
jest.mock("./RDFGraph", () => ({ triples }) => <div data-testid="rdf-graph">{triples.length}</div>);
jest.mock("./RequestDatasetModal", () => () => null);
jest.mock("./RequestSuccessModal", () => () => null);

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  session.fetch.mockResolvedValue({ ok: false });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("keeps catalog metadata unchanged while translating maintained access labels", () => {
  act(() => root.render(<DatasetDetailModal dataset={{
    title: "Language", description: "Sprache", identifier: "Settings", publisher: "Profile", is_public: true,
  }} onClose={() => {}} />));
  for (const language of ["de", "en", "de"]) {
    applyDocumentTranslations(language, container);
    expect(container.querySelector("h2").textContent).toBe("Language");
    expect(container.querySelector(".dataset-detail-description p").textContent).toBe("Sprache");
    const values = Array.from(container.querySelectorAll("td")).map(cell => cell.textContent);
    expect(values).toContain("Settings");
    expect(values).toContain("Profile");
    expect(values).toContain(language === "de" ? "Öffentlich" : "Public");
  }
});

test("translates empty-state text when no catalog title or description was supplied", () => {
  act(() => root.render(<DatasetDetailModal dataset={{ is_public: true }} onClose={() => {}} />));
  applyDocumentTranslations("de", container);
  expect(container.querySelector("h2").textContent).toBe("Datensatz ohne Titel");
  expect(container.querySelector(".dataset-detail-description p").textContent).toBe("Keine Beschreibung angegeben.");
  expect(container.querySelector(".detail-file-title").textContent).toBe("Datensatz-Ressource");
  applyDocumentTranslations("en", container);
  expect(container.querySelector("h2").textContent).toBe("Untitled dataset");
  expect(container.querySelector(".dataset-detail-description p").textContent).toBe("No description provided.");
});

const showModel = async (url, body, contentType, extra = {}) => {
  session.fetch.mockResolvedValue({ ok: true, headers: { get: () => contentType }, text: async () => body });
  await act(async () => root.render(<DatasetDetailModal dataset={{ is_public: true, access_url_semantic_model: url, ...extra }} onClose={() => {}} />));
};

test("shows a JSON Schema reference without an RDF visualization", async () => {
  await showModel("https://geojson.org/schema/FeatureCollection.json", '{"$schema":"http://json-schema.org/draft-07/schema#","type":"object"}', "application/json");
  expect(container.textContent).toContain("Content: JSON Schema");
  expect(container.textContent).toContain("Format: JSON");
  expect(container.textContent).not.toContain("Turtle");
  expect(container.querySelector(".dataset-detail-visualization")).toBeNull();
  applyDocumentTranslations("de", container);
  expect(container.textContent).toContain("Inhalt: JSON Schema");
});

test.each([
  ["https://example.org/spec", "text/html", "HTML", "Open"],
  ["https://example.org/spec.pdf", "application/pdf", "PDF", "Download"],
  ["https://example.org/model.json", "application/json", "JSON", "Download"],
])("labels non-RDF references and chooses the appropriate action: %s", async (url, mime, format, action) => {
  await showModel(url, "{}", mime);
  const row = container.querySelectorAll(".detail-file-row")[1];
  expect(row.textContent).toContain(`Format: ${format}`);
  expect(row.textContent).not.toContain("Semantic model");
  expect(row.querySelector("button").textContent).toBe(action);
  expect(container.querySelector(".dataset-detail-visualization")).toBeNull();
  if (action === "Open") {
    act(() => row.querySelector("button").click());
    expect(openExternalLink).toHaveBeenCalledWith(url);
  }
});

test("shows a collapsed graph only after valid RDF is available, and clears it on selection changes", async () => {
  await showModel("https://example.org/model.ttl", '<#sensor> <https://example.org/type> <#Sensor> .', "text/turtle");
  const details = container.querySelector(".dataset-detail-visualization details");
  expect(details).not.toBeNull();
  expect(details.open).toBe(false);
  expect(container.querySelector('[data-testid="rdf-graph"]')).toBeNull();
  await act(async () => { details.open = true; details.dispatchEvent(new Event("toggle")); });
  expect(container.querySelector('[data-testid="rdf-graph"]').textContent).toBe("1");
  await showModel("https://example.org/schema.json", '{"type":"object"}', "application/json");
  expect(container.querySelector(".dataset-detail-visualization")).toBeNull();
});

test.each(["", '<#a> <#b> <#c> . invalid RDF', '<html>not RDF</html>'])("does not display a graph for empty or malformed RDF", async (body) => {
  await showModel("https://example.org/model.ttl", body, "text/turtle");
  expect(container.querySelector(".dataset-detail-visualization")).toBeNull();
});

test("does not revive RDF visualization when an earlier request finishes late", async () => {
  let resolveOld;
  const old = new Promise(resolve => { resolveOld = resolve; });
  session.fetch.mockReturnValue(old);
  await act(async () => root.render(<DatasetDetailModal dataset={{ is_public: true, access_url_semantic_model: "https://example.org/old.ttl" }} />));
  await showModel("https://example.org/new.json", "{}", "application/json");
  await act(async () => resolveOld({ ok: true, headers: { get: () => "text/turtle" }, text: async () => '<#a> <#b> <#c> .' }));
  expect(container.querySelector(".dataset-detail-visualization")).toBeNull();
  expect(container.textContent).toContain("Format: JSON");
});


test("a readable model does not hide the request action for restricted data", async () => {
  session.fetch.mockImplementation(async url => ({ ok: url.endsWith("model.json"), headers: { get: () => "application/json" }, text: async () => "{}" }));
  const errors = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => root.render(<DatasetDetailModal dataset={{
      is_public: false, webid: "https://pod.example/alice/profile/card#me",
      access_url_dataset: "https://pod.example/alice/data.csv", access_url_semantic_model: "https://pod.example/alice/model.json",
    }} sessionWebId="https://pod.example/bob/profile/card#me" />));
    expect(container.querySelector(".dataset-detail-request-button")).not.toBeNull();
    expect(session.fetch).toHaveBeenCalledWith("https://pod.example/alice/data.csv", expect.objectContaining({ method: "HEAD", cache: "no-store" }));
    expect(session.fetch.mock.calls.some(([url]) => url.endsWith(".acl"))).toBe(false);
  } finally { errors.mockRestore(); }
});

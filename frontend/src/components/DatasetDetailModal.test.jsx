import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DatasetDetailModal from "./DatasetDetailModal";
import { applyDocumentTranslations } from "../i18n";

jest.mock("../solidSession", () => ({ session: { fetch: jest.fn() } }));
jest.mock("@inrupt/solid-client", () => ({}));
jest.mock("../catalogActions", () => ({
  downloadCatalogResource: jest.fn(), openExternalLink: jest.fn(), openDatasetAccess: jest.fn(),
}));
jest.mock("./RDFGraph", () => () => null);
jest.mock("./RequestDatasetModal", () => () => null);
jest.mock("./RequestSuccessModal", () => () => null);

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
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

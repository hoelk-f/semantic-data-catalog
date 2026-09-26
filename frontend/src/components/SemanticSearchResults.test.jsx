import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import SemanticSearchResults from "./SemanticSearchResults";
import { applyDocumentTranslations } from "../i18n";

test("preserves RDF literals, variable names and dataset IRIs in translated results", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onOpenDataset = jest.fn();
  try {
    act(() => root.render(<SemanticSearchResults onOpenDataset={onOpenDataset} result={{ body: {
      head: { vars: ["Language", "dataset"] },
      results: { bindings: [{ Language: { type: "literal", value: "Language", "xml:lang": "en" }, dataset: { type: "uri", value: "https://pod.example/catalog/Settings#it" } }] },
    } }} />));
    const table = container.querySelector("table");
    const original = table.textContent;
    applyDocumentTranslations("de", container);
    expect(table.textContent).toBe(original);
    act(() => table.querySelector("button").click());
    expect(onOpenDataset).toHaveBeenCalledWith("https://pod.example/catalog/Settings#it");
    applyDocumentTranslations("en", container);
    expect(table.textContent).toBe(original);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

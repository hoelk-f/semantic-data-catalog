import React, { act } from "react";
import { createRoot } from "react-dom/client";
import CatalogWorkspace from "./CatalogWorkspace";
import { I18nProvider } from "../i18n";

const datasets = Array.from({ length: 13 }, (_, index) => ({
  identifier: String(index), datasetUrl: `https://pod.example/catalog/${index}#it`,
  title: index === 0 ? "Language" : `Station ${index}`, description: "Messwerte aus Wuppertal",
  publisher: index % 2 ? "Stadt" : "Institut", theme: "Umwelt", is_public: true,
}));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
const render = (props = {}, language = "en") => act(() => root.render(<I18nProvider language={language}><CatalogWorkspace datasets={datasets} onSelect={() => {}} onCloseDetail={() => {}} {...props} /></I18nProvider>));
const change = (element, value) => act(() => {
  const prototype = element.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new Event(element.tagName === "INPUT" ? "input" : "change", { bubbles: true }));
});

test("debounces search, resets pagination and clears without fetching", () => {
  render();
  act(() => container.querySelector('[aria-label="Next page"]').click());
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(3);
  change(container.querySelector('input[type="search"]'), "Station 1");
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(3);
  act(() => jest.advanceTimersByTime(200));
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(4);
  expect(container.querySelectorAll("mark").length).toBeGreaterThan(0);
  act(() => container.querySelector('[aria-label="Clear search"]').click());
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(10);
});

test("combines filters, exposes removable chips and gives an explicit empty state", () => {
  render();
  change(container.querySelectorAll(".catalog-filters select")[1], "Stadt");
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(6);
  expect(container.querySelectorAll(".catalog-filter-chip")).toHaveLength(1);
  change(container.querySelector('input[type="search"]'), "nothing matches");
  act(() => jest.advanceTimersByTime(200));
  expect(container.querySelector(".catalog-empty h2").textContent).toBe("No matching datasets");
  act(() => container.querySelector(".catalog-empty button").click());
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(10);
});

test("selection and language changes retain search, while metadata remains literal", () => {
  const onSelect = jest.fn();
  render({ onSelect }, "de");
  expect(container.querySelector('input[type="search"]').placeholder).toBe("Datensätze suchen...");
  expect(container.querySelector(".catalog-card-title").textContent).toBe("Language");
  change(container.querySelector('input[type="search"]'), "Language");
  act(() => jest.advanceTimersByTime(200));
  act(() => container.querySelector(".catalog-card").click());
  expect(onSelect).toHaveBeenCalledWith(datasets[0]);
  render({ selectedDataset: datasets[0], onSelect }, "en");
  expect(container.querySelector('input[type="search"]').value).toBe("Language");
  expect(container.querySelector(".catalog-card").getAttribute("aria-pressed")).toBe("true");
});

test("shows the reduced Pod name as plain text next to the publisher", () => {
  render({ datasets: [{ ...datasets[0], publisher: "Florian Hölken", publisher_url: "https://identity.example/creator#me", webid: "https://identity.example/creator#me", catalogUrl: "https://solid-community-server.tmdt.info/gesundestal/catalog/cat.ttl#it" }] });
  const pod = container.querySelector(".catalog-pod-name");
  expect(pod.textContent).toBe("gesundestal");
  expect(pod.querySelector("a")).toBeNull();
  expect(container.querySelector(".catalog-card-meta").textContent).toContain("Florian Hölken");
  expect(container.querySelector(".catalog-card-meta").textContent).not.toContain("profile/card");
  expect(container.querySelector(".catalog-card-meta a")).toBeNull();
});


test("Pod selection resets pagination, combines with search, and can be removed or reset", () => {
  const pod = "https://solid.example/gesundestal/";
  const rows = datasets.map((row, index) => ({ ...row, catalogUrl: (index % 2 ? "https://solid.example/stadt/" : pod) + "catalog/cat.ttl#it" }));
  render({ datasets: rows });
  act(() => container.querySelector('[aria-label="Next page"]').click());
  const select = container.querySelector(".catalog-filter--pod select");
  expect([...select.options].map((option) => option.textContent)).toEqual(["All", "gesundestal", "stadt"]);
  change(select, pod);
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(7);
  expect(container.querySelector('[aria-label="Previous page"]').disabled).toBe(true);
  expect([...container.querySelectorAll(".catalog-pod-name")].every((item) => item.textContent === "gesundestal")).toBe(true);
  expect(container.querySelector(".catalog-filter-chip").textContent).toBe("Pod: gesundestal");
  change(container.querySelector('input[type="search"]'), "Station 1");
  act(() => jest.advanceTimersByTime(200));
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(2);
  act(() => container.querySelector(".catalog-filter-chip").click());
  expect(select.value).toBe("");
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(4);
  change(select, pod);
  render({ datasets: rows }, "de");
  expect(select.value).toBe(pod);
  act(() => container.querySelector(".catalog-text-button").click());
  expect(select.value).toBe("");
  expect(container.querySelector('input[type="search"]').value).toBe("");
  expect(container.querySelectorAll(".catalog-card")).toHaveLength(10);
});

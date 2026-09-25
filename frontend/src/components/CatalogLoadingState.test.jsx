import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CatalogLoadingState from "./CatalogLoadingState";
import { I18nProvider } from "../i18n";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";

describe("CatalogLoadingState", () => {
  test("shows an accessible translated retry state without a progress animation", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const retry = jest.fn();
    await act(async () => root.render(
      <I18nProvider language="de">
        <CatalogLoadingState title="Semantic Data Catalog" error onRetry={retry}
          description="Some catalog sources could not be loaded. Please try again." />
      </I18nProvider>
    ));
    expect(container.querySelector('[role="alert"]').textContent).toBe(
      "Einige Katalogquellen konnten nicht geladen werden. Bitte versuche es erneut."
    );
    expect(container.querySelector("main").getAttribute("aria-busy")).toBe("false");
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    const button = container.querySelector("button");
    expect(button.textContent).toBe("Erneut versuchen");
    button.focus();
    expect(document.activeElement).toBe(button);
    await act(async () => button.click());
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const renderLoader = async (language, embedded = false) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <I18nProvider language={language}>
          <CatalogLoadingState
            title="Semantic Data Catalog"
            description="Loading your personal catalog workspace …"
            embedded={embedded}
          />
        </I18nProvider>
      );
      await Promise.resolve();
    });

    const icon = container.querySelector(".catalog-full-loader__mark svg");
    expect(icon.getAttribute("data-icon")).toBe("book-open");
    expect(icon.querySelector("path").getAttribute("d")).toBe(faBookOpen.icon[4]);
    return { container, root };
  };

  test("announces the English full-page loading state", async () => {
    const { container, root } = await renderLoader("en");
    const status = container.querySelector('[role="status"]');
    const loader = container.querySelector(".catalog-full-loader");
    const progress = container.querySelector('[role="progressbar"]');

    expect(status).not.toBeNull();
    expect(loader.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelector("h1").textContent).toBe("Semantic Data Catalog");
    expect(status.textContent).toBe("Loading your personal catalog workspace …");
    expect(progress.getAttribute("aria-label")).toBe(
      "Loading your personal catalog workspace …"
    );
    expect(
      container.firstElementChild.classList.contains(
        "catalog-loading-app--standalone"
      )
    ).toBe(true);
    expect(container.querySelector(".catalog-full-loader__mark")).not.toBeNull();
    expect(container.querySelector(".catalog-full-loader__rail > span")).not.toBeNull();

    await act(async () => root.unmount());
  });

  test("uses the German copy supplied by the shared language setting", async () => {
    const { container, root } = await renderLoader("de");
    const status = container.querySelector('[role="status"]');

    expect(container.querySelector("h1").textContent).toBe(
      "Semantischer Datenkatalog"
    );
    expect(status.textContent).toBe(
      "Dein persönlicher Katalogbereich wird geladen …"
    );

    await act(async () => root.unmount());
  });

  test("fills the host frame in embedded mode", async () => {
    const { container, root } = await renderLoader("en", true);

    expect(
      container.firstElementChild.classList.contains("catalog-loading-app--embedded")
    ).toBe(true);
    expect(container.querySelector(".onboarding-wrap")).toBeNull();

    await act(async () => root.unmount());
  });

  test("stops the indeterminate animation when reduced motion is requested", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/components/CatalogLoadingState.css"),
      "utf8"
    );

    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/\.catalog-full-loader__mark\s*\{[\s\S]*width:\s*5rem/s);
    expect(css).toMatch(/\.catalog-full-loader__rail\s*\{[\s\S]*width:\s*min\(18rem,\s*70vw\)/s);
    expect(css).toMatch(/translateX\(-105%\)/);
    expect(css).toMatch(/translateX\(243%\)/);
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.catalog-full-loader__rail\s*>\s*span\s*\{[^}]*animation:\s*none/s
    );
  });
});

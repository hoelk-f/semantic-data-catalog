import { standaloneCatalogBase } from "./standaloneRoutes";
test.each(["/catalog", "/catalog/"])("keeps the standalone alias %s", pathname => {
  expect(standaloneCatalogBase(pathname, "/semantic-data-catalog")).toBe("/catalog");
});
test.each(["/semantic-data-catalog/", "/web/catalog", "/catalogue"])("retains the configured base outside the standalone alias: %s", pathname => {
  expect(standaloneCatalogBase(pathname, "/semantic-data-catalog")).toBe("/semantic-data-catalog");
});

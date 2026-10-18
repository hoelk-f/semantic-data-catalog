import { resolveCatalogRegistry } from './catalogRegistries';
const base = 'https://registry.example/public/';
const registries = ['timberconnect', 'stadt-wuppertal', 'dace', 'test'].map(id => ({ id, label: id, url: base + id }));

test.each(registries)('embedded profile $id fixes the registry independently of other memberships', registry => {
  expect(resolveCatalogRegistry({ catalog: { defaultRegistry: registry.url }, registries }, {
    CATALOG_DEFAULT_REGISTRY: base + 'other', CATALOG_REGISTRIES: [{ id: 'other', url: base + 'other' }],
  })).toEqual({ url: registry.url + '/', label: registry.id });
});
test.each(registries)('standalone profile $id uses the same domain registry', registry => {
  expect(resolveCatalogRegistry({}, { CATALOG_DEFAULT_REGISTRY: registry.url, CATALOG_REGISTRIES: registries }))
    .toEqual({ url: registry.url + '/', label: registry.id });
});
test('missing or invalid host configuration never falls back to the first registry', () => {
  for (const value of [undefined, '', 'javascript:bad', base + 'test?registry=other', 'https://user:password@registry.example/test']) {
    expect(resolveCatalogRegistry({ catalog: { defaultRegistry: value }, registries }, {})).toEqual({ url: '', label: '' });
  }
});
test('the visible registry name comes from its URL when no preset is supplied', () => {
  expect(resolveCatalogRegistry({}, { CATALOG_DEFAULT_REGISTRY: base + 'stadt-wuppertal/' }))
    .toEqual({ url: base + 'stadt-wuppertal/', label: 'stadt-wuppertal' });
});

import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import useCatalogDatasets from './useCatalogDatasets';
import CatalogWorkspace from './components/CatalogWorkspace';
import DatasetDetailModal from './components/DatasetDetailModal';
import { I18nProvider } from './i18n';
import { loadAggregatedDatasets } from './solidCatalog';
import { session } from './solidSession';
jest.mock('./solidCatalog', () => ({ loadAggregatedDatasets: jest.fn() }));
jest.mock('./solidSession', () => ({ session: { info: { isLoggedIn: true, webId: 'https://pod.example/bob/profile/card#me' }, fetch: jest.fn() } }));
jest.mock('@inrupt/solid-client', () => ({ getSolidDataset: async () => ({}), getThing: () => null, getThingAll: () => [] }));
jest.mock('./components/RDFGraph', () => () => null);
const rows = Array.from({ length: 13 }, (_, i) => ({ identifier: String(i), title: `Station ${i}`, description: 'Sample data',
 webid: 'https://pod.example/alice/profile/card#me', datasetUrl: `https://pod.example/alice/catalog/${i}.ttl#it`,
 access_url_dataset: `https://pod.example/alice/data/${i}.csv`, is_public: i === 1 }));
let root, host, statuses, service;
function Preview({ registry = 'https://registry.example/a', language = 'en' }) {
 const result = useCatalogDatasets(session, session.info.webId, true, registry);
 const [selected, select] = useState(null);
 service = result.accessService;
 const dataset = result.datasets.find(row => row.identifier === selected);
 return <I18nProvider language={language}><CatalogWorkspace datasets={result.datasets} accessService={service}
  selectedDataset={dataset} onSelect={row => select(row.identifier)} onCloseDetail={() => select(null)}
  detail={dataset && <DatasetDetailModal dataset={dataset} sessionWebId={session.info.webId} accessService={service} presentation="inline" onClose={() => select(null)} />}/></I18nProvider>;
}
const badge = () => host.querySelector('.catalog-card .catalog-access');
const changeFilter = value => act(() => {
 const select = host.querySelector('.catalog-filter--access select');
 Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, value);
 select.dispatchEvent(new Event('change', { bubbles: true }));
});
beforeEach(() => {
 global.IS_REACT_ACT_ENVIRONMENT = true;
 host = document.createElement('div'); document.body.append(host); root = createRoot(host);
 statuses = new Map(rows.map((row, i) => [row.access_url_dataset, i === 0 || i === 12 ? 200 : 403]));
 loadAggregatedDatasets.mockReset().mockResolvedValue({ datasets: rows, catalogs: [] });
 session.fetch.mockReset().mockImplementation(async (url, options) => {
  if (options?.method !== 'HEAD') throw Error('No fixture data body');
  const status = statuses.get(url); if (status === 'offline') throw Error('Network unavailable');
  return { ok: status === 200, status };
 });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test('overview resolves grants before opening, including rows beyond page one and the access filter', async () => {
 await act(async () => root.render(<Preview />));
 expect(badge().textContent).toBe('Restricted (you have access)');
 expect(badge().className).toContain('catalog-access--available');
 expect(host.querySelector('.catalog-detail-access')).toBeNull();
 expect(session.fetch).toHaveBeenCalledTimes(12); // Public entries do not require a probe.
 changeFilter('available');
 expect([...host.querySelectorAll('.catalog-card-title')].map(el => el.textContent)).toEqual(['Station 0', 'Station 12']);
 expect(loadAggregatedDatasets).toHaveBeenCalledTimes(1);
});
test('detail and overview share results and both reflect revoke after focus without reloading metadata', async () => {
 await act(async () => root.render(<Preview />));
 await act(async () => host.querySelector('.catalog-card').click());
 expect(host.querySelector('.catalog-detail-access .catalog-access').textContent).toBe(badge().textContent);
 statuses.set(rows[0].access_url_dataset, 403);
 await act(async () => window.dispatchEvent(new Event('focus')));
 expect(badge().className).toContain('catalog-access--restricted');
 expect(host.querySelector('.catalog-detail-access .catalog-access').textContent).toBe('Restricted');
 expect(host.querySelector('.detail-file-row button').disabled).toBe(true);
 expect(loadAggregatedDatasets).toHaveBeenCalledTimes(1);
});
test('network errors remain unknown and a registry change starts a fresh personal check', async () => {
 await act(async () => root.render(<Preview />));
 statuses.set(rows[0].access_url_dataset, 'offline');
 await act(async () => service.refresh());
 expect(badge().textContent).toBe('Access could not be confirmed');
 statuses.set(rows[0].access_url_dataset, 403);
 await act(async () => root.render(<Preview registry="https://registry.example/b" language="de" />));
 expect(badge().textContent).toBe('Eingeschränkt');
 expect(loadAggregatedDatasets).toHaveBeenCalledTimes(2);
});

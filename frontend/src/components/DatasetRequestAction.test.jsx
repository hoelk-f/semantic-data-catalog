import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DatasetDetailModal from './DatasetDetailModal';
import { readAccessRequestState } from '../accessRequestState';
import { session } from '../solidSession';
import { I18nProvider, applyDocumentTranslations } from '../i18n';

jest.mock('../solidSession', () => ({ session: { info: { isLoggedIn: true, webId: 'https://pod.example/bob/profile/card#me' }, fetch: jest.fn() } }));
jest.mock('../accessRequestState', () => ({ readAccessRequestState: jest.fn() }));
jest.mock('@inrupt/solid-client', () => ({ getSolidDataset: async () => ({}), getThing: () => null, getThingAll: () => [] }));
jest.mock('./RDFGraph', () => () => null);
jest.mock('./RequestDatasetModal', () => () => <div data-testid="request-form" />);
jest.mock('./RequestSuccessModal', () => () => null);
const dataset = { identifier: 'weather', title: 'Weather', webid: 'https://pod.example/alice/profile/card#me',
 is_public: false, access_url_dataset: 'https://pod.example/alice/weather.csv' };
let host, root;
const button = () => host.querySelector('.dataset-detail-request-button');
const form = () => document.querySelector('[data-testid="request-form"]');
const render = async (language = 'en') => act(async () => root.render(<I18nProvider language={language}>
 <DatasetDetailModal dataset={dataset} sessionWebId={session.info.webId} presentation="inline" onClose={() => {}} />
 </I18nProvider>));
beforeEach(() => {
 session.info = { isLoggedIn: true, webId: 'https://pod.example/bob/profile/card#me' };
 global.IS_REACT_ACT_ENVIRONMENT = true;
 host = document.createElement('div');document.body.append(host);root = createRoot(host);
 readAccessRequestState.mockReset().mockResolvedValue({status:'pending'});
 session.fetch.mockReset().mockResolvedValue({ok:false,status:403});
});
afterEach(() => { act(() => root.unmount());host.remove(); });

test.each(['en','de'])('pending action checks the existing request, stays disabled while checking and never opens another form (%s)', async language => {
 await render(language);applyDocumentTranslations(language,host);
 expect(button().disabled).toBe(false);
 expect(button().textContent).toBe(language === 'de' ? 'Anfrage ausstehend' : 'Request Pending');
 expect(host.querySelector('.dataset-request-status button')).toBeNull();
 expect(host.textContent).not.toContain('Check request status');
 const message = document.getElementById(button().getAttribute('aria-describedby'));
 expect(message.textContent).toContain(language === 'de' ? 'Es wird keine neue Anfrage gesendet.' : 'No new request will be sent.');
 let finish;readAccessRequestState.mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
 await act(async () => button().click());applyDocumentTranslations(language,host);
 expect(button().disabled).toBe(true);expect(button().getAttribute('aria-busy')).toBe('true');
 expect(button().textContent).toBe(language === 'de' ? 'Anfragestatus wird geprüft...' : 'Checking request status...');
 expect(form()).toBeNull();expect(readAccessRequestState).toHaveBeenCalledTimes(2);
 await act(async () => finish({status:'pending'}));
 expect(button().disabled).toBe(false);expect(form()).toBeNull();
 expect(session.fetch.mock.calls.every(([,init]) => init.method === 'HEAD')).toBe(true);
});

test('a confirmed grant removes the request action and enables download after checking', async () => {
 await render();
 readAccessRequestState.mockResolvedValue({status:'approved'});session.fetch.mockResolvedValue({ok:true,status:200});
 await act(async () => button().click());
 expect(button()).toBeNull();expect(host.querySelector('.detail-file-row button').disabled).toBe(false);
 expect(host.querySelector('.catalog-detail-access .catalog-access--available')).not.toBeNull();
 expect(host.querySelector('.dataset-request-status').textContent).toBe('Request approved');
 expect(form()).toBeNull();
});

test('opening and returning to the window still check automatically', async () => {
 await render();expect(readAccessRequestState).toHaveBeenCalledTimes(1);
 await act(async () => window.dispatchEvent(new Event('focus')));
 expect(readAccessRequestState).toHaveBeenCalledTimes(2);expect(form()).toBeNull();
 expect(button().textContent).toBe('Request Pending');
});

test.each(['denied','revoked','expired','archived'])('%s allows an explicit new request after checking', async status => {
 await render();readAccessRequestState.mockResolvedValue({status});
 await act(async () => button().click());
 expect(button().textContent).toBe('Request again');expect(form()).toBeNull();
 await act(async () => button().click());expect(form()).not.toBeNull();
});

test('without an existing request the same action opens the request form', async () => {
 readAccessRequestState.mockResolvedValue({status:'none'});await render();
 expect(host.querySelector('.dataset-request-status')).toBeNull();
 expect(button().textContent).toBe('Request Dataset');
 await act(async () => button().click());expect(form()).not.toBeNull();
});

test('a failed status check shows uncertainty without submitting or opening another request', async () => {
 await render();readAccessRequestState.mockResolvedValue({status:'unknown'});
 await act(async () => button().click());
 expect(host.querySelector('.dataset-request-status').textContent).toBe('Request status could not be confirmed.');
 expect(form()).toBeNull();expect(session.fetch.mock.calls.every(([,init]) => init.method === 'HEAD')).toBe(true);
});

test.each(['en','de'])('guests see restricted data and can sign in without creating an access request (%s)', async language => {
 session.info = { isLoggedIn: false, webId: null };
 const onLogin = jest.fn();
 await act(async () => root.render(<I18nProvider language={language}><DatasetDetailModal
  dataset={dataset} sessionWebId={null} onLogin={onLogin} presentation="inline" onClose={() => {}} />
 </I18nProvider>));
 applyDocumentTranslations(language,host);
 expect(host.querySelector('.catalog-access--restricted')).not.toBeNull();
 expect(host.querySelector('.detail-file-row button').disabled).toBe(true);
 expect(button().textContent).toBe(language === 'de' ? 'Anmelden, um Zugriff anzufragen' : 'Sign in to request access');
 await act(async () => button().click());
 expect(onLogin).toHaveBeenCalledTimes(1);
 expect(readAccessRequestState).not.toHaveBeenCalled();
 expect(session.fetch).not.toHaveBeenCalled();
 expect(form()).toBeNull();
});

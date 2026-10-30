/** @jest-environment node */
import { createCatalogAccess } from './catalogAccess';
const bob = 'https://pod.example/bob/profile/card#me';
const alice = 'https://pod.example/alice/profile/card#me';
const dataset = { identifier: 'example', webid: alice, access_url_dataset: 'https://pod.example/alice/private.csv' };
const flush = () => new Promise(resolve => setImmediate(resolve));
const response = status => ({ status, ok: status >= 200 && status < 300, text: () => { throw Error('Must never download data'); } });
let session, store, clock;
beforeEach(() => { clock = 1000; session = { info: { webId: bob, isLoggedIn: true }, fetch: jest.fn(async () => response(200)) }; store = createCatalogAccess({ session, webId: bob, now: () => clock }); });
afterEach(() => store.dispose());
test('a real HEAD grant is shared and cached without reading file contents or ACLs', async () => {
 const one = store.check(dataset), two = store.check(dataset);
 expect(one).toBe(two); expect(store.state(dataset)).toBe('checking');
 expect(await one).toBe('available'); expect(store.state(dataset)).toBe('available');
 await store.check(dataset); expect(session.fetch).toHaveBeenCalledTimes(1);
 expect(session.fetch).toHaveBeenCalledWith(dataset.access_url_dataset, expect.objectContaining({ method:'HEAD', cache:'no-store', redirect:'error' }));
});
test.each([401,404,405,500,503])('%s remains unknown rather than reporting revoked permission', async status => {
 session.fetch.mockResolvedValue(response(status)); expect(await store.check(dataset)).toBe('unknown'); expect(store.state(dataset)).toBe('unknown');
});
test('network failure stays unknown and a confirmed 403 removes a previous grant', async () => {
 await store.check(dataset); session.fetch.mockRejectedValueOnce(Error('offline'));
 expect(await store.check(dataset, undefined, {force:true})).toBe('unknown');
 session.fetch.mockResolvedValue(response(403)); expect(await store.check(dataset,undefined,{force:true})).toBe('restricted');
});
test('refresh and expiry detect changed access without granting it from metadata', async () => {
 await store.check(dataset); session.fetch.mockResolvedValue(response(403)); clock += 60001;
 await store.check(dataset); expect(store.state(dataset)).toBe('restricted');
 session.fetch.mockResolvedValue(response(200)); store.refresh(); await flush();
 expect(store.state(dataset)).toBe('available'); expect(session.fetch).toHaveBeenCalledTimes(3);
});
test('a readable model does not establish access to the data file', async () => {
 session.fetch.mockImplementation(async url => response(url.endsWith('model.ttl') ? 200 : 403));
 await store.check(dataset,'https://pod.example/alice/model.ttl'); await store.check(dataset);
 expect(store.state(dataset)).toBe('restricted'); expect(store.state(dataset,'https://pod.example/alice/model.ttl')).toBe('available');
});
test('requests are bounded, deduplicated and prioritize visible queued rows', async () => {
 store.dispose(); store=createCatalogAccess({session,webId:bob,concurrency:1});
 const finish=[];session.fetch.mockImplementation(()=>new Promise(resolve=>finish.push(resolve)));
 const rows=[0,1,2].map(i=>({...dataset,access_url_dataset:`https://pod.example/alice/${i}.csv`}));
 const pending=rows.map(row=>store.check(row)); store.check(rows[2],undefined,{priority:true}); await flush();
 expect(session.fetch).toHaveBeenCalledTimes(1); finish.shift()(response(200));await flush();
 expect(session.fetch.mock.calls[1][0]).toBe(rows[2].access_url_dataset);finish.shift()(response(200));await flush();
 expect(session.fetch.mock.calls[2][0]).toBe(rows[1].access_url_dataset);finish.shift()(response(403));await Promise.all(pending);
});
test('old account results cannot become grants for a new session', async () => {
 let finish;session.fetch.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 const pending=store.check(dataset);await flush();session.info.webId='https://pod.example/eve#me';finish(response(200));
 expect(await pending).toBe('unknown');expect(store.state(dataset)).toBe('unknown');
 await store.check(dataset);expect(session.fetch).toHaveBeenCalledTimes(1);
});
test('external endpoints are not authenticated-probed, and URL identity separates datasets', async () => {
 expect(await store.check({...dataset,access_url_dataset:'https://outside.example/api'})).toBe('unknown');
 expect(session.fetch).not.toHaveBeenCalled();await store.check(dataset);
 const second={...dataset,access_url_dataset:'https://pod.example/alice/other.csv'};
 session.fetch.mockResolvedValue(response(403));await store.check(second);expect(store.state(dataset)).toBe('available');expect(store.state(second)).toBe('restricted');
});
test('a stalled server times out and releases the queue', async () => {
 store.dispose();store=createCatalogAccess({session,webId:bob,concurrency:1,timeout:15});
 session.fetch.mockImplementationOnce(()=>new Promise(()=>{})).mockResolvedValue(response(200));
 const first=store.check(dataset),second=store.check({...dataset,access_url_dataset:'https://pod.example/alice/next.csv'});
 expect(await first).toBe('unknown');expect(await second).toBe('available');
});

test('disposing a catalog settles in-flight and queued checks without waiting for the server', async () => {
 store.dispose();store=createCatalogAccess({session,webId:bob,concurrency:1});
 session.fetch.mockImplementation(()=>new Promise(()=>{}));
 const first=store.check(dataset),second=store.check({...dataset,access_url_dataset:'https://pod.example/alice/next.csv'});
 await flush();store.dispose();expect(await first).toBe('unknown');expect(await second).toBe('unknown');
 expect(store.state(dataset)).toBe('unknown');expect(session.fetch).toHaveBeenCalledTimes(1);
});

test('status renders during a long background batch do not restart earlier failed probes', async () => {
 session.fetch.mockResolvedValue(response(503));
 await store.check(dataset, undefined, {onlyIfUnseen:true});
 clock += 120000;
 await store.check(dataset, undefined, {onlyIfUnseen:true});
 expect(session.fetch).toHaveBeenCalledTimes(1);
 session.fetch.mockResolvedValue(response(200));store.refresh();await flush();
 expect(session.fetch).toHaveBeenCalledTimes(2);expect(store.state(dataset)).toBe('available');
});

import { anonymousCatalogFetch, fetchCatalogResource } from './catalogFetch';
import { downloadCatalogResource } from './catalogActions';

afterEach(() => jest.restoreAllMocks());
test('anonymous reads explicitly omit cookies even if the caller requests them', async () => {
 global.fetch = jest.fn().mockResolvedValue({ok:true});
 await anonymousCatalogFetch('https://pod.example/public/data.csv', {credentials:'include'});
 expect(global.fetch).toHaveBeenCalledWith('https://pod.example/public/data.csv', {credentials:'omit'});
});
test('a stale WebID without an active login never uses the authenticated fetch', async () => {
 const session = { info: { isLoggedIn:false, webId:'https://pod.example/profile/card#me' }, fetch:jest.fn() };
 global.fetch = jest.fn().mockResolvedValue({ok:false,status:401});
 const result = await fetchCatalogResource(session, 'https://pod.example/private.csv');
 expect(result.status).toBe(401);
 expect(session.fetch).not.toHaveBeenCalled();
 expect(global.fetch).toHaveBeenCalledWith('https://pod.example/private.csv', {credentials:'omit'});
});
test('public downloads work without a session and protected responses never become downloads', async () => {
 const click=jest.fn(), createObjectURL=jest.fn(()=>'blob:test'), trackEvent=jest.fn(), openLink=jest.fn();
 const browser={document:{createElement:()=>({click})},URL:{createObjectURL,revokeObjectURL:jest.fn()}};
 global.fetch=jest.fn().mockResolvedValueOnce({ok:true,blob:async()=>new Blob(['value\n1'])}).mockResolvedValueOnce({ok:false,status:401});
 const options={session:null,resourceUrl:'https://pod.example/data.csv',browser,trackEvent,openLink};
 expect(await downloadCatalogResource(options)).toBe(true);
 jest.spyOn(console,'error').mockImplementation(()=>{});
 expect(await downloadCatalogResource(options)).toBe(false);
 expect(click).toHaveBeenCalledTimes(1);
 expect(trackEvent).toHaveBeenCalledTimes(1);
});

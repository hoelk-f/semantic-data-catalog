/** @jest-environment node */
import { resolveRequestState, readAccessRequestState } from './accessRequestState';
const webId='https://pod.example/bob/profile/card#me';
const dataset={datasetUrl:'https://pod.example/alice/catalog/ds/trees.ttl#it',webid:'https://pod.example/alice/profile/card#me',access_url_dataset:'https://pod.example/alice/trees.csv',identifier:'trees'};
const base={requesterWebId:webId,ownerWebId:dataset.webid,datasetUrl:dataset.datasetUrl,dataUrl:dataset.access_url_dataset};
const receipt={...base,requestId:'one',createdAt:'2026-10-29T12:00:00Z',status:'sent'};
const reply=status=>({...base,requestId:'one',decidedBy:dataset.webid,decidedAt:'2026-10-29T12:10:00Z',status});
const state=options=>resolveRequestState({webId,dataset,...options});
test('persisted receipts work without browser storage',()=>expect(state({receipts:[receipt]}).status).toBe('pending'));
test.each(['approved','denied','revoked','expired','archived'])('a confirmed %s decision replaces pending',status=>expect(state({receipts:[receipt],decisions:[reply(status)],legacyPending:true}).status).toBe(status));
test('revocation wins over approval regardless of delivery order',()=>expect(state({receipts:[receipt],decisions:[{...reply('revoked'),decidedAt:'2026-10-29T12:20:00Z'},reply('approved')]}).status).toBe('revoked'));
test('a late decision for the old request never completes a new request',()=>expect(state({receipts:[receipt,{...receipt,requestId:'two',createdAt:'2026-10-29T12:30:00Z'}],decisions:[{...reply('revoked'),decidedAt:'2026-10-29T12:40:00Z'}]}).status).toBe('pending'));
test.each([{requesterWebId:'https://pod.example/eve#me'},{datasetUrl:'https://pod.example/other/catalog/trees.ttl#it'},{decidedBy:'https://pod.example/eve#me'},{requestId:'other'}])('unrelated decisions do not resolve the request: %p',overrides=>expect(state({receipts:[receipt],decisions:[{...reply('revoked'),...overrides}]}).status).toBe('pending'));
test('legacy replies match the exact resource URL, never just a display identifier',()=>{
 const legacy={requesterWebId:webId,dataUrl:dataset.access_url_dataset,status:'revoked',decidedAt:'2026-10-29T12:10:00Z'};
 expect(state({legacyPending:true,decisions:[legacy]}).status).toBe('revoked');
 expect(state({legacyPending:true,decisions:[{...legacy,dataUrl:'https://other.example/trees.csv'}]}).status).toBe('unknown');
});
test('legacy markers and incomplete delivery never become a permanent pending lock',()=>{
 expect(state({legacyPending:true}).status).toBe('unknown');
 expect(state({receipts:[{...receipt,status:'sending'}]}).status).toBe('unknown');
 expect(state({receipts:[{...receipt,status:'failed'}]}).status).toBe('none');
 expect(state({receipts:[receipt],decisions:[reply('revoked')],complete:false}).status).toBe('unknown');
});
test('a network error yields unknown without removing legacy state or logging out',async()=>{
 const storage={getItem:()=> 'pending',removeItem:jest.fn()},session={info:{webId},fetch:jest.fn(async()=>{throw Error('network')})};
 expect((await readAccessRequestState({session,dataset,storage})).status).toBe('unknown');expect(storage.removeItem).not.toHaveBeenCalled();
});

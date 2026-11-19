import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import useCatalogDatasets from './useCatalogDatasets';
import { loadAggregatedDatasets } from './solidCatalog';
jest.mock('./solidCatalog', () => ({ loadAggregatedDatasets: jest.fn() }));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host=document.createElement('div'); document.body.append(host); root=createRoot(host);
  loadAggregatedDatasets.mockReset();
});
afterEach(() => { act(()=>root.unmount());host.remove(); });
const session={info:{webId:'https://pod.example/alice#me',isLoggedIn:true},fetch:jest.fn()};
function Probe({ registry, webId=session.info.webId, loggedIn=true, view="registry" }) {
  const result=useCatalogDatasets(session,webId,loggedIn,registry,view);
  return <div>{JSON.stringify({loading:result.loading,datasets:result.datasets.map(dataset=>dataset.identifier)})}</div>;
}
test('late results from the previous registry never appear after switching', async () => {
  let resolveA,resolveB;
  loadAggregatedDatasets.mockImplementation((_session,_fetch,options)=>new Promise(resolve=>{
    if (options.registryUrl==='https://registry.example/a/') resolveA=resolve; else resolveB=resolve;
  }));
  await act(async()=>root.render(<Probe registry="https://registry.example/a/"/>));
  await act(async()=>root.render(<Probe registry="https://registry.example/b/"/>));
  await act(async()=>resolveA({datasets:[{identifier:'a'}]}));
  expect(JSON.parse(host.textContent)).toEqual({loading:true,datasets:[]});
  await act(async()=>resolveB({datasets:[{identifier:'b'}]}));
  expect(JSON.parse(host.textContent)).toEqual({loading:false,datasets:['b']});
  expect(loadAggregatedDatasets.mock.calls.map(call=>call[2].registryUrl)).toEqual(['https://registry.example/a/','https://registry.example/b/']);
  expect(loadAggregatedDatasets.mock.calls.some(call=>call[2].requireEnrollment)).toBe(false);
});
test('no registry or mismatched login never loads another account catalog',async()=>{
  await act(async()=>root.render(<Probe registry=""/>));
  expect(loadAggregatedDatasets).not.toHaveBeenCalled();
  await act(async()=>root.render(<Probe registry="https://registry.example/a/" webId="https://pod.example/bob#me"/>));
  expect(loadAggregatedDatasets).not.toHaveBeenCalled();
  expect(JSON.parse(host.textContent).datasets).toEqual([]);
});

test('logging out clears protected metadata immediately and ignores a late authenticated load', async () => {
  let completePrivate, completePublic;
  loadAggregatedDatasets.mockImplementation((readSession) => new Promise(resolve => {
    if (readSession) completePrivate=resolve; else completePublic=resolve;
  }));
  await act(async()=>root.render(<Probe registry="https://registry.example/a/"/>));
  await act(async()=>root.render(<Probe registry="https://registry.example/a/" loggedIn={false} webId={null}/>));
  await act(async()=>completePrivate({datasets:[{identifier:'secret-metadata'}]}));
  expect(JSON.parse(host.textContent)).toEqual({loading:true,datasets:[]});
  await act(async()=>completePublic({datasets:[{identifier:'public-metadata'}]}));
  expect(JSON.parse(host.textContent)).toEqual({loading:false,datasets:['public-metadata']});
  expect(loadAggregatedDatasets.mock.calls[1][0]).toBeNull();
});


test('personal mode requires login and never uses a public cache or registry', async () => {
  loadAggregatedDatasets.mockResolvedValue({datasets:[]});
  await act(async()=>root.render(<Probe registry="" view="personal" loggedIn={false} webId={null}/>));
  expect(loadAggregatedDatasets).not.toHaveBeenCalled();
  await act(async()=>root.render(<Probe registry="" view="personal"/>));
  expect(loadAggregatedDatasets).toHaveBeenCalledWith(session,null,expect.objectContaining({personalOnly:true,usePublicCache:false}));
  expect(loadAggregatedDatasets.mock.calls[0][2].registryUrl).toBeUndefined();
});

test('switching to personal mode immediately clears registry rows and rejects their late response', async () => {
  let completeRegistry,completePersonal;
  loadAggregatedDatasets.mockImplementation((_s,_f,o)=>new Promise(resolve=>{
    if(o.personalOnly)completePersonal=resolve;else completeRegistry=resolve;
  }));
  await act(async()=>root.render(<Probe registry="https://registry.example/a/"/>));
  await act(async()=>root.render(<Probe registry="https://registry.example/a/" view="personal"/>));
  await act(async()=>completeRegistry({datasets:[{identifier:'other-pod'}]}));
  expect(JSON.parse(host.textContent)).toEqual({loading:true,datasets:[]});
  await act(async()=>completePersonal({datasets:[{identifier:'own-pod'}]}));
  expect(JSON.parse(host.textContent).datasets).toEqual(['own-pod']);
  await act(async()=>root.render(<Probe registry="https://registry.example/a/" view="personal" loggedIn={false} webId={null}/>));
  expect(JSON.parse(host.textContent).datasets).toEqual([]);
  expect(loadAggregatedDatasets).toHaveBeenCalledTimes(2);
});

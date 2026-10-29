jest.mock("@inrupt/solid-client", () => {
  const actual = jest.requireActual("@inrupt/solid-client");
  return {
    ...actual,
    // These tests exercise metadata locations/concurrency. ACL transport has
    // its own integration tests; represent an owned, writable metadata ACL here.
    getResourceInfoWithAcl: async url => {
      const resource = { internal_resourceInfo: { sourceIri: url, aclUrl: url + ".acl" } };
      return { ...resource, internal_acl: { resourceAcl: actual.createAcl(resource), fallbackAcl: null } };
    },
    saveAclFor: jest.fn(async (_resource, acl) => acl),
  };
});

/** @jest-environment node */
import { Parser, Store, Writer, DataFactory } from 'n3';
import { saveDataService, removeDataService, loadCatalogDatasets } from './solidCatalog';
import { SERVICE_PROFILE } from './apiService';
const root='https://pod.example/alice/',cat=root+'catalog/cat.ttl',doc=root+'catalog/ds/api.ttl',data=root+'private/data.json';
const prefix='@prefix dcat:<http://www.w3.org/ns/dcat#>. @prefix dct:<http://purl.org/dc/terms/>. @prefix foaf:<http://xmlns.com/foaf/0.1/>. ';
const input={identifier:'api',title:'Public query',description:'Read-only query',publisher:'Alice',endpointURL:'https://api.example/v1',authentication:'public',servesDataset:[root+'catalog/ds/legacy.ttl#it']};
function server(){
 const files=new Map([[cat,prefix+`<#it> a dcat:Catalog; dcat:dataset <ds/legacy.ttl#it>; dct:license <https://example.org/license>.`],[data,'untouched']]);const calls=[];
 const fetch=async(url,options={})=>{
  const method=options.method||'GET';calls.push({url,method,options});let status=200,body=files.get(url)||'',headers={'Content-Type':'text/turtle',ETag:'"v1"'};
  if(method==='GET'||method==='HEAD')status=files.has(url)?200:404;
  else if(method==='POST') {const target=url+options.headers.Slug;expect(files.has(target)).toBe(false);files.set(target,options.body);status=201;headers.Location=target;}
  else if(method==='PATCH'){
   const graph=new Store(new Parser({baseIRI:url}).parse(files.get(url)));const patch=new Parser({baseIRI:url,format:'N3'}).parse(options.body);
   for(const [operation,action]of [['deletes','removeQuads'],['inserts','addQuads']]){const op=patch.find(q=>q.predicate.value==='http://www.w3.org/ns/solid/terms#'+operation);if(op)graph[action](patch.filter(q=>q.graph.equals(op.object)).map(q=>DataFactory.quad(q.subject,q.predicate,q.object)));}
   files.set(url,new Writer({format:'N-Triples'}).quadsToString(graph.getQuads(null,null,null,null)));status=204;body=null;
  }else throw Error('Unexpected mutation '+method+' '+url);
  const response=new Response(body,{status,headers});Object.defineProperty(response,'url',{value:url});return response;
 };
 return {files,calls,session:{info:{webId:root+'profile/card#me'},fetch}};
}
test('API create, edit and unlink preserve legacy datasets, source data and existing access rules',async()=>{
 const s=server(),warn=jest.spyOn(console,'warn').mockImplementation(()=>{});
 try{
  const created=await saveDataService(s.session,input);expect(created.datasetUrl).toBe(doc+'#it');expect(s.files.get(doc)).toContain(SERVICE_PROFILE);
  expect(s.files.get(cat)).toContain('legacy.ttl#it');expect(s.files.get(cat)).toContain('https://example.org/license');expect(s.files.get(cat)).toContain('dcat#service');
  const callsBefore=s.calls.length;
  await saveDataService(s.session,{...input,datasetUrl:created.datasetUrl,title:'Changed API'});
  expect(s.files.get(doc)).toContain('Changed API');expect(s.calls.slice(callsBefore).some(c=>c.url.endsWith('.acl'))).toBe(false);
  const before=s.files.get(doc);await removeDataService(s.session,created);expect(s.files.get(doc)).toBe(before);expect(s.files.get(cat)).not.toContain('dcat#service');expect(s.files.get(cat)).toContain('legacy.ttl#it');expect(s.files.get(data)).toBe('untouched');
  expect(s.calls.filter(c=>!['GET','HEAD'].includes(c.method)).every(c=>[cat,doc,root+'catalog/ds/'].includes(c.url))).toBe(true);
 }finally{warn.mockRestore();}
});
test('invalid or foreign API metadata is rejected before writing',async()=>{
 const s=server();await expect(saveDataService(s.session,{...input,endpointURL:'https://api.example/?token=secret'})).rejects.toThrow('HTTPS');
 await expect(removeDataService(s.session,{datasetUrl:root+'catalog/ds/../../private/data.json#it'})).rejects.toThrow('your catalog');
 expect(s.calls).toEqual([]);
});
test('record-only API discovery reads metadata without invoking the endpoint',async()=>{
 const s=server();s.files.set(cat,prefix+'<#it> a dcat:Catalog;dcat:record <ds/api.ttl>.');s.files.set(doc,prefix+'<> a dcat:CatalogRecord;foaf:primaryTopic <#it>.<#it> a dcat:DataService;dct:title "API";dcat:endpointURL <https://api.example/v1>.');
 const items=await loadCatalogDatasets(cat+'#it',s.session.fetch);expect(items).toHaveLength(1);expect(items[0].datasetType).toBe('service');expect(s.calls.every(c=>c.method==='GET'&&!c.url.startsWith('https://api.example/'))).toBe(true);
});

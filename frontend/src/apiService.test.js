import {createSolidDataset,createThing,setThing,setUrl,setStringNoLocale,addUrl} from '@inrupt/solid-client';
import {safeServiceUrl,SERVICE_PROFILE,SERVICE_AUTH,normalizeServiceInput} from './apiService';
import {assertProfileRecord} from './profileValidation';
import {parseDatasetFromDoc} from './solidCatalog';

const doc='https://pod.example/alice/catalog/ds/api.ttl';
const turtle=`@prefix dcat:<http://www.w3.org/ns/dcat#>. @prefix dct:<http://purl.org/dc/terms/>. @prefix foaf:<http://xmlns.com/foaf/0.1/>. <> a dcat:CatalogRecord;foaf:primaryTopic <#it>;dct:conformsTo <${SERVICE_PROFILE}>. <#it> a dcat:DataService;dct:title "API";dct:description "Public weather data";dct:publisher "Alice";dcat:endpointURL <https://api.example/v1>; <${SERVICE_AUTH}> "public".`;
test('versioned service records do not need a fake distribution or download URL',async()=>{
 await expect(assertProfileRecord({url:doc,turtle})).resolves.toMatchObject({datasetUrl:doc+'#it'});
 await expect(assertProfileRecord({url:doc,turtle:turtle.replace(SERVICE_PROFILE,'https://wrong.example/profile')})).rejects.toThrow(/declare/);
 await expect(assertProfileRecord({url:doc,turtle:turtle.replace('https://api.example/v1','https://api.example/v1?token=secret')})).rejects.toThrow(/credentials/);
});
test('URLs cannot publish credentials; API documentation remains optional',()=>{
 for(const value of ['http://api.example','https://name:secret@api.example','javascript:alert(1)','https://api.example?api_key=secret','https://api.example?access_token=secret'])expect(safeServiceUrl(value)).toBe('');
 expect(normalizeServiceInput({title:'API',description:'Values',publisher:'Alice',endpointURL:'https://api.example/v1'}).endpointDescription).toBe('');
});
test('discovery distinguishes services from datasets and preserves service properties',()=>{
 let api=createThing({url:doc+'#it'});api=addUrl(api,'http://www.w3.org/1999/02/22-rdf-syntax-ns#type','http://www.w3.org/ns/dcat#DataService');api=setStringNoLocale(api,'http://purl.org/dc/terms/title','Weather API');api=setUrl(api,'http://www.w3.org/ns/dcat#endpointURL','https://api.example/v1');api=setStringNoLocale(api,SERVICE_AUTH,'api-key');
 const parsed=parseDatasetFromDoc(setThing(createSolidDataset(),api),doc+'#it');expect(parsed.datasetType).toBe('service');expect(parsed.endpointURL).toBe('https://api.example/v1');expect(parsed.authentication).toBe('api-key');expect(parsed.distributions).toEqual([]);
});

export const DATA_SERVICE = 'http://www.w3.org/ns/dcat#DataService';
export const SERVICE_LINK = 'http://www.w3.org/ns/dcat#service';
export const SERVICE_PROFILE = 'https://github.com/hoelk-f/semantic-data-catalog/blob/main/docs/data-service-profile-v1.md';
export const SERVICE_AUTH = 'https://w3id.org/solid-dataspace/catalog-api#authentication';
export const AUTH_MODES = ['public', 'api-key', 'oauth2', 'solid-oidc'];

// Descriptions are public metadata, never a credential store.
export function safeServiceUrl(value,{fragment=false}={}) {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||(!fragment&&url.hash))return '';
    if([...url.searchParams.keys()].some(key=>/(?:^|[-_])(token|key|secret|password|signature|authorization)(?:$|[-_])/i.test(key)||/^(apikey|accesskey|auth)$/i.test(key)))return '';
    return url.href;
  }catch{return '';}
}

export function normalizeServiceInput(input){
  const title=String(input.title||'').trim(),description=String(input.description||'').trim(),publisher=String(input.publisher||'').trim();
  if(!title||title.length>200||!description||description.length>5000||!publisher||publisher.length>200)throw new Error('Provide a title, description and publisher.');
  const endpointURL=safeServiceUrl(input.endpointURL);
  if(!endpointURL)throw new Error('Use an HTTPS endpoint without credentials or secret query parameters.');
  const endpointDescription=input.endpointDescription?safeServiceUrl(input.endpointDescription,{fragment:true}):'';
  if(input.endpointDescription&&!endpointDescription)throw new Error('Use an HTTPS documentation URL without credentials.');
  const authentication=input.authentication||'public';
  if(!AUTH_MODES.includes(authentication))throw new Error('Unsupported authentication method.');
  const servesDataset=input.servesDataset||[];
  if(!Array.isArray(servesDataset)||servesDataset.length>64||servesDataset.some(u=>!safeServiceUrl(u,{fragment:true})))throw new Error('Linked datasets must have HTTPS metadata identifiers.');
  return {...input,title,description,publisher,endpointURL,endpointDescription,authentication,servesDataset:[...new Set(servesDataset)]};
}

export function validateServiceRecord(store,url,topic){
  const DCAT='http://www.w3.org/ns/dcat#',DCT='http://purl.org/dc/terms/',TYPE='http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  const values=(s,p)=>store.getObjects(s,p,null);
  const one=(p,optional=false)=>{const v=values(topic,p);if(optional&&!v.length)return '';if(v.length!==1)throw new Error('API properties must have exactly one value.');return v[0].value;};
  if(!values(url,DCT+'conformsTo').some(t=>t.termType==='NamedNode'&&t.value===SERVICE_PROFILE))throw new Error('API records must declare the versioned Data Service profile.');
  if(store.getSubjects(TYPE,DATA_SERVICE,null).length!==1||store.getSubjects(TYPE,DCAT+'Dataset',null).length||store.getSubjects(TYPE,DCAT+'DatasetSeries',null).length)throw new Error('An API record describes exactly one DataService.');
  for(const p of [DCAT+'endpointURL',DCAT+'endpointDescription',DCAT+'servesDataset'])if(values(topic,p).some(t=>t.termType!=='NamedNode'))throw new Error('API links must be IRIs.');
  normalizeServiceInput({title:one(DCT+'title'),description:one(DCT+'description'),publisher:one(DCT+'publisher'),endpointURL:one(DCAT+'endpointURL'),endpointDescription:one(DCAT+'endpointDescription',true),authentication:one(SERVICE_AUTH),servesDataset:values(topic,DCAT+'servesDataset').map(t=>t.value)});
  if(store.getSubjects(TYPE,DCAT+'Distribution',null).length||values(topic,DCAT+'distribution').length)throw new Error('Data services link datasets through servesDataset.');
  return {store,topic,dependencies:[]};
}

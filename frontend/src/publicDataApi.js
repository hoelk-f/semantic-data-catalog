import { resolveCatalogRegistry } from './catalogRegistries';

export const publicDataBase = () => '/sync-worker/public-data/v1';
export function publicDataUrl(path,params={}) {
  const url=new URL(publicDataBase()+path,window.location.origin);
  url.searchParams.set('registry',resolveCatalogRegistry().url);
  Object.entries(params).forEach(([key,value])=>{if(value!==''&&value!==undefined&&value!==null)url.searchParams.set(key,value);});
  return url.href;
}
export async function readPublicData(url,{signal}={}){
  const target=new URL(url,window.location.origin);
  if(target.origin!==window.location.origin||!target.pathname.startsWith(publicDataBase()+'/'))throw new Error('Use the local public data API.');
  const response=await fetch(target.href,{signal,credentials:'omit',redirect:'error',headers:{Accept:'application/json'}});
  const declared=Number(response.headers.get('content-length'));if(declared>4*1024*1024)throw new Error('Response is too large.');
  const reader=response.body?.getReader();let text='';
  if(reader){let bytes=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>4*1024*1024){await reader.cancel();throw new Error('Response is too large.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}
  else text=await response.text();
  let result;try{result=JSON.parse(text);}catch{throw new Error('The public data API is currently unavailable.');}
  if(!response.ok)throw new Error(result.error||'The public data API is currently unavailable.');
  return result;
}

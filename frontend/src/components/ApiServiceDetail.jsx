import React,{useState} from 'react';
import {useI18n} from '../i18n';
import {safeServiceUrl} from '../apiService';
import {session} from '../solidSession';
import {removeDataService} from '../solidCatalog';
import './ApiService.css';

export default function ApiServiceDetail({service,datasets,onClose,onEdit,onChanged}){
  const {t}=useI18n();const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
  const endpoint=safeServiceUrl(service.endpointURL),docs=safeServiceUrl(service.endpointDescription,{fragment:true});
  const owned=Boolean(session.info.isLoggedIn&&session.info.webId&&service.webid===session.info.webId);
  const remove=async()=>{setBusy(true);setError('');try{await removeDataService(session,service);await onChanged?.();onClose();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="api-service-form" translate="no"><div className="api-service-heading"><div><span className="catalog-tag">API</span><h2>{service.title}</h2></div><button className="catalog-icon-button" onClick={onClose} aria-label={t('Close')}>×</button></div>
    <p>{service.description}</p><dl><dt>{t('Publisher')}</dt><dd>{service.publisher}</dd><dt>{t('Authentication')}</dt><dd>{t(({public:'Public','api-key':'API key required',oauth2:'OAuth 2.0','solid-oidc':'Solid login required'})[service.authentication]||'See API documentation')}</dd><dt>{t('API endpoint')}</dt><dd><code>{endpoint||t('Invalid API endpoint')}</code></dd></dl>
    <div className="api-service-actions">{endpoint&&<button className="catalog-button" onClick={async()=>{try{await navigator.clipboard.writeText(endpoint);setCopied(true);}catch{setError('Copy the address shown above.');}}}>{t(copied?'Copied':'Copy API URL')}</button>}{docs&&<a className="catalog-button catalog-button--primary" href={docs} target="_blank" rel="noopener noreferrer">{t('Open API documentation')}</a>}</div>
    <h3>{t('Linked datasets')}</h3><ul>{(service.servesDataset||[]).map(url=><li key={url}>{datasets.find(d=>d.datasetUrl===url)?.title||url}</li>)}</ul>
    {endpoint&&<><h3>{t('Example request')}</h3><pre>{`curl --get '${endpoint.replace(/'/g,"'\\''")}' \\\n  --header 'Accept: application/json'`}</pre><p>{t('Parameters and required credentials are described in the API documentation.')}</p></>}
    {error&&<p role="alert" className="api-service-error">{t(error)}</p>}
    {owned&&<div className="api-service-actions"><button className="catalog-button" onClick={onEdit}>{t('Edit API')}</button><button className="catalog-button" onClick={()=>setConfirm(true)}>{t('Remove API from catalog')}</button></div>}
    {confirm&&<div role="group" aria-label={t('Remove API from catalog')}><p>{t('Only the catalog links are removed. The API, metadata document and data remain unchanged.')}</p><button className="catalog-button" disabled={busy} onClick={()=>setConfirm(false)}>{t('Cancel')}</button><button className="catalog-button" disabled={busy} onClick={remove}>{t('Confirm removal')}</button></div>}
  </div>;
}

import React,{useState} from 'react';
import CatalogModal from './CatalogModal';
import {useI18n} from '../i18n';
import {session} from '../solidSession';
import {saveDataService} from '../solidCatalog';
import {AUTH_MODES,normalizeServiceInput} from '../apiService';
import './ApiService.css';

export default function ApiServiceModal({initial={},datasets=[],onClose,onSaved}){
  const {t}=useI18n();const [form,setForm]=useState({title:'',description:'',publisher:'',endpointURL:'',endpointDescription:'',authentication:'public',servesDataset:[],...initial});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const change=(name,value)=>setForm(f=>({...f,[name]:value}));
  const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{const input=normalizeServiceInput(form);await saveDataService(session,input);await onSaved?.();onClose();}catch(e){setError(e.message);}finally{setBusy(false);}};
  const field=(name,label,type='text',required=false)=><label>{t(label)}{type==='textarea'?<textarea value={form[name]} required={required} maxLength={5000} rows={3} onChange={e=>change(name,e.target.value)}/>:<input type={type} value={form[name]} required={required} maxLength={type==='url'?2048:200} onChange={e=>change(name,e.target.value)}/>}</label>;
  return <CatalogModal label={t(initial.datasetUrl?'Edit API':'Add API')} onClose={busy?()=>{}:onClose} className="api-service-dialog"><form onSubmit={submit} className="api-service-form" translate="no">
    <div className="api-service-heading"><h2>{t(initial.datasetUrl?'Edit API':'Add API')}</h2><button type="button" className="catalog-icon-button" aria-label={t('Close')} disabled={busy} onClick={onClose}>×</button></div>
    <p>{t('Describe an existing API. The catalog does not import its data or change its access rights.')}</p>
    {field('title','Title','text',true)}{field('description','Description','textarea',true)}{field('publisher','Publisher','text',true)}{field('endpointURL','API endpoint','url',true)}{field('endpointDescription','API documentation URL','url')}
    <label>{t('Authentication')}<select value={form.authentication} onChange={e=>change('authentication',e.target.value)}>{AUTH_MODES.map(value=><option key={value} value={value}>{t(({public:'Public', 'api-key':'API key required',oauth2:'OAuth 2.0','solid-oidc':'Solid login required'})[value])}</option>)}</select></label>
    <fieldset><legend>{t('Linked datasets')}</legend><div className="api-service-datasets">{datasets.filter(d=>d.datasetType!=='service').map(d=><label className="api-service-check" key={d.datasetUrl}><input type="checkbox" checked={form.servesDataset.includes(d.datasetUrl)} onChange={e=>change('servesDataset',e.target.checked?[...form.servesDataset,d.datasetUrl]:form.servesDataset.filter(u=>u!==d.datasetUrl))}/><span>{d.title}</span></label>)}{!datasets.some(d=>d.datasetType!=='service')&&<p>{t('No datasets available to link.')}</p>}</div></fieldset>
    <p className="api-service-note">{t('API descriptions are public catalog metadata. Do not enter tokens, passwords or secret URLs.')}</p>
    {error&&<p role="alert" className="api-service-error">{t(error)}</p>}
    <div className="api-service-actions"><button type="button" className="catalog-button" disabled={busy} onClick={onClose}>{t('Cancel')}</button><button className="catalog-button catalog-button--primary" disabled={busy}>{t(busy?'Saving...':'Save API')}</button></div>
  </form></CatalogModal>;
}

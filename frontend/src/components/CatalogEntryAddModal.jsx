import React,{useState} from 'react';
import CatalogModal from './CatalogModal';
import DatasetAddModal from './DatasetAddModal';
import ApiServiceModal from './ApiServiceModal';
import {useI18n} from '../i18n';
import './ApiService.css';
export default function CatalogEntryAddModal({onClose,fetchDatasets,datasets}){
 const {t}=useI18n();const [kind,setKind]=useState('');
 if(kind==='dataset')return <DatasetAddModal onClose={onClose} fetchDatasets={fetchDatasets}/>;
 if(kind==='service')return <ApiServiceModal onClose={onClose} onSaved={fetchDatasets} datasets={datasets}/>;
 return <CatalogModal label={t('Add catalog entry')} onClose={onClose} className="api-service-dialog"><div className="api-service-form" translate="no"><div className="api-service-heading"><h2>{t('Add catalog entry')}</h2><button className="catalog-icon-button" onClick={onClose} aria-label={t('Close')}>×</button></div><button className="api-service-choice" onClick={()=>setKind('dataset')}><strong>{t('Dataset')}</strong><span>{t('Describe files from a Pod, upload files or add external data links.')}</span></button><button className="api-service-choice" onClick={()=>setKind('service')}><strong>API</strong><span>{t('Describe an API endpoint, its documentation and linked datasets.')}</span></button></div></CatalogModal>;
}

import React from 'react';
import CatalogModal from './CatalogModal';
import SemanticSearch from './SemanticSearch';
import { useI18n } from '../i18n';
import './SemanticSearchModal.css';

export default function SemanticSearchModal({ onClose, suspended, onOpenDataset, datasetOpenError, registryUrl }) {
  const { t } = useI18n();
  return <CatalogModal className="catalog-search-dialog" label={t('Semantic Search')} suspended={suspended} onClose={onClose}>
    <div className="catalog-search-content">
      <header className="catalog-search-header">
        <h2>{t('Semantic Search')}</h2>
        <button type="button" className="catalog-search-close" aria-label={t('Close')} onClick={onClose}>×</button>
      </header>
      <div className="catalog-search-body">
        {datasetOpenError && <p role="alert" className="semantic-search-error">{datasetOpenError}</p>}
        <SemanticSearch embedded registryUrl={registryUrl} onOpenDataset={onOpenDataset} />
      </div>
    </div>
  </CatalogModal>;
}

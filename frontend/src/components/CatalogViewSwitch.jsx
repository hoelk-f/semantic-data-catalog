import React from 'react';
import { useI18n } from '../i18n';

export default function CatalogViewSwitch({ view, onChange }) {
  const { t } = useI18n();
  return <div className="catalog-view-switch" role="group" aria-label={t('Catalog view')}>
    {[
      ['registry', 'fa-globe', 'Registry catalog'],
      ['personal', 'fa-user', 'Personal catalog'],
    ].map(([key, icon, label]) => <button key={key} type="button"
      aria-pressed={view === key} onClick={() => onChange(key)}>
      <i className={`fa-solid ${icon}`} aria-hidden="true" />
      <span>{t(label)}</span>
    </button>)}
  </div>;
}

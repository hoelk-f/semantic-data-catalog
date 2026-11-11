import React, {useId, useState} from 'react';
import {useI18n} from '../i18n';
import {activeMetadataProfile, allDatasetThemes, metadataLabel, metadataSelection} from '../catalogMetadata';
import './CatalogMetadata.css';

function Choices({field, value, onChange, language, filter = false, disabled = false}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const tr = (de, en) => language === 'de' ? de : en;
  const available = field.values.filter(v => filter || v.enabled || value.includes(v.iri));
  const toggle = option => {
    if (value.includes(option.iri)) return onChange(value.filter(v => v !== option.iri));
    const keep = filter ? value : (!field.multiple || option.exclusive) ? [] : value.filter(iri => !field.values.find(v => v.iri === iri)?.exclusive);
    onChange([...keep, option.iri]);
  };
  return <div className="catalog-category-field">
    <span id={`${id}-label`} className="catalog-category-label">{metadataLabel(field.label, language)}{!filter && field.required && ' *'}</span>
    <button type="button" className="catalog-category-trigger" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-options`} disabled={disabled} onClick={() => setOpen(!open)}>
      <span id={`${id}-value`}>{value.length ? tr(`${value.length} ausgewählt`, `${value.length} selected`) : tr(filter ? 'Alle' : 'Auswählen', filter ? 'All' : 'Select')}</span><span aria-hidden="true">⌄</span>
    </button>
    {value.length > 0 && <div className="catalog-category-chips">{available.filter(v => value.includes(v.iri)).map(v => <span className="catalog-category-chip" key={v.iri}>{metadataLabel(v.label, language)}{!v.enabled && tr(' (inaktiv)', ' (inactive)')}</span>)}</div>}
    {open && <div id={`${id}-options`} className="catalog-category-options" role="group" aria-labelledby={`${id}-label`}>{available.length ? available.map(option => <label key={option.iri}><input type="checkbox" checked={value.includes(option.iri)} disabled={disabled || (!filter && !option.enabled && !value.includes(option.iri))} onChange={() => toggle(option)}/><span>{metadataLabel(option.label, language)}{!option.enabled && tr(' (inaktiv)', ' (inactive)')}</span></label>) : <span>{tr('Keine Auswahlwerte verfügbar.', 'No options available.')}</span>}</div>}
    {!filter && field.help && <small>{metadataLabel(field.help, language)}</small>}
  </div>;
}
export function CatalogMetadataFields({value, onChange, dataset = {}, disabled = false}) {
  const {language} = useI18n();
  const profile = activeMetadataProfile();
  if (!profile) return null;
  const selection = value || metadataSelection(dataset, profile);
  return <section className="catalog-metadata-panel" translate="no"><h3>{metadataLabel(profile.label, language)}</h3><p>{language === 'de' ? 'Ordne den Datensatz ein. Mit * markierte Felder sind für neue Einträge erforderlich.' : 'Classify the dataset. Fields marked * are required for new entries.'}</p><div className="catalog-category-grid">{profile.fields.filter(f => f.enabled && f.form).map(field => <Choices key={field.id} field={field} value={selection[field.scheme] || []} language={language} disabled={disabled} onChange={values => onChange({...selection, [field.scheme]: values})}/>)}</div></section>;
}
export function CatalogMetadataDetails({dataset}) {
  const {language} = useI18n();
  const profile = activeMetadataProfile();
  if (!profile) return null;
  const themes = new Set(allDatasetThemes(dataset));
  const fields = profile.fields.filter(f => f.details && f.values.some(v => themes.has(v.iri)));
  if (!fields.length) return null;
  return <section className="catalog-metadata-panel" translate="no"><h3>{metadataLabel(profile.label, language)}</h3><dl className="catalog-category-grid">{fields.map(field => <div key={field.id}><dt>{metadataLabel(field.label, language)}</dt><dd className="catalog-category-chips">{field.values.filter(v => themes.has(v.iri)).map(v => <span className="catalog-category-chip" key={v.iri}>{metadataLabel(v.label, language)}{!field.enabled || !v.enabled ? (language === 'de' ? ' (inaktiv)' : ' (inactive)') : ''}</span>)}</dd></div>)}</dl></section>;
}
export function CatalogMetadataFilters({value, onChange}) {
  const {language} = useI18n();
  const profile = activeMetadataProfile();
  if (!profile || !profile.fields.some(f => f.enabled && f.filter)) return null;
  const count = Object.values(value).reduce((sum, values) => sum + values.length, 0);
  return <details className="catalog-metadata-filters" translate="no"><summary>{metadataLabel(profile.label, language)}: {language === 'de' ? 'Filter' : 'filters'}{count ? ` (${count})` : ''}</summary><div className="catalog-category-grid">{profile.fields.filter(f => f.enabled && f.filter).map(field => <Choices key={field.id} filter field={field} value={value[field.scheme] || []} language={language} onChange={values => onChange({...value, [field.scheme]: values})}/>)}</div>{count > 0 && <button type="button" className="catalog-text-button" onClick={() => onChange({})}>{language === 'de' ? 'Kategoriefilter zurücksetzen' : 'Reset category filters'}</button>}</details>;
}

import React, {forwardRef, useId, useImperativeHandle, useState} from 'react';
import {useI18n} from '../i18n';
import {isMetadataTheme, normalizeThemeIri} from '../catalogMetadata';
import {themeLabel} from '../catalogView';
import './CatalogFormFields.css';

export const uniqueThemeTags = values => [...new Map(values.map(value => String(value).trim()).filter(value => value && !isMetadataTheme(value)).map(value => [normalizeThemeIri(value), value])).values()];

// The parent reads pending text at save time, including keyboard-triggered saves
// that do not blur the input first.
const ThemeTags = forwardRef(function ThemeTags({value = [], onChange, suggestions = [], disabled = false}, ref) {
  const {language} = useI18n();
  const tr = (de, en) => language === 'de' ? de : en;
  const id = useId();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const getValues = () => uniqueThemeTags([...value, ...draft.split(/\r?\n/)]);
  useImperativeHandle(ref, () => ({getValues}));
  const commit = () => { onChange(getValues()); setDraft(''); };
  const add = theme => { onChange(uniqueThemeTags([...value, theme])); setDraft(''); };
  const selected = new Set(value.map(normalizeThemeIri));
  const available = uniqueThemeTags(suggestions).filter(theme => !selected.has(normalizeThemeIri(theme)) && themeLabel(theme).toLocaleLowerCase().includes(draft.trim().toLocaleLowerCase())).slice(0, 8);
  return <div className="catalog-theme-tags" translate="no" onFocus={() => setFocused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
    <label className="form-label-compact" htmlFor={id}>{tr('Themen', 'Themes')}</label>
    <div className="catalog-theme-tags-box">
      {value.map(theme => <span className="catalog-theme-tag" key={theme} title={theme}>
        <span>{themeLabel(theme)}</span><button type="button" disabled={disabled} aria-label={tr('Thema entfernen: ', 'Remove theme: ') + themeLabel(theme)} onClick={() => onChange(value.filter(v => v !== theme))}>×</button>
      </span>)}
      <input id={id} value={draft} disabled={disabled} autoComplete="off" aria-describedby={`${id}-help`} placeholder={tr('Thema eingeben', 'Enter a theme')}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter' || (e.key === ',' && !/^https?:\/\//i.test(draft))) { e.preventDefault(); commit(); }
        }}/>
      <button className="catalog-theme-add" type="button" disabled={disabled || !draft.trim()} onClick={commit}>{tr('Hinzufügen', 'Add')}</button>
    </div>
    <small id={`${id}-help`}>{tr('Mit Enter hinzufügen oder ein vorhandenes Thema auswählen.', 'Press Enter to add or select an existing theme.')}</small>
    {(focused || draft) && available.length > 0 && <div className="catalog-theme-suggestions" aria-label={tr('Vorhandene Themen', 'Existing themes')}>
      {available.map(theme => <button type="button" key={theme} title={theme} disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={() => add(theme)}>{themeLabel(theme)}</button>)}
    </div>}
  </div>;
});
export default ThemeTags;

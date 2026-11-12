import {addUrl, getUrlAll, getStringNoLocale, removeUrl, removeStringNoLocale} from '@inrupt/solid-client';
const THEME = 'http://www.w3.org/ns/dcat#theme';
export const metadataLabel = (labels, language) => labels?.[language] || labels?.en || labels?.de || '';
export function catalogMetadataConfig(app = globalThis.window?.__APP_CONFIG__, env = globalThis.window?._env_) {
  return app?.catalog || env?.CATALOG_METADATA_CONFIG || {};
}
export function activeMetadataProfile(config = catalogMetadataConfig()) {
  return config.metadataProfiles?.find(p => p.id === config.metadataProfile && p.enabled) || null;
}
export function multipleThemesEnabled(config = catalogMetadataConfig()) {
  const profile = activeMetadataProfile(config);
  // Existing DACE templates predate this switch; explicit false always wins.
  return profile ? (profile.multipleThemes ?? profile.id === 'dace-ce-v1') : false;
}
export function normalizeThemeIri(value) {
  const text = String(value || '').trim();
  if (!text || /^https?:\/\//i.test(text)) return text;
  return `https://w3id.org/solid-dataspace-manager/theme/${encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-'))}`;
}
export function isMetadataTheme(value) {
  try { return new URL(value).pathname.includes('/catalog-vocabulary/'); } catch { return false; }
}
export function allDatasetThemes(dataset) {
  return [...new Set([...(dataset.themes || []), ...(/^https?:\/\//i.test(dataset.theme || '') ? [dataset.theme] : String(dataset.theme || '').split(/[,;|]/)).map(v => v.trim()).filter(Boolean)])];
}
export function metadataSelection(dataset, profile = activeMetadataProfile()) {
  const themes = new Set(allDatasetThemes(dataset || {}));
  return Object.fromEntries((profile?.fields || []).map(field => [field.scheme, field.values.filter(v => themes.has(v.iri)).map(v => v.iri)]));
}
export function metadataIssues(selection, previousThemes = [], isNew = true, profile = activeMetadataProfile()) {
  if (!profile) return [];
  const issues = [];
  for (const field of profile.fields.filter(f => f.enabled && f.form)) {
    const values = selection?.[field.scheme] || [];
    const old = field.values.filter(v => previousThemes.includes(v.iri)).map(v => v.iri);
    const unchanged = !isNew && Array.isArray(values) && values.length === old.length && values.every(v => old.includes(v));
    if (!Array.isArray(values) || values.some(v => !field.values.some(option => option.iri === v && (option.enabled || old.includes(v))))) {
      issues.push({field, code: 'invalid'}); continue;
    }
    if (unchanged) continue; // Later configuration changes never invalidate untouched legacy entries.
    if (field.required && !values.length && (isNew || old.length)) issues.push({field, code: 'required'});
    if ((!field.multiple && values.length > 1) || (values.length > 1 && field.values.some(v => v.exclusive && values.includes(v.iri)))) issues.push({field, code: 'exclusive'});
  }
  return issues;
}
export function matchesMetadataFilters(dataset, filters, profile = activeMetadataProfile()) {
  if (!profile) return true;
  const themes = new Set(allDatasetThemes(dataset));
  return profile.fields.filter(f => f.enabled && f.filter).every(f => !filters[f.scheme]?.length || filters[f.scheme].some(iri => themes.has(iri)));
}
// Preserve all unrelated categories, including those hidden by the current instance.
// The current profile owns only the explicitly submitted, visible dimensions.
export function applyDatasetThemes(thing, input, normalizeTheme, previous = null, profile = activeMetadataProfile()) {
  const oldThemes = previous ? getUrlAll(previous, THEME) : [];
  if (Object.prototype.hasOwnProperty.call(input, 'themeTags')) {
    if (!Array.isArray(input.themeTags) || input.themeTags.some(v => typeof v !== 'string' || isMetadataTheme(v))) throw new Error('Invalid theme tags.');
    const tags = input.themeTags.map(v => v.trim()).filter(Boolean);
    const desired = new Set(tags.map(normalizeTheme));
    const literal = previous && getStringNoLocale(previous, THEME);
    // Literal legacy themes stay literal when unchanged; hidden CE categories
    // remain owned by their profile fields, never by the ordinary tag editor.
    for (const old of oldThemes) if (!isMetadataTheme(old) && !desired.has(old)) thing = removeUrl(thing, THEME, old);
    if (literal && !tags.includes(literal)) thing = removeStringNoLocale(thing, THEME, literal);
    const existing = new Set(getUrlAll(thing, THEME));
    for (const tag of tags) {
      const iri = normalizeTheme(tag);
      if (tag !== literal && !existing.has(iri)) { thing = addUrl(thing, THEME, iri); existing.add(iri); }
    }
  } else if (Object.prototype.hasOwnProperty.call(input, 'theme')) {
    const literal = previous && getStringNoLocale(previous, THEME);
    const oldPrimary = literal || oldThemes.find(value => !isMetadataTheme(value));
    if (oldPrimary && oldPrimary !== input.theme) {
      thing = literal ? removeStringNoLocale(thing, THEME, literal) : removeUrl(thing, THEME, oldPrimary);
    }
    if (input.theme && input.theme !== literal) thing = addUrl(thing, THEME, normalizeTheme(input.theme));
  }
  if (!profile) return thing;
  const selection = {...metadataSelection({themes: oldThemes}, profile), ...(input.metadataSelection || {})};
  const issues = metadataIssues(selection, oldThemes, !previous, profile);
  if (issues.length) {
    const error = new Error('Please check the catalog categories.');
    error.metadataIssues = issues; throw error;
  }
  if (!input.metadataSelection) return thing;
  const editable = profile.fields.filter(f => f.enabled && f.form);
  for (const [scheme, values] of Object.entries(input.metadataSelection)) {
    const field = editable.find(f => f.scheme === scheme);
    if (!field) continue; // Disabled or hidden fields are retained, never overwritten.
    const owned = new Set(field.values.map(v => v.iri));
    for (const old of oldThemes) if (owned.has(old)) thing = removeUrl(thing, THEME, old);
    for (const iri of values) thing = addUrl(thing, THEME, iri);
  }
  return thing;
}

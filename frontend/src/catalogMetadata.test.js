import {createThing, addUrl, getUrlAll, setStringNoLocale, getStringNoLocale, createSolidDataset, setThing} from '@inrupt/solid-client';
import {activeMetadataProfile, metadataIssues, metadataSelection, applyDatasetThemes, matchesMetadataFilters} from './catalogMetadata';
import {buildDatasetResource, parseDatasetFromDoc} from './solidCatalog';
const THEME = 'http://www.w3.org/ns/dcat#theme';
const base = 'https://dace.example/catalog-vocabulary/ce/';
const field = (id) => ({id, scheme: base + id, enabled: true, form: true, details: true, filter: true, multiple: true, required: false,
  label: {en: id, de: id}, values: ['a', 'b', 'all'].map(id2 => ({id: id2, iri: base + id + '/' + id2, enabled: true, exclusive: id2 === 'all', label: {en: id2, de: id2}}))});
const profile = {id: 'ce', enabled: true, fields: [field('strategy'), field('kind')]};
const config = {metadataProfile: 'ce', metadataProfiles: [profile]};
beforeEach(() => { window.__APP_CONFIG__ = {catalog: config}; });
afterEach(() => { delete window.__APP_CONFIG__; delete window._env_; });
test('host configuration controls both standalone and embedded selection; standard stays empty', () => {
  expect(activeMetadataProfile()).toBe(profile);
  delete window.__APP_CONFIG__; window._env_ = {CATALOG_METADATA_CONFIG: config};
  expect(activeMetadataProfile()).toBe(profile);
  window.__APP_CONFIG__ = {catalog: {defaultRegistry: 'https://other.example/'}};
  expect(activeMetadataProfile()).toBeNull();
});
test('RDF roundtrip preserves multiple CE dimensions alongside the ordinary theme', () => {
  const thing = buildDatasetResource('https://pod.example/catalog/ds/example.ttl', {identifier: 'example', title: 'Recycling', theme: 'environment', metadataSelection: {[base+'strategy']: [base+'strategy/a', base+'strategy/b'], [base+'kind']: [base+'kind/a']}});
  const parsed = parseDatasetFromDoc(setThing(createSolidDataset(), thing), thing.url);
  expect(parsed.themes).toHaveLength(4);
  expect(parsed.theme).toContain('/theme/environment');
  expect(metadataSelection(parsed)[base+'strategy']).toHaveLength(2);
});
test('editing from a standard instance retains every hidden CE theme and unrelated RDF', () => {
  let old = addUrl(addUrl(addUrl(createThing({url:'https://pod.example/item'}), THEME, 'https://example.org/old'), THEME, base+'strategy/a'), THEME, 'https://example.org/secondary');
  old = setStringNoLocale(old, 'https://example.org/custom', 'retain me');
  const updated = applyDatasetThemes(old, {theme:'https://example.org/new'}, v => v, old, null);
  expect(getUrlAll(updated, THEME)).toEqual(expect.arrayContaining(['https://example.org/new', base+'strategy/a', 'https://example.org/secondary']));
  expect(getUrlAll(updated, THEME)).not.toContain('https://example.org/old');
  expect(getStringNoLocale(updated,'https://example.org/custom')).toBe('retain me');
});
test('only explicitly edited dimensions change, including an intentional empty selection', () => {
  let old = addUrl(addUrl(createThing({url:'https://pod.example/item'}), THEME, base+'strategy/a'), THEME, base+'kind/b');
  const updated = applyDatasetThemes(old,{metadataSelection:{[base+'strategy']:[]}},v=>v,old,profile);
  expect(getUrlAll(updated,THEME)).toEqual([base+'kind/b']);
});
test('filters use OR within a dimension and AND between dimensions', () => {
  const dataset={themes:[base+'strategy/b',base+'kind/a']};
  expect(matchesMetadataFilters(dataset,{[base+'strategy']:[base+'strategy/a',base+'strategy/b'],[base+'kind']:[base+'kind/a']},profile)).toBe(true);
  expect(matchesMetadataFilters(dataset,{[base+'kind']:[base+'kind/b']},profile)).toBe(false);
});
test('required fields apply to creation and clearing an existing assignment, not untouched legacy data', () => {
  const p={...profile,fields:[{...field('strategy'),required:true}]};
  expect(metadataIssues({},[],true,p)[0].code).toBe('required');
  expect(metadataIssues({},[],false,p)).toEqual([]);
  expect(metadataIssues({},[base+'strategy/a'],false,p)[0].code).toBe('required');
});
test('deactivated values remain usable for existing data but cannot be newly assigned', () => {
  const f=field('strategy');f.values[0].enabled=false;
  const p={...profile,fields:[f]}, selected={[f.scheme]:[f.values[0].iri]};
  expect(metadataIssues(selected,[f.values[0].iri],false,p)).toEqual([]);
  expect(metadataIssues(selected,[],true,p)[0].code).toBe('invalid');
});
test('exclusive selections and malformed inputs are rejected before writing', () => {
  expect(metadataIssues({[base+'strategy']:[base+'strategy/all',base+'strategy/a']},[],true,profile)[0].code).toBe('exclusive');
  expect(metadataIssues({[base+'strategy']:'not-an-array'},[],false,profile)[0].code).toBe('invalid');
});
test('changing the profile to single selection preserves untouched older multiple selections', () => {
  const p={...profile,fields:[{...field('strategy'),multiple:false}]};
  const values=[base+'strategy/a',base+'strategy/b'];
  expect(metadataIssues({[base+'strategy']:values},values,false,p)).toEqual([]);
  expect(metadataIssues({[base+'strategy']:values},[],true,p)[0].code).toBe('exclusive');
});

test('multiple theme tags roundtrip independently and do not overwrite CE dimensions', () => {
  const thing = buildDatasetResource('https://pod.example/catalog/ds/tags.ttl', {identifier:'tags', title:'Tags', theme:'stale value', themeTags:['Environment', 'Recycling', 'environment'], metadataSelection:{[base+'strategy']:[base+'strategy/a']}});
  const parsed = parseDatasetFromDoc(setThing(createSolidDataset(),thing),thing.url);
  expect(parsed.themes).toEqual(expect.arrayContaining(['https://w3id.org/solid-dataspace-manager/theme/environment','https://w3id.org/solid-dataspace-manager/theme/recycling',base+'strategy/a']));
  expect(parsed.themes).toHaveLength(3);
  let old=setStringNoLocale(thing,'https://example.org/note','keep');
  const updated=applyDatasetThemes(old,{themeTags:[],theme:'stale value'},v=>v,old,profile);
  expect(getUrlAll(updated,THEME)).toEqual([base+'strategy/a']);
  expect(getStringNoLocale(updated,'https://example.org/note')).toBe('keep');
});
test('unchanged legacy literal themes and URI punctuation survive tag editing', () => {
  const uri='https://example.org/themes/air,water';
  let old=setStringNoLocale(createThing({url:'https://pod.example/item'}),THEME,'Legacy theme');
  old=addUrl(old,THEME,uri);
  const next=applyDatasetThemes(old,{themeTags:['Legacy theme',uri]},v=>v,old,null);
  expect(getStringNoLocale(next,THEME)).toBe('Legacy theme');
  expect(getUrlAll(next,THEME)).toEqual([uri]);
  const {allDatasetThemes}=require('./catalogMetadata');
  expect(allDatasetThemes({themes:[uri],theme:uri})).toEqual([uri]);
});
test('tag mode follows profile configuration including explicit false for existing DACE templates', () => {
  const {multipleThemesEnabled}=require('./catalogMetadata');
  const make=(p,selected=p.id)=>({metadataProfile:selected,metadataProfiles:[p]});
  expect(multipleThemesEnabled(make({...profile,multipleThemes:true}))).toBe(true);
  expect(multipleThemesEnabled(make(profile))).toBe(false);
  expect(multipleThemesEnabled(make({...profile,id:'dace-ce-v1'}))).toBe(true);
  expect(multipleThemesEnabled(make({...profile,id:'dace-ce-v1',multipleThemes:false}))).toBe(false);
  expect(multipleThemesEnabled(make({...profile,multipleThemes:true},''))).toBe(false);
});
test('invalid tag inputs cannot clear existing themes or bypass category validation', () => {
  const old=addUrl(createThing({url:'https://pod.example/item'}),THEME,'https://example.org/theme');
  for(const themeTags of [null,'wrong',[base+'strategy/a'],[42]]) expect(()=>applyDatasetThemes(old,{themeTags},v=>v,old,profile)).toThrow('Invalid theme tags');
  expect(getUrlAll(old,THEME)).toEqual(['https://example.org/theme']);
});

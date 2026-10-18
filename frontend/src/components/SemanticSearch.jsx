import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { SEARCH_EXAMPLES, searchRequest } from '../semanticSearchApi';
import SemanticSearchResults from './SemanticSearchResults';
import './SemanticSearch.css';

export default function SemanticSearch({ onOpenDataset, apiBaseUrl, registryUrl, embedded = false }) {
  const { t } = useI18n();
  const [status, setStatus] = useState(null);
  const [query, setQuery] = useState(SEARCH_EXAMPLES[0].query);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const activeQuery = useRef(null);
  const ready = ['ready', 'partial'].includes(status?.status);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timer = setTimeout(() => controller.abort(), 15000);
    setStatus(null);
    searchRequest('status', { baseUrl: apiBaseUrl, registry: registryUrl, signal: controller.signal })
      .then(({ body }) => setStatus(body))
      .catch(err => { if (!disposed) setError(err.name === 'AbortError' ? 'Search status request timed out.' : err.message); })
      .finally(() => clearTimeout(timer));
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [apiBaseUrl, registryUrl, refresh]);
  useEffect(() => () => activeQuery.current?.abort(), []);

  async function run(event) {
    event.preventDefault();
    activeQuery.current?.abort();
    const controller = new AbortController();
    activeQuery.current = controller;
    setBusy(true); setError(''); setResult(null);
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      setResult(await searchRequest('query', { baseUrl: apiBaseUrl, registry: registryUrl, query, signal: controller.signal }));
    } catch (err) {
      setError(err.name === 'AbortError' ? t('Query cancelled or timed out.') : err.message);
    } finally {
      clearTimeout(timer);
      if (activeQuery.current === controller) { setBusy(false); activeQuery.current = null; }
    }
  }

  function download() {
    const rdf = typeof result.body === 'string';
    const blob = new Blob([rdf ? result.body : JSON.stringify(result.body, null, 2)], { type: rdf ? 'text/turtle' : 'application/sparql-results+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `semantic-search.${rdf ? 'ttl' : 'json'}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="semantic-search" aria-label={t('Semantic Search')}>
    {!embedded && <h1>{t('Semantic Search')}</h1>}
    {!ready && <div className="semantic-search-notice" role="status">
      <span>{status || error
        ? t('Search is currently unavailable. Please try again shortly.')
        : t('Loading search...')}</span>
      {(status || error) && <button type="button" className="btn btn-light"
        onClick={() => { setError(''); setRefresh(v => v + 1); }}>{t('Retry')}</button>}
    </div>}
    {status?.errorCount > 0 && <details className="semantic-search-errors"><summary>{status.errorCount} {t('sources could not be indexed')}</summary>
      <ul>{status.errors?.map((entry, index) => <li key={index}><code>{entry.source}</code>: {entry.message}</li>)}</ul>
    </details>}
    <form onSubmit={run}>
      <div className="semantic-search-examples"><label htmlFor="semantic-search-example">{t('Example query')}</label>
        <select id="semantic-search-example" defaultValue="" onChange={e => { if (e.target.value !== '') setQuery(SEARCH_EXAMPLES[Number(e.target.value)].query); }}>
          <option value="" disabled>{t('Choose an example')}</option>
          {SEARCH_EXAMPLES.map((example, index) => <option key={example.label} value={index}>{t(example.label)}</option>)}
        </select>
      </div>
      <label htmlFor="semantic-search-query">SPARQL</label>
      <textarea id="semantic-search-query" value={query} onChange={e => setQuery(e.target.value)} spellCheck={false}
        rows={15} maxLength={32000} aria-describedby="semantic-search-help" />
      <p id="semantic-search-help" className="semantic-search-muted">{t('SELECT, ASK, CONSTRUCT and DESCRIBE. Use ?dataset for links to catalog details. Examples with ontology IRIs must be adapted to your models.')}</p>
      <div className="semantic-search-actions">
        <button className="btn btn-primary" type="submit" disabled={busy || !ready || !query.trim()}>{busy ? t('Running query…') : t('Run query')}</button>
        {busy && <button className="btn btn-light" type="button" onClick={() => activeQuery.current?.abort()}>{t('Cancel')}</button>}
        {result && <button className="btn btn-light" type="button" onClick={download}>{t('Export results')}</button>}
      </div>
    </form>
    {error && <p className="semantic-search-error" role="alert">{error}</p>}
    <div className="semantic-search-results" aria-busy={busy}><h2>{t('Query results')}</h2>
      <SemanticSearchResults result={result} onOpenDataset={onOpenDataset} />
    </div>
  </section>;
}

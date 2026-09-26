import React from 'react';
import { safeResultUrl } from '../semanticSearchApi';
import { useI18n } from '../i18n';

export default function SemanticSearchResults({ result, onOpenDataset }) {
  const { t } = useI18n();
  if (!result) return <p className="semantic-search-muted">{t('Run a query to see results.')}</p>;
  if (typeof result.body === 'string') return <pre className="semantic-search-rdf" tabIndex={0}>{result.body}</pre>;
  if (typeof result.body.boolean === 'boolean') return <p role="status">ASK: <strong>{String(result.body.boolean)}</strong></p>;
  const variables = result.body.head?.vars || [];
  const rows = result.body.results?.bindings || [];
  if (!rows.length) return <p role="status">{t('No matching results.')}</p>;
  return <>
    <p role="status">{rows.length} {t('results')} · {result.duration || '—'} ms</p>
    {rows.length > 1000 && <p>{t('Showing the first 1,000 rows. Export includes all returned rows.')}</p>}
    <div className="semantic-search-table" tabIndex={0} role="region" aria-label={t('Query results')}>
      <table translate="no"><thead><tr>{variables.map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
        <tbody>{rows.slice(0, 1000).map((row, index) => <tr key={index}>{variables.map(name => {
          const binding = row[name];
          const href = binding?.type === 'uri' ? safeResultUrl(binding.value) : null;
          return <td key={name}>{href ? <>
            {name === 'dataset' && onOpenDataset
              ? <button type="button" className="semantic-search-dataset" onClick={() => onOpenDataset(href)}>{binding.value}</button>
              : <a href={href} target="_blank" rel="noopener noreferrer">{binding.value}</a>}
          </> : <span title={binding?.datatype || ''}>{binding?.value ?? '—'}{binding?.['xml:lang'] ? ` @${binding['xml:lang']}` : ''}</span>}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
  </>;
}

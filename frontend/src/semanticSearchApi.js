export const SEARCH_PREFIXES = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX search: <https://w3id.org/solid-dataspace/search#>
`;

export const SEARCH_EXAMPLES = [
  { label: 'Catalog datasets', query: `${SEARCH_PREFIXES}
SELECT DISTINCT ?dataset ?title ?owner WHERE {
  GRAPH <urn:solid-dataspace:semantic-search:index> {
    ?dataset search:metadataGraph ?metadata ; search:owner ?owner .
  }
  GRAPH ?metadata { ?dataset dct:title ?title . }
}
ORDER BY ?title
LIMIT 100` },
  { label: 'Classes in semantic models', query: `${SEARCH_PREFIXES}
SELECT DISTINCT ?dataset ?title ?class WHERE {
  GRAPH <urn:solid-dataspace:semantic-search:index> {
    ?dataset search:metadataGraph ?metadata ; search:modelGraph ?model .
  }
  GRAPH ?metadata { ?dataset dct:title ?title . }
  GRAPH ?model { ?node a ?class . }
}
ORDER BY ?title ?class
LIMIT 100` },
  { label: 'Match a model pattern', query: `${SEARCH_PREFIXES}
# Replace the example class and property with IRIs from your models.
PREFIX example: <https://example.org/ontology/>
SELECT DISTINCT ?dataset ?title WHERE {
  GRAPH <urn:solid-dataspace:semantic-search:index> {
    ?dataset search:metadataGraph ?metadata ; search:modelGraph ?model .
  }
  GRAPH ?metadata { ?dataset dct:title ?title . }
  GRAPH ?model {
    ?beam a example:SteelBeam ; example:hasType example:TypeX .
  }
}
LIMIT 100` },
];

export async function searchRequest(path, { baseUrl = '/api/semantic-search', registry, query, signal } = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${path}${registry ? `?registry=${encodeURIComponent(registry)}` : ''}`, {
    method: query === undefined ? 'GET' : 'POST', credentials: 'omit', cache: 'no-store', signal,
    headers: query === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(query === undefined ? {} : { body: JSON.stringify({ query }) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.detail === 'string' ? error.detail : `Search request failed (${response.status}).`);
  }
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('json') ? await response.json() : await response.text();
  return { body, contentType, duration: response.headers.get('x-search-duration-ms') };
}

export function safeResultUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

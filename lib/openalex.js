const BASE = 'https://api.openalex.org';

export function sourcesSearchUrl(name, mailto) {
  const u = new URL(`${BASE}/sources`);
  u.searchParams.set('search', name);
  u.searchParams.set('per_page', '5');
  if (mailto) u.searchParams.set('mailto', mailto);
  return u.toString();
}

export function sourceByIssnUrl(issn, mailto) {
  const u = new URL(`${BASE}/sources/issn:${issn}`);
  if (mailto) u.searchParams.set('mailto', mailto);
  return u.toString();
}

function estimateWorksPerYear(src) {
  const counts = (src.counts_by_year || []).slice(0, 3).map((c) => c.works_count || 0);
  if (!counts.length) return src.works_count || 0;
  return Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
}

export function sourceToEntry(src) {
  return {
    issn_l: src.issn_l || null,
    issn: Array.isArray(src.issn) ? src.issn : [],
    name: src.display_name || '',
    publisher: src.host_organization_name || null,
    homepage: src.homepage_url || null,
    openalex_source_id: src.id ? src.id.replace('https://openalex.org/', '') : null,
    works_per_year: estimateWorksPerYear(src),
    oa_status: src.is_oa ? 'oa' : 'closed',
  };
}

// Choose the best source from search results for a target name.
export function pickBestSource(results, name) {
  if (!results || !results.length) return null;
  const exact = results.find(
    (r) => (r.display_name || '').toLowerCase() === name.toLowerCase()
  );
  return exact || results[0];
}

const VALID_DOMAINS = ['core-bio', 'medicine'];
const VALID_TIERS = ['flagship', 'top', 'specialist'];
const VALID_RSS_STATUS = ['live', 'dead', 'none'];

// Available fetch backends in priority order, from a health-checked entry.
export function computeBackends(e) {
  const b = [];
  if (e.rss && e.rss.status === 'live') b.push('rss');
  const hasIssn = e.issn_l || (Array.isArray(e.issn) && e.issn.length);
  if (hasIssn) b.push('crossref', 'openalex');
  return b;
}

export function validateEntry(e) {
  const errors = [];
  if (!e.issn_l && !(Array.isArray(e.issn) && e.issn.length)) errors.push('missing issn_l and issn');
  if (!e.name) errors.push('missing name');
  if (e.domain && !VALID_DOMAINS.includes(e.domain)) errors.push(`bad domain: ${e.domain}`);
  if (e.tier && !VALID_TIERS.includes(e.tier)) errors.push(`bad tier: ${e.tier}`);
  if (e.rss && !VALID_RSS_STATUS.includes(e.rss.status)) errors.push(`bad rss.status: ${e.rss.status}`);
  if (!Array.isArray(e.backends) || e.backends.length === 0) errors.push('missing backends');
  return { ok: errors.length === 0, errors };
}

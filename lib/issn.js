// Normalize an ISSN to NNNN-NNNN (uppercase X). Returns null on bad shape.
export function normalizeIssn(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  const m = s.match(/^(\d{4})-?(\d{3}[\dX])$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

// Stable dedupe key: prefer ISSN-L, else first valid ISSN, else slugified name.
export function journalKey({ issn_l, issn = [], name = '' } = {}) {
  const l = normalizeIssn(issn_l);
  if (l) return `issnl:${l}`;
  for (const i of issn) {
    const n = normalizeIssn(i);
    if (n) return `issn:${n}`;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `name:${slug}`;
}

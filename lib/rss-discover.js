// lib/rss-discover.js

function resolveUrl(href, baseUrl) {
  try { return new URL(href, baseUrl).toString(); } catch { return href; }
}

// Feed URLs declared in a page's <link rel="alternate" type="application/(rss|atom)+xml">.
export function extractFeedLinks(html, baseUrl) {
  const out = [];
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/rel=["']?alternate/i.test(tag)) continue;
    if (!/type=["']?application\/(?:rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i);
    if (href) out.push(resolveUrl(href[1], baseUrl));
  }
  return [...new Set(out)];
}

// Candidate feed URLs from known publisher URL patterns, using homepage as a hint.
export function patternFeedUrls(entry) {
  const out = [];
  const home = entry.homepage || '';
  let m = home.match(/nature\.com\/([a-z0-9-]+)(?:\/home)?\/?$/i);
  if (m) out.push(`https://www.nature.com/${m[1]}.rss`);
  m = home.match(/cell\.com\/([a-z0-9-]+)(?:\/home)?\/?$/i);
  if (m) out.push(`https://www.cell.com/${m[1]}/current.rss`);
  return [...new Set(out)];
}

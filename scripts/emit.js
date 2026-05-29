import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export function toIndex(entries) {
  return entries.map((e) => ({
    issn_l: e.issn_l, name: e.name, domain: e.domain,
    field_tags: e.field_tags, tier: e.tier, backends: e.backends,
  }));
}

export function groupByField(entries) {
  const out = {};
  for (const e of entries) {
    for (const f of e.field_tags || []) {
      (out[f] ||= []).push(e);
    }
  }
  return out;
}

function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

export function toCsv(entries) {
  const header = 'issn_l,name,publisher,domain,tier,rss_status,backends';
  const rows = entries.map((e) =>
    [e.issn_l, e.name, e.publisher, e.domain, e.tier, e.rss?.status, (e.backends || []).join('|')]
      .map(csvCell).join(',')
  );
  return [header, ...rows].join('\n');
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function toOpml(entries) {
  const outlines = entries
    .filter((e) => e.rss && e.rss.status === 'live' && e.rss.url)
    .map((e) => `    <outline type="rss" text="${escapeXml(e.name)}" xmlUrl="${escapeXml(e.rss.url)}"/>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>journal-registry</title></head>
  <body>
${outlines}
  </body>
</opml>`;
}

// Write all artifacts under dataDir/derivDir. Rebuilds sharded dirs from scratch.
export async function writeAll(entries, { dataDir, derivDir }) {
  await mkdir(dataDir, { recursive: true });
  await mkdir(derivDir, { recursive: true });
  await rm(join(dataDir, 'by-field'), { recursive: true, force: true });
  await rm(join(dataDir, 'journals'), { recursive: true, force: true });
  await mkdir(join(dataDir, 'by-field'), { recursive: true });
  await mkdir(join(dataDir, 'journals'), { recursive: true });

  await writeFile(join(dataDir, 'registry.json'), JSON.stringify(entries, null, 2));
  await writeFile(join(dataDir, 'index.json'), JSON.stringify(toIndex(entries), null, 2));

  const byField = groupByField(entries);
  for (const [field, list] of Object.entries(byField)) {
    await writeFile(join(dataDir, 'by-field', `${field}.json`), JSON.stringify(list, null, 2));
  }
  for (const e of entries) {
    const key = e.issn_l || e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await writeFile(join(dataDir, 'journals', `${key}.json`), JSON.stringify(e, null, 2));
  }
  await writeFile(join(derivDir, 'registry.csv'), toCsv(entries));
  await writeFile(join(derivDir, 'registry.opml'), toOpml(entries));
}

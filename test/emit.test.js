import test from 'node:test';
import assert from 'node:assert/strict';
import { toIndex, groupByField, toCsv, toOpml } from '../scripts/emit.js';

const ENTRIES = [
  { issn_l: '1476-4687', name: 'Nature', publisher: 'Springer Nature', domain: 'core-bio', field_tags: ['genomics', 'evolution'], tier: 'flagship', rss: { status: 'live', url: 'https://www.nature.com/nature.rss' }, backends: ['rss', 'crossref', 'openalex'] },
  { issn_l: '0098-7484', name: 'JAMA', publisher: 'AMA', domain: 'medicine', field_tags: ['clinical'], tier: 'flagship', rss: { status: 'none', url: null }, backends: ['crossref', 'openalex'] },
];

test('toIndex keeps only slim fields', () => {
  const idx = toIndex(ENTRIES);
  assert.deepEqual(Object.keys(idx[0]).sort(), ['backends', 'domain', 'field_tags', 'issn_l', 'name', 'tier']);
});

test('groupByField buckets entries by each tag', () => {
  const g = groupByField(ENTRIES);
  assert.equal(g.genomics.length, 1);
  assert.equal(g.clinical.length, 1);
  assert.equal(g.evolution[0].name, 'Nature');
});

test('toCsv has a header and one row per entry', () => {
  const lines = toCsv(ENTRIES).split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^issn_l,name,publisher,domain,tier,rss_status,backends$/);
  assert.match(lines[1], /"1476-4687","Nature"/);
});

test('toOpml includes only live feeds', () => {
  const opml = toOpml(ENTRIES);
  assert.match(opml, /xmlUrl="https:\/\/www\.nature\.com\/nature\.rss"/);
  assert.doesNotMatch(opml, /JAMA/);
});

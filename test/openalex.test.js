import test from 'node:test';
import assert from 'node:assert/strict';
import { sourcesSearchUrl, sourceByIssnUrl, sourceToEntry, pickBestSource } from '../lib/openalex.js';

test('sourcesSearchUrl encodes the name and mailto', () => {
  const url = sourcesSearchUrl('Nature Genetics', 'me@x.org');
  assert.match(url, /\/sources\?/);
  assert.match(url, /search=Nature\+Genetics/);
  assert.match(url, /mailto=me%40x\.org/);
});

test('sourceByIssnUrl targets the issn path', () => {
  assert.match(sourceByIssnUrl('1476-4687'), /\/sources\/issn:1476-4687$/);
});

test('sourceToEntry maps an OpenAlex source object', () => {
  const e = sourceToEntry({
    id: 'https://openalex.org/S137773608',
    display_name: 'Nature',
    issn_l: '1476-4687',
    issn: ['0028-0836', '1476-4687'],
    host_organization_name: 'Springer Nature',
    homepage_url: 'https://www.nature.com/nature/',
    is_oa: false,
    counts_by_year: [{ year: 2025, works_count: 2400 }, { year: 2024, works_count: 2200 }],
  });
  assert.equal(e.issn_l, '1476-4687');
  assert.equal(e.openalex_source_id, 'S137773608');
  assert.equal(e.publisher, 'Springer Nature');
  assert.equal(e.oa_status, 'closed');
  assert.equal(e.works_per_year, 2300);
});

test('pickBestSource prefers exact display_name match', () => {
  const results = [
    { display_name: 'Nature Reviews Genetics' },
    { display_name: 'Nature Genetics' },
  ];
  assert.equal(pickBestSource(results, 'Nature Genetics').display_name, 'Nature Genetics');
});

test('pickBestSource falls back to first result', () => {
  const results = [{ display_name: 'Foo' }, { display_name: 'Bar' }];
  assert.equal(pickBestSource(results, 'Nothing Matches').display_name, 'Foo');
  assert.equal(pickBestSource([], 'x'), null);
});

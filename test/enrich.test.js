import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSeedAndSource, resolveSource } from '../scripts/enrich.js';

const SRC = {
  id: 'https://openalex.org/S137773608', display_name: 'Nature',
  issn_l: '1476-4687', issn: ['0028-0836', '1476-4687'],
  host_organization_name: 'Springer Nature', homepage_url: 'https://www.nature.com/nature/',
  is_oa: false, counts_by_year: [{ year: 2025, works_count: 2300 }],
};

test('mergeSeedAndSource applies curation intent over OpenAlex metadata', () => {
  const seed = { name: 'Nature', rss_url: 'https://www.nature.com/nature.rss', domain: 'core-bio', field_tags: ['genomics'], tier: 'flagship' };
  const e = mergeSeedAndSource(seed, SRC);
  assert.equal(e.issn_l, '1476-4687');
  assert.equal(e.publisher, 'Springer Nature');
  assert.equal(e.domain, 'core-bio');
  assert.deepEqual(e.field_tags, ['genomics']);
  assert.equal(e.tier, 'flagship');
  assert.equal(e.rss.url, 'https://www.nature.com/nature.rss');
  assert.equal(e.rss.status, 'none');
  assert.deepEqual(e.backends, []);
});

test('mergeSeedAndSource leaves rss null when seed has no rss_url', () => {
  const e = mergeSeedAndSource({ name: 'JAMA', domain: 'medicine', field_tags: ['clinical'], tier: 'flagship' }, { ...SRC, display_name: 'JAMA', issn_l: '0098-7484' });
  assert.equal(e.rss, null);
});

test('resolveSource searches by name and picks best match', async () => {
  const calls = [];
  const fakeFetchJson = async (url) => { calls.push(url); return { results: [{ display_name: 'Nature' , id: 'https://openalex.org/S1', issn_l: '1476-4687' }] }; };
  const src = await resolveSource({ name: 'Nature' }, { fetchJson: fakeFetchJson, mailto: 'me@x.org' });
  assert.equal(src.issn_l, '1476-4687');
  assert.match(calls[0], /\/sources\?search=Nature/);
});

test('resolveSource uses issn lookup when seed.issn is provided', async () => {
  const calls = [];
  const fakeFetchJson = async (url) => { calls.push(url); return { id: 'https://openalex.org/S2', display_name: 'NEJM', issn_l: '0028-4793' }; };
  const src = await resolveSource({ name: 'NEJM', issn: '0028-4793' }, { fetchJson: fakeFetchJson });
  assert.equal(src.issn_l, '0028-4793');
  assert.match(calls[0], /\/sources\/issn:0028-4793/);
});

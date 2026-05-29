import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIssn, journalKey } from '../lib/issn.js';

test('normalizeIssn accepts canonical and loose forms', () => {
  assert.equal(normalizeIssn('1476-4687'), '1476-4687');
  assert.equal(normalizeIssn('14764687'), '1476-4687');
  assert.equal(normalizeIssn(' 2049-3630 '), '2049-3630');
  assert.equal(normalizeIssn('2049-363x'), '2049-363X');
});

test('normalizeIssn rejects bad shapes', () => {
  assert.equal(normalizeIssn('nope'), null);
  assert.equal(normalizeIssn('123-4567'), null);
  assert.equal(normalizeIssn(''), null);
  assert.equal(normalizeIssn(null), null);
});

test('journalKey prefers issn_l, then issn, then name slug', () => {
  assert.equal(journalKey({ issn_l: '1476-4687' }), 'issnl:1476-4687');
  assert.equal(journalKey({ issn: ['0092-8674'] }), 'issn:0092-8674');
  assert.equal(journalKey({ name: 'Cell Genomics' }), 'name:cell-genomics');
});

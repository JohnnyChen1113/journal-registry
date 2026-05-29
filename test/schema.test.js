import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, computeBackends } from '../lib/schema.js';

test('computeBackends includes rss only when live, plus api backends when issn present', () => {
  assert.deepEqual(
    computeBackends({ issn_l: '1476-4687', rss: { status: 'live' } }),
    ['rss', 'crossref', 'openalex']
  );
  assert.deepEqual(
    computeBackends({ issn_l: '0028-4793', rss: { status: 'none' } }),
    ['crossref', 'openalex']
  );
  assert.deepEqual(computeBackends({ name: 'No Issn', rss: { status: 'dead' } }), []);
});

test('validateEntry passes a well-formed entry', () => {
  const { ok, errors } = validateEntry({
    issn_l: '1476-4687', name: 'Nature', domain: 'core-bio', tier: 'flagship',
    rss: { status: 'live' }, backends: ['rss', 'crossref', 'openalex'],
  });
  assert.equal(ok, true, errors.join('; '));
});

test('validateEntry flags bad enums and missing fields', () => {
  const { ok, errors } = validateEntry({ name: '', domain: 'finance', tier: 'x', backends: [] });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('issn')));
  assert.ok(errors.some((e) => e.includes('domain')));
  assert.ok(errors.some((e) => e.includes('backends')));
});

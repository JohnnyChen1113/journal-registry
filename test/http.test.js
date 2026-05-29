import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchText, fetchJson } from '../lib/http.js';

test('fetchText returns body text on 200', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => 'hello' });
  try {
    assert.equal(await fetchText('https://x'), 'hello');
  } finally { globalThis.fetch = orig; }
});

test('fetchText throws on non-2xx', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, text: async () => '' });
  try {
    await assert.rejects(() => fetchText('https://x'), /HTTP 503/);
  } finally { globalThis.fetch = orig; }
});

test('fetchJson parses JSON body', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '{"a":1}' });
  try {
    assert.deepEqual(await fetchJson('https://x'), { a: 1 });
  } finally { globalThis.fetch = orig; }
});

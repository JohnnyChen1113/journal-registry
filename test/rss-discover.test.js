// test/rss-discover.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFeedLinks, patternFeedUrls } from '../lib/rss-discover.js';

test('extractFeedLinks finds rss/atom alternate links and resolves relative hrefs', () => {
  const html = `<html><head>
    <link rel="alternate" type="application/rss+xml" href="/feed.rss">
    <link rel="alternate" type="application/atom+xml" href="https://x.org/atom.xml">
    <link rel="stylesheet" href="/style.css">
  </head></html>`;
  const out = extractFeedLinks(html, 'https://x.org/journal/');
  assert.deepEqual(out, ['https://x.org/feed.rss', 'https://x.org/atom.xml']);
});

test('extractFeedLinks returns [] when no feed links', () => {
  assert.deepEqual(extractFeedLinks('<html><head></head></html>', 'https://x.org'), []);
});

test('patternFeedUrls derives Nature and Cell feed URLs from homepage', () => {
  assert.deepEqual(
    patternFeedUrls({ homepage: 'https://www.nature.com/nbt/' }),
    ['https://www.nature.com/nbt.rss']
  );
  assert.deepEqual(
    patternFeedUrls({ homepage: 'https://www.cell.com/neuron/home' }),
    ['https://www.cell.com/neuron/current.rss']
  );
  assert.deepEqual(patternFeedUrls({ homepage: 'https://academic.oup.com/nar' }), []);
});

test('patternFeedUrls handles a Nature /home homepage suffix', () => {
  assert.deepEqual(
    patternFeedUrls({ homepage: 'https://www.nature.com/nbt/home' }),
    ['https://www.nature.com/nbt.rss']
  );
});

test('extractFeedLinks accepts an unquoted type attribute', () => {
  const html = '<link rel="alternate" type=application/rss+xml href="https://x.org/f.rss">';
  assert.deepEqual(extractFeedLinks(html, 'https://x.org'), ['https://x.org/f.rss']);
});

// test/discover.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { worksByTopicGroupUrl, parseSourceGroups, aggregateTopics } from '../lib/discover.js';

test('worksByTopicGroupUrl builds a topic-filtered group_by works query', () => {
  const url = worksByTopicGroupUrl({ topicIds: ['T10001', 'T10002'], fromDate: '2025-01-01', mailto: 'me@x.org' });
  assert.match(url, /\/works\?/);
  assert.match(url, /filter=primary_topic\.id%3AT10001%7CT10002%2Cfrom_publication_date%3A2025-01-01/);
  assert.match(url, /group_by=primary_location\.source\.id/);
  assert.match(url, /mailto=me%40x\.org/);
});

test('parseSourceGroups maps and cleans group_by buckets', () => {
  const groups = parseSourceGroups({ group_by: [
    { key: 'https://openalex.org/S1', count: 500 },
    { key: 'unknown', count: 99 },
  ] });
  assert.deepEqual(groups, [{ sourceId: 'S1', count: 500 }]);
});

test('aggregateTopics ranks topic ids by frequency across sources', () => {
  const sources = [
    { topics: [{ id: 'https://openalex.org/T1' }, { id: 'https://openalex.org/T2' }] },
    { topics: [{ id: 'https://openalex.org/T1' }] },
  ];
  assert.deepEqual(aggregateTopics(sources, 2), ['T1', 'T2']);
});

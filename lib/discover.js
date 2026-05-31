// lib/discover.js
const BASE = 'https://api.openalex.org';

export function worksByTopicGroupUrl({ topicIds = [], fromDate, mailto, perPage = 200 }) {
  const u = new URL(`${BASE}/works`);
  const filters = [];
  if (topicIds.length) filters.push(`primary_topic.id:${topicIds.join('|')}`);
  if (fromDate) filters.push(`from_publication_date:${fromDate}`);
  if (filters.length) u.searchParams.set('filter', filters.join(','));
  u.searchParams.set('group_by', 'primary_location.source.id');
  u.searchParams.set('per_page', String(perPage));
  if (mailto) u.searchParams.set('mailto', mailto);
  return u.toString();
}

export function parseSourceGroups(json) {
  return (json.group_by || [])
    .map((g) => ({ sourceId: (g.key || '').replace('https://openalex.org/', ''), count: g.count || 0 }))
    .filter((g) => g.sourceId && g.sourceId !== 'unknown');
}

// Rank topic IDs by how many sources list them (the registry's "topic fingerprint").
export function aggregateTopics(sources, topN = 25) {
  const freq = new Map();
  for (const s of sources) {
    for (const t of s.topics || []) {
      const id = (t.id || '').replace('https://openalex.org/', '');
      if (id) freq.set(id, (freq.get(id) || 0) + 1);
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([id]) => id);
}

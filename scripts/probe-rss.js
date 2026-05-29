import { assessFeedHealth } from '../lib/rss.js';
import { computeBackends } from '../lib/schema.js';
import { fetchText as realFetchText } from '../lib/http.js';

// Candidate feed URLs for an entry. v1: the seed-provided URL only.
// (Plan 2 adds publisher-pattern + homepage <link> discovery.)
export function candidateFeedUrls(entry) {
  return entry.rss && entry.rss.url ? [entry.rss.url] : [];
}

function dateStr(now) { return new Date(now).toISOString().slice(0, 10); }

// Fetch + health-check the feed, set rss.status, then compute backends.
export async function probeEntry(entry, { now, fetchText = realFetchText } = {}) {
  const urls = candidateFeedUrls(entry);
  let rss;
  if (urls.length === 0) {
    rss = { url: null, status: 'none', last_item_date: null, last_checked: dateStr(now) };
  } else {
    rss = { url: urls[0], status: 'dead', last_item_date: null, last_checked: dateStr(now) };
    for (const url of urls) {
      try {
        const health = assessFeedHealth(await fetchText(url), now);
        rss = { url, status: health.status, last_item_date: health.lastItemDate, last_checked: dateStr(now) };
        if (health.status === 'live') break;
      } catch {
        // try next candidate; rss stays dead
      }
    }
  }
  const withRss = { ...entry, rss };
  return { ...withRss, backends: computeBackends(withRss) };
}

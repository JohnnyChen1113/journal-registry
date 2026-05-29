// RSS/Atom parser ported from the cnsfeed prepare-digest.js (dependency-free).

function stripCDATA(s) { return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'); }

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripHTML(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

function getTag(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(stripCDATA(m[1])).trim() : '';
}

export function parseFeed(xml) {
  const items = [];
  const rssItems = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];
  for (const raw of rssItems) {
    items.push({
      title: stripHTML(getTag(raw, 'title')),
      link: getTag(raw, 'link') || getTag(raw, 'guid'),
      pubDate: getTag(raw, 'pubDate') || getTag(raw, 'dc:date'),
    });
  }
  if (items.length === 0) {
    const entries = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) || [];
    for (const raw of entries) {
      const linkMatch = raw.match(/<link[^>]*href=["']([^"']+)["']/i);
      items.push({
        title: stripHTML(getTag(raw, 'title')),
        link: linkMatch ? linkMatch[1] : '',
        pubDate: getTag(raw, 'published') || getTag(raw, 'updated'),
      });
    }
  }
  return items;
}

// Assess feed health from fetched XML. `now` is ms epoch (injected for tests).
export function assessFeedHealth(xml, now, maxAgeDays = 90) {
  const items = parseFeed(xml);
  if (!items.length) return { status: 'dead', lastItemDate: null };
  const dates = items.map((i) => Date.parse(i.pubDate)).filter((n) => !Number.isNaN(n));
  if (!dates.length) return { status: 'unknown', lastItemDate: null };
  const newest = Math.max(...dates);
  const ageDays = (now - newest) / 86400000;
  return {
    status: ageDays <= maxAgeDays ? 'live' : 'dead',
    lastItemDate: new Date(newest).toISOString().slice(0, 10),
  };
}

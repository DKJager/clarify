// Finds where a quoted statement sits in the original text so it can be marked.
// Returns {start, end} (end exclusive) or null. Never throws.

function normaliseWithMap(text) {
  let out = '';
  const map = []; // map[i] = index in original text of normalised char i
  let lastSpace = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toLowerCase();
    if (/[\p{L}\p{N}]/u.test(ch)) { out += ch; map.push(i); lastSpace = false; }
    else if (/\s/.test(ch) && !lastSpace) { out += ' '; map.push(i); lastSpace = true; }
    // other punctuation is dropped
  }
  return { out, map };
}

function bigrams(s) {
  const m = new Map();
  for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); }
  return m;
}

function dice(a, b) {
  let inter = 0, total = 0;
  for (const [, n] of a) total += n;
  for (const [, n] of b) total += n;
  if (!total) return 0;
  for (const [g, n] of a) if (b.has(g)) inter += Math.min(n, b.get(g));
  return (2 * inter) / total;
}

export function findQuote(text, quote, threshold = 0.85) {
  if (!text || !quote || quote.trim().length < 3) return null;
  const q = quote.trim();
  // 1. exact
  let i = text.indexOf(q);
  if (i >= 0) return { start: i, end: i + q.length };
  // 2. normalised
  const t = normaliseWithMap(text);
  const nq = normaliseWithMap(q).out.trim();
  if (!nq) return null;
  i = t.out.indexOf(nq);
  if (i >= 0) return { start: t.map[i], end: t.map[i + nq.length - 1] + 1 };
  // 3. sliding window by bigram similarity
  const len = nq.length;
  if (len < 8 || t.out.length < 8) return null;
  const qb = bigrams(nq);
  let best = 0, bestAt = -1, bestLen = 0;
  const lo = Math.max(8, Math.floor(len * 0.8)), hi = Math.floor(len * 1.2);
  for (const w of [len, lo, hi]) {
    if (w > t.out.length) continue;
    for (let s = 0; s + w <= t.out.length; s++) {
      const score = dice(qb, bigrams(t.out.slice(s, s + w)));
      if (score > best) { best = score; bestAt = s; bestLen = w; }
    }
  }
  if (best >= threshold && bestAt >= 0) return { start: t.map[bestAt], end: t.map[bestAt + bestLen - 1] + 1 };
  return null;
}

// statements: [{quote, ...}] -> [{start, end, index}] sorted, overlaps removed (earliest start wins)
export function locateAll(text, statements) {
  const found = [];
  statements.forEach((s, index) => {
    const r = findQuote(text, s.quote);
    if (r) found.push({ ...r, index });
  });
  found.sort((a, b) => a.start - b.start || a.index - b.index);
  const kept = [];
  let lastEnd = -1;
  for (const f of found) { if (f.start >= lastEnd) { kept.push(f); lastEnd = f.end; } }
  return kept;
}

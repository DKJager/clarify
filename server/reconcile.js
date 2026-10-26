export const VERDICTS = ['verified', 'wrong', 'unsupported', 'unsettled'];

export function normaliseVerdict(v) {
  const s = String(v || '').toLowerCase().trim();
  return VERDICTS.includes(s) ? s : 'unsettled';
}

// rulings: [{judge, verdict, reason, changed?}] -> {mark, votes}
export function reconcileStatement(rulings) {
  const votes = rulings.map((r) => normaliseVerdict(r.verdict));
  const counts = {};
  for (const v of votes) counts[v] = (counts[v] || 0) + 1;
  const need = Math.floor(votes.length / 2) + 1;
  let mark = 'unsettled';
  for (const [v, n] of Object.entries(counts)) if (n >= need) mark = v;
  return { mark, counts };
}

export function summarise(marks) {
  const total = marks.length;
  const c = { verified: 0, wrong: 0, unsupported: 0, unsettled: 0 };
  for (const m of marks) c[normaliseVerdict(m)]++;
  const percent = total ? Math.round((c.verified / total) * 100) : 0;
  const parts = [];
  if (c.wrong) parts.push(`${c.wrong} wrong`);
  if (c.unsettled) parts.push(`${c.unsettled} unsettled`);
  if (c.unsupported) parts.push(`${c.unsupported} unsupported`);
  const line = `${c.verified} of ${total} statements verified, ${percent}%` + (parts.length ? `; ${parts.join(', ')}` : '');
  return { total, ...c, percent, line };
}

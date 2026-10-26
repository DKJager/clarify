import { locateAll } from './match.js';
const $ = (id) => document.getElementById(id);
const ORDER = ['finding', 'searching', 'judging', 'rebuttal', 'reconciling'];
const ICON = { verified: '✓', wrong: '✗', unsettled: '~', unsupported: '?' };
const LABEL = { verified: 'Verified', wrong: 'Wrong', unsettled: 'Unsettled', unsupported: 'Unsupported' };
let current = ''; // text being checked

const text = $('text'), go = $('go');
text.addEventListener('input', () => { go.disabled = !text.value.trim(); });

function show(...ids) { for (const id of ['input', 'progress', 'message', 'result']) $(id).hidden = !ids.includes(id); }

function setStep(stage) {
  const i = ORDER.indexOf(stage);
  [...$('steps').children].forEach((li, k) => {
    li.className = k < i ? 'done' : k === i ? 'active' : '';
  });
}

function stepLabel(e) {
  const map = { finding: 'Finding statements', searching: `Searching sources (${e.count || ''})`, judging: 'Judges ruling', rebuttal: 'Rebuttal', reconciling: 'Reconciling' };
  return map[e.stage];
}

function message(msg, isErr, withRetry) {
  const el = $('message');
  el.className = 'msg' + (isErr ? ' err' : '');
  el.textContent = msg;
  if (withRetry) {
    const b = document.createElement('button');
    b.textContent = 'Retry'; b.className = 'secondary'; b.style.marginLeft = '1rem';
    b.onclick = run; el.append(b);
  }
  show('input', 'message');
}

function safeUrl(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } }

function card(s) {
  const c = document.createElement('div'); c.className = 'card ' + s.mark;
  const b = document.createElement('span'); b.className = 'badge ' + s.mark; b.textContent = `${ICON[s.mark]} ${LABEL[s.mark]}`;
  const st = document.createElement('div'); st.className = 'statement'; st.append(b, s.statement);
  c.append(st);
  const reasons = s.judges.map((j) => j.reason).filter(Boolean);
  const best = s.judges.find((j) => j.verdict === s.mark) || s.judges[0];
  if (best) { const w = document.createElement('div'); w.className = 'why'; w.textContent = best.reason; c.append(w); }
  const v = document.createElement('div'); v.className = 'votes';
  for (const j of s.judges) {
    const e = document.createElement('span'); e.className = 'vote';
    e.textContent = `${j.judge}: ${j.verdict}` + (j.changed ? ` (was ${j.firstVerdict})` : '');
    e.title = j.reason; v.append(e);
  }
  c.append(v);
  const src = document.createElement('div'); src.className = 'sources';
  const seen = new Set();
  const links = s.sources.map((x) => [safeUrl(x.url), x.title]).filter(([u]) => u).filter(([u, t]) => { const k = (t && t !== u ? t : new URL(u).hostname).replace(/^www\./, ''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4);
  if (links.length) {
    for (const [u, t] of links) { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = (t && t !== u ? t : new URL(u).hostname).replace(/^www\./, '').slice(0, 40); src.append(a); }
  } else { src.textContent = 'No sources retrieved.'; src.className += ' muted'; }
  c.append(src);
  return c;
}

function markedText(text, statements) {
  const box = document.createElement('div');
  let pos = 0;
  for (const m of locateAll(text, statements)) {
    const s = statements[m.index];
    if (m.start > pos) box.append(text.slice(pos, m.start));
    const mk = document.createElement('span');
    mk.className = 'mk ' + s.mark; mk.tabIndex = 0;
    const ic = document.createElement('span'); ic.className = 'ic'; ic.textContent = ICON[s.mark]; ic.setAttribute('aria-label', LABEL[s.mark]);
    mk.append(ic, text.slice(m.start, m.end));
    const tip = document.createElement('span'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip');
    const h = document.createElement('strong'); h.textContent = LABEL[s.mark]; tip.append(h);
    for (const j of s.judges) {
      const l = document.createElement('span'); l.className = 'tl';
      l.textContent = `${j.judge}: ${j.verdict}${j.changed ? ` (was ${j.firstVerdict})` : ''}. ${j.reason}`;
      tip.append(l);
    }
    mk.append(tip);
    box.append(mk);
    pos = m.end;
  }
  if (pos < text.length) box.append(text.slice(pos));
  return box;
}

function render(result) {
  if (!result.statements.length) { message('No factual statements to check here.', false); return; }
  $('banner').textContent = result.summary.line;
  $('marked').replaceChildren(markedText(current.slice(0, 6000), result.statements));
  $('cards').replaceChildren(...result.statements.map(card));
  show('result');
}

async function run() {
  current = text.value.trim();
  if (!current) return;
  show('progress'); setStep('finding'); $('banner').textContent = '';
  const timer = setTimeout(() => ctrl.abort(), 40000);
  const ctrl = new AbortController();
  try {
    const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: current }), signal: ctrl.signal });
    if (!r.ok || !r.body) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'The check could not start.'); }
    const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        const e = JSON.parse(line);
        if (e.stage === 'error') throw new Error(e.message);
        if (e.stage === 'result') { clearTimeout(timer); render(e.result); return; }
        if (ORDER.includes(e.stage)) setStep(e.stage);
      }
    }
    throw new Error('The check ended early.');
  } catch (e) {
    clearTimeout(timer);
    message(e.name === 'AbortError' ? 'That took too long (over 30 seconds). Your text is kept.' : `Something went wrong: ${e.message}. Your text is kept.`, true, true);
  }
}

go.onclick = run;
$('again').onclick = () => { text.value = ''; go.disabled = true; show('input'); };

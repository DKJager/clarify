import { locateAll } from './match.js';
import { buildReportHtml, buildReportText } from './report.js';
const $ = (id) => document.getElementById(id);
const ORDER = ['finding', 'searching', 'judging', 'rebuttal', 'reconciling'];
const ICON = { verified: '✓', wrong: '✗', unsettled: '~', unsupported: '?' };
const LABEL = { verified: 'Verified', wrong: 'Wrong', unsettled: 'Unsettled', unsupported: 'Unsupported' };
let current = '';
let lastResult = null;
const SESSION_MAX = 5;
const used = () => { try { return Number(sessionStorage.getItem('clarifyChecks') || 0); } catch { return 0; } };
const count = () => { try { sessionStorage.setItem('clarifyChecks', String(used() + 1)); } catch { /* storage unavailable: server limit still applies */ } };
const TIMEOUT = Number(new URLSearchParams(location.search).get('timeout')) || 40000; // text being checked

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
  } else { src.textContent = s.judges.some((j) => /Calculator/.test(j.judge)) ? 'Checked by recalculation, no web source needed.' : 'No sources retrieved.'; src.className += ' muted'; }
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
  lastResult = result;
  const empty = !result.statements.length;
  for (const id of ['marked', 'download', 'copy']) $(id).hidden = empty;
  if (empty) { $('banner').textContent = 'No factual statements to check here.'; $('cards').replaceChildren(); show('result'); return; }
  $('banner').textContent = result.summary.line;
  $('marked').replaceChildren(markedText(current.slice(0, 6000), result.statements));
  $('cards').replaceChildren(...result.statements.map(card));
  show('result');
}

async function run() {
  current = text.value.trim();
  if (!current) return;
  if (used() >= SESSION_MAX) { message(`You have used your ${SESSION_MAX} free checks for this visit. You can still try the example.`, false, false); return; }
  count();
  show('progress'); setStep('finding'); $('banner').textContent = '';
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  const ctrl = new AbortController();
  try {
    const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: current }), signal: ctrl.signal });
    if (!r.ok || !r.body) { const d = await r.json().catch(() => ({})); const err = new Error(d.error || 'The check could not start.'); err.limit = !!d.code; throw err; }
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
    if (e.limit) { message(e.message + ' You can still try the example.', false, false); return; }
    message(e.name === 'AbortError' ? 'That took too long (over 30 seconds). Your text is kept.' : `Something went wrong: ${e.message}. Your text is kept.`, true, true);
  }
}

const MAX = 6000;
function setText(t, from) {
  let note = '';
  if (t.length > MAX) { t = t.slice(0, MAX); note = `Your text was long, so only the first ${MAX.toLocaleString()} characters will be checked.`; }
  text.value = t; go.disabled = !t.trim();
  const n = $('notice'); n.textContent = note; n.hidden = !note;
  if (!t.trim() && from) { n.textContent = `No readable text found in ${from}. If it is a scan or image, paste the text instead.`; n.hidden = false; }
}

async function pdfText(buf) {
  const pdfjs = await import('/vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages && pages.join('').length < MAX * 2; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((x) => x.str + (x.hasEOL ? '\n' : '')).join(' ').replace(/ +/g, ' ').trim());
  }
  return pages.join('\n\n');
}

async function loadFile(f) {
  try {
    if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') setText(await pdfText(await f.arrayBuffer()), f.name);
    else if (/\.(txt|md|markdown)$/i.test(f.name) || f.type.startsWith('text/')) setText(await f.text(), f.name);
    else { const n = $('notice'); n.textContent = 'That file type is not supported yet. Use .txt, .md or .pdf, or paste the text.'; n.hidden = false; }
  } catch (e) { const n = $('notice'); n.textContent = `Could not read that file (${e.message}). Paste the text instead.`; n.hidden = false; }
}

for (const ev of ['dragenter', 'dragover']) text.addEventListener(ev, (e) => { e.preventDefault(); text.classList.add('over'); });
for (const ev of ['dragleave', 'drop']) text.addEventListener(ev, () => text.classList.remove('over'));
text.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) { e.preventDefault(); loadFile(f); } });
text.addEventListener('paste', () => setTimeout(() => { if (text.value.length > MAX) setText(text.value); }, 0));

// Voice entry (browser's built-in speech recognition; hidden where unsupported)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const mic = $('mic'); mic.hidden = false;
  let rec = null, base = '';
  mic.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-US';
    base = text.value ? text.value.trimEnd() + ' ' : '';
    rec.onresult = (e) => { let t = ''; for (const r of e.results) t += r[0].transcript; setText(base + t); };
    rec.onend = () => { rec = null; mic.textContent = '\u{1F3A4} Speak'; };
    rec.onerror = () => { const n = $('notice'); n.textContent = 'The microphone could not be used. Check the browser permission, or paste the text.'; n.hidden = false; };
    rec.start(); mic.textContent = '\u25A0 Stop';
  };
}

go.onclick = run;
$('again').onclick = () => { text.value = ''; go.disabled = true; show('input'); };

$('example').onclick = async () => {
  try {
    const ex = await (await fetch('example.json')).json();
    setText(ex.text); current = ex.text; render(ex.result);
  } catch (e) { message(`Could not load the example: ${e.message}`, true, false); }
};

$('download').onclick = () => {
  if (!lastResult) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([buildReportHtml(lastResult)], { type: 'text/html' }));
  a.download = 'clarify-report.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('copy').onclick = async () => {
  if (!lastResult) return;
  try { await navigator.clipboard.writeText(buildReportText(lastResult)); } catch { const t = document.createElement('textarea'); t.value = buildReportText(lastResult); document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  $('copied').hidden = false; setTimeout(() => { $('copied').hidden = true; }, 1500);
};

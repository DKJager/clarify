// Builds the downloadable one-page report and the copy-as-text version.
const LABEL = { verified: 'Verified', wrong: 'Wrong', unsettled: 'Unsettled', unsupported: 'Unsupported' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okUrl = (u) => { try { return /^https?:$/.test(new URL(u).protocol) ? u : null; } catch { return null; } };

export function buildReportText(result, when = new Date()) {
  const L = [`Clarify report - ${when.toLocaleString()}`, result.summary.line, ''];
  result.statements.forEach((s, i) => {
    L.push(`${i + 1}. [${LABEL[s.mark]}] ${s.statement}`);
    for (const j of s.judges) L.push(`   ${j.judge}: ${j.verdict}${j.changed ? ` (was ${j.firstVerdict})` : ''} - ${j.reason}`);
    const urls = s.sources.map((x) => okUrl(x.url)).filter(Boolean).slice(0, 4);
    L.push(urls.length ? `   Sources: ${urls.join(' ')}` : '   Sources: none retrieved');
    L.push('');
  });
  L.push('Checked by web search (Amazon Nova grounding) and three independent AI judges with one rebuttal round. AI can still be wrong; use the sources.');
  return L.join('\n');
}

export function buildReportHtml(result, when = new Date()) {
  const rows = result.statements.map((s, i) => {
    const votes = s.judges.map((j) => `<li><b>${esc(j.judge)}</b>: ${esc(j.verdict)}${j.changed ? ` (was ${esc(j.firstVerdict)})` : ''} &ndash; ${esc(j.reason)}</li>`).join('');
    const links = s.sources.map((x) => [okUrl(x.url), x.title]).filter(([u]) => u).slice(0, 4)
      .map(([u]) => `<a href="${esc(u)}">${esc(u)}</a>`).join('<br>') || (s.judges.some((j) => /Calculator/.test(j.judge)) ? '<i>Checked by recalculation</i>' : '<i>No sources retrieved</i>');
    return `<section class="${esc(s.mark)}"><h3>${i + 1}. <span class="b">${esc(LABEL[s.mark])}</span> ${esc(s.statement)}</h3><ul>${votes}</ul><p class="src">${links}</p></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Clarify report</title>
<style>body{font:14px/1.5 system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#1f2328}h1{margin:0}h2{margin:.2rem 0 1rem}
section{border-left:5px solid #6e7781;padding:.2rem 0 .2rem .8rem;margin:.9rem 0;break-inside:avoid}section.verified{border-color:#1a7f37}section.wrong{border-color:#cf222e}section.unsettled{border-color:#bf8700}
h3{font-size:1rem;margin:.2rem 0}.b{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;background:#eaeef2;border-radius:99px;padding:.1rem .5rem}ul{margin:.2rem 0;padding-left:1.1rem}.src{font-size:.8rem;word-break:break-all}
.meta,.foot{color:#6e7781;font-size:.8rem}</style></head><body>
<h1>Clarify</h1><div class="meta">Documented check &middot; ${esc(when.toLocaleString())}</div>
<h2>${esc(result.summary.line)}</h2>${rows}
<p class="foot">Each statement was searched on the live web (Amazon Nova grounding) and ruled on by three independent AI models with one rebuttal round. AI can still be wrong; use the sources.</p>
</body></html>`;
}

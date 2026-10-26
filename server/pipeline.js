import { converse, ground, parseJson, MODELS, withTimeout } from './bedrock.js';
import { FINDER_SYSTEM, GROUND_SYSTEM, JUDGE_SYSTEM, REBUTTAL_SYSTEM } from './prompts.js';
import { checkCalc } from './calc.js';
import { reconcileStatement, summarise, normaliseVerdict } from './reconcile.js';

const STAGE_MS = 15000;
const TOTAL_MS = 30000;
const judgeName = (id) => (/nova/.test(id) ? 'Amazon Nova' : /mistral/.test(id) ? 'Mistral Large' : /gpt-oss/.test(id) ? 'OpenAI gpt-oss' : id.split(/[.:/]/)[1] || id);

export async function runCheck(text, emit = () => {}) {
  const started = Date.now();
  const left = () => Math.max(2000, Math.min(STAGE_MS, TOTAL_MS - (Date.now() - started)));

  emit({ stage: 'finding' });
  const found = parseJson(await converse(MODELS.finder, FINDER_SYSTEM, text, { ms: left(), maxTokens: 1100 }));
  const statements = (found?.statements || []).slice(0, 8).map((s, i) => ({ id: i + 1, statement: String(s.statement || ''), quote: String(s.quote || ''), calc: checkCalc(s.calc, String(s.statement || '')) })).filter((s) => s.statement);
  emit({ stage: 'found', count: statements.length, statements });
  if (!statements.length) return { statements: [], summary: summarise([]), ms: Date.now() - started };

  emit({ stage: 'searching', count: statements.length });
  const evidence = await Promise.all(statements.map(async (s) => {
    if (s.calc) return { text: '', sources: [] };
    try { return await ground(GROUND_SYSTEM, s.statement, { ms: left() }); }
    catch (e) { return { text: '', sources: [], error: e.message }; }
  }));
  emit({ stage: 'searched' });

  emit({ stage: 'judging' });
  const evText = (e) => (e.text ? `Evidence:\n${e.text}\nSources: ${e.sources.map((x) => x.url).join(', ') || 'none'}` : 'Evidence: no sources retrieved.');
  const calcRuling = (s) => [{ judge: 'Calculator (code)', verdict: s.calc.verdict, reason: s.calc.reason, changed: false }];
  const round1 = await Promise.all(statements.map((s, i) => s.calc ? calcRuling(s) : Promise.all(MODELS.judges.map(async (id) => {
    try {
      const r = parseJson(await converse(id, JUDGE_SYSTEM, `Statement: ${s.statement}\nOriginal sentence from the answer: ${s.quote}\n\n${evText(evidence[i])}`, { ms: left(), maxTokens: 400 }));
      return { judge: judgeName(id), model: id, verdict: normaliseVerdict(r?.verdict), reason: r?.reason || 'No reason given.', source: r?.source || '' };
    } catch (e) {
      return { judge: judgeName(id), model: id, verdict: 'unsettled', reason: `Judge unavailable: ${e.message}`, failed: true, source: '' };
    }
  }))));
  emit({ stage: 'rebuttal' });

  const round2 = await Promise.all(statements.map((s, i) => s.calc ? round1[i] : Promise.all(round1[i].map(async (mine, j) => {
    if (mine.failed) return { ...mine, changed: false };
    const others = round1[i].filter((_, k) => k !== j).map((o) => `${o.judge}: ${o.verdict} - ${o.reason}`).join('\n');
    try {
      const r = parseJson(await converse(mine.model, REBUTTAL_SYSTEM, `Statement: ${s.statement}\nOriginal sentence from the answer: ${s.quote}\n\n${evText(evidence[i])}\n\nYour ruling: ${mine.verdict} - ${mine.reason}\nOther judges:\n${others}`, { ms: left(), maxTokens: 300 }));
      const v = normaliseVerdict(r?.verdict || mine.verdict);
      return { ...mine, verdict: v, reason: r?.reason || mine.reason, changed: v !== mine.verdict, firstVerdict: mine.verdict };
    } catch { return { ...mine, changed: false }; }
  }))));

  emit({ stage: 'reconciling' });
  const results = statements.map((s, i) => {
    const { mark } = reconcileStatement(round2[i]);
    return { ...s, mark, judges: round2[i].map(({ model, ...j }) => j), sources: evidence[i].sources, evidence: evidence[i].text, searchError: evidence[i].error || null };
  });
  return { statements: results, summary: summarise(results.map((r) => r.mark)), ms: Date.now() - started };
}

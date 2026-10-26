import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReportHtml, buildReportText } from '../public/report.js';

const ex = JSON.parse(fs.readFileSync(new URL('../public/example.json', import.meta.url))).result;

test('report html contains every statement and source link', () => {
  const html = buildReportHtml(ex);
  for (const s of ex.statements) {
    assert.ok(html.includes(s.statement.replace(/&/g, '&amp;')), s.statement);
    for (const x of s.sources.slice(0, 4)) assert.ok(html.includes(x.url.replace(/&/g, '&amp;')), x.url);
  }
  assert.ok(html.includes(ex.summary.line));
});
test('report text contains every statement', () => {
  const t = buildReportText(ex);
  for (const s of ex.statements) assert.ok(t.includes(s.statement));
});
test('report html escapes hostile text and rejects non-http links', () => {
  const evil = { summary: { line: 'x' }, statements: [{ statement: '<img src=x onerror=alert(1)>', mark: 'wrong', judges: [{ judge: 'J', verdict: 'wrong', reason: '<script>', changed: false }], sources: [{ url: 'javascript:alert(1)', title: 't' }] }] };
  const html = buildReportHtml(evil);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('javascript:'));
});

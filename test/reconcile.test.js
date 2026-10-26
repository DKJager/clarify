import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileStatement, summarise } from '../server/reconcile.js';

test('majority wins', () => {
  const r = reconcileStatement([{ verdict: 'wrong' }, { verdict: 'wrong' }, { verdict: 'verified' }]);
  assert.equal(r.mark, 'wrong');
});
test('three-way split is unsettled', () => {
  const r = reconcileStatement([{ verdict: 'wrong' }, { verdict: 'verified' }, { verdict: 'unsupported' }]);
  assert.equal(r.mark, 'unsettled');
});
test('all unsupported stays unsupported', () => {
  const r = reconcileStatement([{ verdict: 'unsupported' }, { verdict: 'unsupported' }, { verdict: 'unsupported' }]);
  assert.equal(r.mark, 'unsupported');
});
test('garbage verdict becomes unsettled vote', () => {
  const r = reconcileStatement([{ verdict: 'banana' }, { verdict: 'verified' }, { verdict: 'verified' }]);
  assert.equal(r.mark, 'verified');
});
test('two judges only: tie is unsettled', () => {
  assert.equal(reconcileStatement([{ verdict: 'wrong' }, { verdict: 'verified' }]).mark, 'unsettled');
});
test('summary line and percentage', () => {
  const s = summarise(['verified', 'verified', 'verified', 'verified', 'wrong', 'unsettled', 'wrong']);
  assert.equal(s.percent, 57);
  assert.match(s.line, /^4 of 7 statements verified, 57%/);
  assert.equal(s.wrong, 2);
});
test('empty summary', () => {
  assert.equal(summarise([]).percent, 0);
});

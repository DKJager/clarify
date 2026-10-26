import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, checkCalc } from '../server/calc.js';

const ARR = '200 customers x $99 per month x 12 months + 20 annual subscribers x $1,000 = $257,880';
test('evaluate basics', () => {
  assert.equal(evaluate('200*99*12+20*1000'), 257600);
  assert.equal(evaluate('(4-3)/4*100'), 25);
  assert.equal(evaluate('2^3'), 8);
});
test('evaluate refuses code', () => {
  assert.throws(() => evaluate('process.exit()'));
  assert.throws(() => evaluate('1+'));
});
test('wrong sum is caught', () => {
  const r = checkCalc({ expression: '200*99*12+20*1000', claimed: '257880' }, ARR);
  assert.equal(r.verdict, 'wrong');
});
test('right sum is verified', () => {
  const r = checkCalc({ expression: '200*99*12+20*1000', claimed: '257600' }, ARR.replace('257,880', '257,600'));
  assert.equal(r.verdict, 'verified');
});
test('approximate claim within 1%', () => {
  assert.equal(checkCalc({ expression: '300000*0.5', claimed: '150000', approx: true }, '0.5 of 300000 is 150000').verdict, 'verified');
});
test('invented numbers fall back to judges', () => {
  assert.equal(checkCalc({ expression: '7*7', claimed: '49' }, 'The sum is 49'), null);
});

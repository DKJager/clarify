import test from 'node:test';
import assert from 'node:assert/strict';
import { findQuote, locateAll } from '../public/match.js';

const T = 'Apollo 11 landed on the Moon on July 20, 1969. The mission carried a crew of four astronauts.  Michael Collins stayed in orbit.';

test('exact quote', () => {
  const r = findQuote(T, 'The mission carried a crew of four astronauts.');
  assert.equal(T.slice(r.start, r.end), 'The mission carried a crew of four astronauts.');
});
test('changed spacing, case and punctuation', () => {
  const r = findQuote(T, 'the mission  carried a crew of four astronauts');
  assert.ok(r);
  assert.match(T.slice(r.start, r.end), /^The mission carried a crew of four astronauts/);
});
test('slightly reworded quote still matches', () => {
  const r = findQuote(T, 'The mission carried a crew of four astronaut');
  assert.ok(r);
  assert.match(T.slice(r.start, r.end), /crew of four/);
});
test('unrelated quote is left unmarked', () => {
  assert.equal(findQuote(T, 'Paris is the capital of France and has many museums'), null);
});
test('empty or tiny quote is null, never throws', () => {
  assert.equal(findQuote(T, ''), null);
  assert.equal(findQuote('', 'abc def'), null);
  assert.equal(findQuote(T, 'a'), null);
});
test('overlapping marks: earliest start wins', () => {
  const kept = locateAll(T, [
    { quote: 'landed on the Moon on July 20, 1969. The mission' },
    { quote: 'The mission carried a crew of four astronauts.' },
    { quote: 'Michael Collins stayed in orbit.' },
    { quote: 'nothing like this anywhere at all in text' },
  ]);
  assert.deepEqual(kept.map((k) => k.index), [0, 2]);
});

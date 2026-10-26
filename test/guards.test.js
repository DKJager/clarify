import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuards } from '../server/guards.js';

const clock = (start = Date.UTC(2026, 9, 26, 12)) => { let t = start; return { now: () => t, tick: (ms) => { t += ms; } }; };

test('sixth check from one visitor is refused', () => {
  const c = clock(); const g = createGuards({ now: c.now, perIpChecks: 5 });
  for (let i = 0; i < 5; i++) { assert.equal(g.admit('1.1.1.1').ok, true); c.tick(2000); }
  const r = g.admit('1.1.1.1');
  assert.equal(r.ok, false); assert.equal(r.code, 'visitor_cap');
});
test('visitor allowance returns after the window', () => {
  const c = clock(); const g = createGuards({ now: c.now, perIpChecks: 1, perIpWindowMs: 3600000 });
  assert.ok(g.admit('a').ok); c.tick(2000); assert.ok(!g.admit('a').ok); c.tick(3600000); assert.ok(g.admit('a').ok);
});
test('another visitor is not affected', () => {
  const c = clock(); const g = createGuards({ now: c.now, perIpChecks: 1 });
  assert.ok(g.admit('a').ok); c.tick(2000); assert.ok(g.admit('b').ok);
});
test('rate limit: more than 3 per second is refused', () => {
  const c = clock(); const g = createGuards({ now: c.now, perSecond: 3, perIpChecks: 99 });
  for (let i = 0; i < 3; i++) assert.ok(g.admit('a').ok);
  assert.equal(g.admit('a').code, 'rate');
  c.tick(1100); assert.ok(g.admit('a').ok);
});
test('daily cap reached, then resets next day', () => {
  const c = clock(); const g = createGuards({ now: c.now, dailyCap: 2, perIpChecks: 99 });
  assert.ok(g.admit('a').ok); c.tick(2000); assert.ok(g.admit('b').ok); c.tick(2000);
  assert.equal(g.admit('c').code, 'daily_cap');
  c.tick(24 * 3600 * 1000); assert.ok(g.admit('c').ok);
});
test('spend stop acts like a cap', () => {
  const c = clock(); const g = createGuards({ now: c.now, dailyCap: 999, dailySpendLimit: 0.1, costPerCheck: 0.05, perIpChecks: 99 });
  assert.ok(g.admit('a').ok); c.tick(2000); assert.ok(g.admit('b').ok); c.tick(2000);
  assert.equal(g.admit('c').code, 'daily_cap');
});

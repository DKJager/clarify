// Deterministic arithmetic check: a tiny safe expression parser (no eval) plus a comparison with the claimed result.

export function evaluate(expr) {
  const src = String(expr || '').replace(/[,$\s]/g, '').replace(/[×x]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!src || src.length > 200 || /[^0-9.+\-*/^()%]/.test(src)) throw new Error('not plain arithmetic');
  let i = 0;
  const peek = () => src[i];
  function num() {
    const m = /^\d*\.?\d+/.exec(src.slice(i));
    if (!m) throw new Error('number expected');
    i += m[0].length;
    let v = parseFloat(m[0]);
    if (peek() === '%') { i++; v /= 100; }
    return v;
  }
  function atom() {
    if (peek() === '(') { i++; const v = sum(); if (peek() !== ')') throw new Error('missing )'); i++; return v; }
    if (peek() === '-') { i++; return -atom(); }
    return num();
  }
  function pow() { const b = atom(); if (peek() === '^') { i++; return Math.pow(b, pow()); } return b; }
  function prod() { let v = pow(); while (peek() === '*' || peek() === '/') { const o = src[i++]; const r = pow(); v = o === '*' ? v * r : v / r; } return v; }
  function sum() { let v = prod(); while (peek() === '+' || peek() === '-') { const o = src[i++]; const r = prod(); v = o === '+' ? v + r : v - r; } return v; }
  const v = sum();
  if (i !== src.length || !Number.isFinite(v)) throw new Error('could not read expression');
  return v;
}

const numbersIn = (s) => (String(s).replace(/,/g, '').match(/\d*\.?\d+/g) || []).map(Number);

// calc: {expression, claimed, approx}; statement: the full statement text.
// Returns {verdict, reason} or null when the calculation cannot be trusted (caller falls back to the judges).
export function checkCalc(calc, statement) {
  if (!calc || typeof calc !== 'object') return null;
  const claimed = Number(String(calc.claimed).replace(/[,$\s]/g, ''));
  if (!Number.isFinite(claimed)) return null;
  let value;
  try { value = evaluate(calc.expression); } catch { return null; }
  // every number used must really appear in the statement (guards against an invented expression)
  const inStatement = new Set(numbersIn(statement));
  const used = numbersIn(calc.expression);
  const pctAllowed = (n) => inStatement.has(n) || inStatement.has(n * 100) || inStatement.has(n / 100);
  if (!used.every((n) => inStatement.has(n) || pctAllowed(n) || n === 100 || n === 12)) return null;
  const decimals = (String(calc.claimed).split('.')[1] || '').replace(/\D/g, '').length;
  const tol = calc.approx ? Math.abs(value) * 0.01 : decimals ? 0.5 * Math.pow(10, -decimals) : 0.5;
  const fmt = (n) => Number(n.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
  const ok = Math.abs(value - claimed) <= tol;
  return {
    verdict: ok ? 'verified' : 'wrong',
    reason: ok ? `Recomputed in code: ${calc.expression} = ${fmt(value)}, which matches the stated ${fmt(claimed)}.` : `Recomputed in code: ${calc.expression} = ${fmt(value)}, not the stated ${fmt(claimed)}.`,
  };
}

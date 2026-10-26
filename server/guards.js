// Limits that keep the public demo safe and cheap. Pure and clock-injectable so they can be tested.
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? Number(process.env[k]) : d);

export function createGuards({
  perSecond = env('RATE_PER_SECOND', 3),
  perIpChecks = env('CHECKS_PER_IP', 5),
  perIpWindowMs = env('IP_WINDOW_HOURS', 6) * 3600 * 1000,
  dailyCap = env('DAILY_CAP', 50),
  dailySpendLimit = env('DAILY_SPEND_USD', 5),
  costPerCheck = env('COST_PER_CHECK_USD', 0.05),
  now = () => Date.now(),
} = {}) {
  const hits = new Map();   // ip -> recent request times (rate limit)
  const checks = new Map(); // ip -> check start times (per-visitor allowance)
  let day = '', dayCount = 0;
  const dayKey = () => new Date(now()).toISOString().slice(0, 10);

  return {
    // Call once per /api/check request, before doing any work.
    admit(ip) {
      const t = now();
      const recent = (hits.get(ip) || []).filter((x) => t - x < 1000);
      if (recent.length >= perSecond) return { ok: false, status: 429, code: 'rate', message: 'Too many requests at once. Wait a moment and try again.' };
      recent.push(t); hits.set(ip, recent);

      if (dayKey() !== day) { day = dayKey(); dayCount = 0; }
      if (dayCount >= dailyCap || dayCount * costPerCheck >= dailySpendLimit) {
        return { ok: false, status: 429, code: 'daily_cap', message: "Today's free checks are used up. Try the example, or come back tomorrow." };
      }
      const mine = (checks.get(ip) || []).filter((x) => t - x < perIpWindowMs);
      if (mine.length >= perIpChecks) {
        return { ok: false, status: 429, code: 'visitor_cap', message: `You have used your ${perIpChecks} free checks for now. Try the example, or come back later.` };
      }
      mine.push(t); checks.set(ip, mine); dayCount++;
      return { ok: true };
    },
    stats: () => ({ day, dayCount, dailyCap }),
  };
}

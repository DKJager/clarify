import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runCheck } from './pipeline.js';
import { createGuards } from './guards.js';

const guards = createGuards();
// Behind the Cloudflare tunnel the real visitor address arrives in cf-connecting-ip.
const clientIp = (req) => req.headers['cf-connecting-ip'] || req.ip || 'unknown';

const app = express();
const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(pub));
app.use('/vendor/pdfjs', express.static(path.join(pub, '..', 'node_modules', 'pdfjs-dist', 'build')));

const MAX_CHARS = 6000;

app.post('/api/check', async (req, res) => {
  const text = String(req.body?.text || '').slice(0, MAX_CHARS).trim();
  if (!text) return res.status(400).json({ error: 'Nothing to check.' });
  const gate = guards.admit(clientIp(req));
  if (!gate.ok) return res.status(gate.status).json({ error: gate.message, code: gate.code });
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-store');
  res.flushHeaders?.();
  const send = (o) => res.write(JSON.stringify(o) + '\n');
  try {
    const result = await runCheck(text, send);
    send({ stage: 'result', result });
  } catch (e) {
    send({ stage: 'error', message: e.message });
  }
  res.end();
});

const port = process.env.PORT || 3000;
if (process.argv[1] === fileURLToPath(import.meta.url)) app.listen(port, () => console.log(`Clarify on http://localhost:${port}`));
export default app;

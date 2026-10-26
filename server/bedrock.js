import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-2';
const client = new BedrockRuntimeClient({ region });

export const MODELS = {
  finder: process.env.FINDER_MODEL || 'us.amazon.nova-2-lite-v1:0',
  grounding: process.env.GROUNDING_MODEL || 'us.amazon.nova-2-lite-v1:0',
  judges: (process.env.JUDGE_MODELS ||
    'us.amazon.nova-2-lite-v1:0,mistral.mistral-large-3-675b-instruct,openai.gpt-oss-120b-1:0')
    .split(',').map((s) => s.trim()).filter(Boolean),
};

export function withTimeout(promise, ms, label) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timed out after ${ms / 1000}s`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

function blocksText(content = []) {
  return content.map((b) => b.text || '').join('').trim();
}

function collectUrls(obj, out = new Map()) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { obj.forEach((o) => collectUrls(o, out)); return out; }
  const url = obj.url || obj.uri;
  if (typeof url === 'string' && /^https?:\/\//.test(url)) out.set(url, obj.title || obj.domain || url);
  for (const v of Object.values(obj)) if (v && typeof v === 'object') collectUrls(v, out);
  return out;
}

export async function converse(modelId, system, user, { maxTokens = 700, temperature = 0.1, ms = 15000 } = {}) {
  const cmd = new ConverseCommand({
    modelId,
    system: [{ text: system }],
    messages: [{ role: 'user', content: [{ text: user }] }],
    inferenceConfig: { maxTokens, temperature },
  });
  const res = await withTimeout(client.send(cmd), ms, modelId);
  return blocksText(res.output?.message?.content);
}

export async function ground(system, statement, { ms = 15000 } = {}) {
  const cmd = new ConverseCommand({
    modelId: MODELS.grounding,
    system: [{ text: system }],
    messages: [{ role: 'user', content: [{ text: `Statement to check: ${statement}` }] }],
    toolConfig: { tools: [{ systemTool: { name: 'nova_grounding' } }] },
    inferenceConfig: { maxTokens: 700, temperature: 0.1 },
  });
  const res = await withTimeout(client.send(cmd), ms, 'grounding');
  const content = res.output?.message?.content || [];
  const text = blocksText(content);
  const urls = collectUrls(content);
  return { text, sources: [...urls].map(([url, title]) => ({ url, title })), raw: content };
}

export function parseJson(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

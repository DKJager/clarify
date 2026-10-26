# Clarify, by 3Dogs Nexus

Drop in any AI answer and find out, statement by statement, whether it is real.

Paste text, drop a `.txt` / `.md` / `.pdf`, or speak it. Clarify pulls out the factual statements, searches the live web for each one, has three AI models from different makers rule on it independently, lets them see each other's rulings once, and settles on a verdict. Every statement comes back marked **verified**, **wrong**, **unsettled** or **unsupported**, with sources, each judge's vote and a one-line reason. You can download or copy the documented result.

Built for the Devpost *Build With AI: Basics* hackathon. **Demo video:** https://youtu.be/VmEKa2-L_mU

## How a check works

1. **Find statements.** One model lists the checkable factual statements and rewrites each so it stands on its own ("the company" becomes the company's name). A calculation is kept whole..
2. **Search sources.** Amazon Nova's built-in web grounding searches each statement, in parallel.
3. **Sums are recomputed in code.** A calculation with a stated result is not left to the models: a small safe calculator recomputes it and marks it wrong if the result differs (for example an ARR total off by $280).
4. **Judges rule.** Three models (Amazon Nova 2 Lite, Mistral Large 3, OpenAI gpt-oss-120b) each read the statement and the evidence and rule independently.
5. **Rebuttal.** Each judge sees the other two rulings and keeps or changes its verdict. Changes are shown.
6. **Reconcile.** Majority wins; no majority is "unsettled".

A typical 5 to 8 statement paragraph takes 10 to 15 seconds. Each stage has a 15 second limit and the whole check 30 seconds.

Nothing is stored: no accounts, no database.

## Run it

Needs Node 22 and AWS credentials with Amazon Bedrock access to the three models.

```bash
cp .env.example .env     # then fill in your AWS settings (never commit .env)
npm install
npm start                # http://localhost:3000
npm test
```

The server reads credentials from the standard AWS environment or an instance role. Model IDs can be overridden with `FINDER_MODEL`, `GROUNDING_MODEL` and `JUDGE_MODELS` (see `.env.example`).

## Limits

To keep a public demo safe: 5 checks per visitor per 6 hours, 3 requests per second per visitor, 50 checks per day across everyone, and a daily spend stop. Tune with `CHECKS_PER_IP`, `RATE_PER_SECOND`, `DAILY_CAP`, `DAILY_SPEND_USD`. Text over 6,000 characters is trimmed.

## Layout

```
server/   index.js (routes, streaming) pipeline.js (the five stages) bedrock.js prompts.js reconcile.js guards.js
public/   index.html styles.css app.js match.js (finds statements in your text) report.js example.json
test/     reconcile, match, report and guards tests
devpost/  the plan: scope.md, prd.md, spec.md, checklist.md
```

## Honest limits

AI judges can still be wrong. Clarify shows its sources and votes so you can check the check. Results can vary slightly from run to run. A claim that rests on your own numbers or a very specific context has no web page to check against, so it comes back "unsupported" rather than guessed. Clarify checks facts and sums; it does not judge whether advice is good. The prompts were tuned on a small set of real AI answers, so treat the accuracy as promising, not proven. Scanned or image-only PDFs are not read. Speech entry uses the browser's built-in recognition (Chrome, Safari).

MIT licensed.

Clarify is by 3Dogs Nexus, [3dogs.ai](https://3dogs.ai).

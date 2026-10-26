---
doc: spec
status: approved
---

# Clarify — Technical Spec

PRD: `prd.md`. Scope: `scope.md`.

## How This Works, In Plain Language
Clarify has two parts: a web page and a small server.
- **The page** is what the person sees: the drop zone, the microphone, the Check button, and later the marked-up result. It reads PDF files and listens to the microphone itself, inside the person's own browser, so the server never has to deal with files or audio.
- **The server** does the checking. When someone presses Check, the page sends the text to the server. The server (1) asks an AI model to pull out the factual statements, (2) searches the live web for each statement using Amazon Nova's built-in grounding search, (3) hands each statement and what the search found to three different AI models from three different makers, who each rule on it independently, (4) shows each judge the other two rulings once so they can change their mind, and (5) settles on one verdict per statement. The server sends the results back to the page as they happen so the person watches the steps instead of staring at a spinner.
- **Nothing is stored.** No accounts, no database. The text goes to the server and the AI models to run the check and is not kept.

Why this shape: it is the smallest design that shows real independent checking (the product is the receipts), runs in seconds, and is easy to read in a public repo. It follows the same pattern as the learner's executive-committee tool: independent answers, one rebuttal round, consensus with the vote split shown.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. Person opens the page → the server sends one HTML page with its styles and script.
2. They paste, drop a file or speak → the page puts the text in the zone (PDF text is extracted in the browser; speech is turned into text by the browser).
3. They press Check → the page sends the text to `POST /api/check` and opens a live stream back.
4. Server stage 1, **Find statements** → one model call returns a short list of the factual statements, each with the exact quote from the text.
5. Server stage 2, **Search sources** → for each statement, Nova searches the web and returns a short evidence summary with source links. Statements run in parallel.
6. Server stage 3, **Judges rule** → three models each read the statement and the evidence and answer with a verdict (verified, wrong, unsupported, unsettled), a one-line reason and the source they relied on. Run in parallel.
7. Server stage 4, **Rebuttal** → each judge sees the other two rulings and either keeps or changes its verdict. A change is recorded.
8. Server stage 5, **Reconcile** → majority verdict per statement; if no majority, the statement is Unsettled. The server adds the overall counts and percentage.
9. Page receives each stage as it finishes, updates the step indicator, then renders the verdict line, the marked text and the cards.
10. Download builds a one-page report in the browser; Copy puts plain text on the clipboard.

## Stack
- **Page:** plain HTML, CSS and JavaScript (no framework, no build step), served by the server. One file each for markup, styles and script.
- **Server:** Node.js 22 with Express. Skill-pack requirement is Node plus git.
- **AI calls:** AWS Bedrock Converse API through `@aws-sdk/client-bedrock-runtime`. Grounding: Amazon Nova with the built-in `nova_grounding` tool (the same tool call used elsewhere in the learner's systems). Statement finder and the three judges: three fast models from three makers (candidates: Amazon Nova 2 Lite, Mistral Large 3, OpenAI gpt-oss-120b). **Unverified: exact model IDs and that all three are enabled in the AWS account and region; confirm in the first build step.**
- **PDF reading:** pdf.js in the browser (documentation: mozilla.github.io/pdf.js). **Unverified: bundling a copy so the page works without a network fetch; confirm early.**
- **Voice:** the browser's Web Speech API (Chrome and Safari). The microphone button is hidden where unsupported.
- **Report:** a print-styled HTML page the browser saves as PDF; no PDF library.
- **Tests:** Node's built-in test runner for the matcher, the reconciler and the limits.

## Where It Runs and How Someone Tries It
- **Runtime:** the server runs on the learner's existing AWS box (it already holds the AWS credentials and has outbound access to Bedrock). Credentials are read from the server's environment and are never in the repository. A secret-free `.env.example` is committed.
- **Start command:** `npm install && npm start`, then open `http://localhost:3000`. This is also what is recorded for the demo video.
- **Public link for judges:** exposed with a free Cloudflare quick tunnel from the same box. **Unverified: a public URL that stays up through judging; confirm after the first working build.** If it cannot be made reliable, the README's run-it-yourself steps plus the video are the fallback.
- **Guards (committee #2005):** 5 checks per visitor session (counted in the browser and enforced by a cookie-less per-IP counter on the server); 3 requests per second per IP; a daily cap of 50 checks across everyone; a hard stop at a small daily AI spend; 15 seconds per stage and 30 seconds for the whole check.
- **Submission needs:** a short demo video (record from the running app) and a public GitHub repository with `scope.md`, `prd.md` and `spec.md`.

## Look and Feel
`prd.md > Look and Feel`. White page, system sans-serif, generous spacing, one colour per mark: green `#1a7f37` verified, red `#cf222e` wrong, amber `#bf8700` unsettled, grey `#6e7781` unsupported. Cards have thin borders, not shadows. A thin horizontal step indicator at the top while checking. Copy is plain and short ("Searching sources (4 of 7)"). Marked text uses a soft background tint of the mark colour, never bold or underline only, so colour-blind readers also get a small icon on each mark. Hovering a marked statement shows each judge's vote and reason. Works from 360 px wide up. Where the stack limits styling: none significant; plain CSS can do all of this.

## Components

### Input zone
Paste, drop, microphone, Check button state (disabled when empty). Text over 6,000 characters is trimmed with a notice. PRD ref: `prd.md > Input`.

### Statement finder (server)
One model call. Input: the text. Output: JSON list of `{id, statement, quote}` where `quote` is an exact substring of the input. Max 8 statements; if more, the first 8 by order. If the list is empty, the page shows the "No factual statements" state. PRD ref: `prd.md > Checking, with the work shown`, `prd.md > States and Boundaries`.

### Grounding search (server)
One Nova grounding call per statement, run in parallel, 15 second limit each. Output: a short evidence summary and a list of source links with titles. If a call fails or times out, the statement carries "no sources retrieved" and the judges are told so. PRD ref: `prd.md > The verdict`.

### Judges and rebuttal (server)
Three models, same instructions, run in parallel per statement. Round 1 returns `{verdict, reason, source}`. Round 2 gives each judge the other two rulings and returns `{verdict, reason, changed}`. Verdicts are one of verified, wrong, unsupported, unsettled. PRD ref: `prd.md > The verdict`.

### Reconciler (server)
Majority of round-2 verdicts wins; no majority gives Unsettled. If every judge says unsupported, the mark is Unsupported. Produces the overall counts and the percentage (verified divided by total, rounded). Pure function, fully tested. PRD ref: `prd.md > The verdict`.

### Statement matcher (page)
Finds each statement's quote in the original text so it can be marked. Algorithm: (1) exact substring match; (2) if not found, normalise both sides (lower case, collapse spaces, strip punctuation) and match again; (3) if still not found, slide a window the length of the quote across the text and accept the best window whose similarity ratio is at least 0.85; (4) if nothing reaches 0.85, leave the text unmarked and show the card only. Overlapping marks are resolved by earliest start. PRD ref: `prd.md > The verdict`.

### Result view and report
Verdict banner, marked text, cards, hover detail, Download and Copy. Saved example: a fixture of one input and its full result, rendered with no network. PRD ref: `prd.md > The documented report`, `prd.md > Saved example`.

### Guards (server)
Per-IP rate limit, per-session and daily caps, spend stop, stage and total time limits, input size trim. Each returns a plain error the page shows. PRD ref: `prd.md > States and Boundaries`.

## Data Model
Nothing persists. In memory, per request: the input text, the statement list, per-statement evidence, round-1 and round-2 rulings, the reconciled result. In the browser: the current text and result for the page session only; a counter of checks used this session. A fixture file holds the saved example. On leaving and coming back the page starts empty.

## File Structure
```
clarify/
├── package.json
├── .env.example            names of settings, no secrets
├── README.md               what it is, how to run it, how it works
├── server/
│   ├── index.js            Express app, routes, streaming
│   ├── pipeline.js         runs the five stages in order
│   ├── bedrock.js          model and grounding calls, limits
│   ├── prompts.js          the instructions each stage gives its model
│   ├── reconcile.js        majority vote and counts
│   └── guards.js           rate limits, caps, spend stop
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js              input, streaming, rendering
│   ├── match.js            statement matcher
│   ├── report.js           report and copy
│   └── example.json        saved example input and result
├── test/
│   ├── reconcile.test.js
│   ├── match.test.js
│   └── guards.test.js
└── devpost/                scope.md, prd.md, spec.md, checklist.md
```

## Open Items To Verify Early In The Build
1. The three judge model IDs are enabled and respond within the stage limit.
2. Nova grounding returns usable source links for ordinary factual statements.
3. A full check on a 6-statement paragraph finishes in 30 seconds or less.
4. A public tunnel URL works from outside the box.
5. pdf.js can be bundled locally.
If item 2 or 3 fails, the first fallback is two judges instead of three, then a single grounding call for the whole text instead of per statement.

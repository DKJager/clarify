---
doc: scope
status: approved
---

# Clarify (working name)

One line: drop in any AI answer and find out, statement by statement, whether it is real.

## The Unique Kernel
It answers the question "Is this AI hallucinating?" statement by statement, with receipts. The app splits the pasted answer into statements, grounds each one with a live web search, has three independent AI models from different makers judge it, and reconciles their votes. Each statement comes back marked verified, unsupported or wrong, with the source attached and a plain-English reason, so the answer can be documented. Single AI tools answer with confidence; this one shows its work. The engine is built new inside this app (the learner's own approach to grounded search and wisdom-of-crowds checking, written fresh here), not a call to an existing service.

## Who It's For
Anybody using AI to answer a question. Today they read a confident answer and have no way to know if it is true, so they either trust it blindly or re-research it by hand. In the learner's words: "peace of mind that I'm using AI or other internet tools correctly, legally, and it will enhance my work."

## The Core Loop
Open the app. Drop in an AI answer: paste it, drag a file onto the page, or speak it. Watch it being checked: statements found, sources fetched, judges voting. Read the verdict: each statement marked with its source and a one-line why, and an overall call such as "2 of 7 statements are false". Download or copy the documented result. Come back every time an AI answer matters.

## Inspiration & Identity
The model for the result is the learner's own executive-committee tool and the original Slack debate engine before it: a small panel answers independently, argues one round, and a consensus verdict is locked with the vote split and the log of who said what shown. Here that is shrunk to one page and about 20 seconds.
"Outrageously simple." One page, one drop zone, no sign-up, no settings, no limits on what you can put in. The feel is a trusted second opinion, calm and plain, not a dashboard. The inspiration is the learner's own company, 3Dogs Nexus (https://3dogs.ai), which checks answers with a panel of models and live sources; this app is a small, self-contained version of that idea for anyone, built from scratch.

## Why This Matters to the Learner
"Single point AI tools answer with confidence to the point nobody knows if it is real or not." This is another way to put grounded, cross-checked answers into everyday AI use, for people who are not on Claude or on 3Dogs. It is also practice at explaining the idea plainly to consumers and investors: the app has to make the value obvious in one screen.

## What "Working" Looks Like
Someone pastes a confident AI answer that contains at least one false statement. They press Check. Within about half a minute the same text comes back with each statement colour-marked, the false one flagged with the source that contradicts it and a one-line reason, and an overall verdict line at the top. They click Download and get a documented report. The "oh, that's cool" beat is watching a fluent, confident paragraph get taken apart statement by statement with receipts.

## The POC Boundary
- One page, one drop zone: paste text, or drag and drop a text or PDF file.
- Voice entry through the browser's built-in dictation (a microphone button).
- Check button; a visible checking state that shows the steps (statements found, sources fetched, judges voting); then the marked-up result with sources, a plain-English why per statement, and an overall verdict.
- The engine, built new in this repo: statement splitter, Nova grounding search per statement, a 2-3 fast-model debate (independent rulings, one rebuttal round, reconciled verdict), and that is it. Runs on AWS models; keys stay in server settings, never in the repo.
- Speed is a requirement: a check returns in about 10 to 20 seconds, with the steps visible while it runs.
- The result shows the work for every statement: sources as links, the judges' votes side by side, a one-line why, and the mark. The receipts are the product.
- Download or copy the documented result (one clean page).
- A saved example result so the demo never depends on a live call succeeding.
- Works on a laptop and on a phone browser.

## Later
- Images and screenshots of answers, web links, very large documents.
- Accounts, history of past checks, sharing a check by link.
- A browser extension that checks an answer in place.
- A bigger panel of judges and the full 3Dogs Nexus engine behind it ("XXL light"); paid plans.

## Explicitly Cut
- Chat or follow-up questions: this is a checker, not another chatbot.
- Any editing of the AI answer: the app judges it, it does not rewrite it.
- App Store release: not required by the rules, and the review process does not fit the window.
- Logins and payments: not needed to prove the kernel.

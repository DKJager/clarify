---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (chosen: deadline is Mon 26 Oct 2:00 PM PT; verification and commits are never skipped, explanation is shorter)

## Slices

- [x] **1. Paste text, press Check, and see real verdicts from the live engine**
  Becomes usable: A running app where pasted text is checked end to end: statements found, searched on the web, ruled on by three models, reconciled, and listed on the page as plain rows (statement, verdict, sources). No styling yet beyond readable defaults.
  Why now: This is the kernel and the biggest risk. It proves the AI side (model names enabled, Nova search returns links, a check finishes in 30 seconds) before any design time is spent. If it fails, the fallbacks in the spec are tried while there is still time.
  PRD ref: `prd.md > Checking, with the work shown`, `prd.md > The verdict`
  Spec ref: `spec.md > Components` (Statement finder, Grounding search, Judges and rebuttal, Reconciler), `spec.md > File Structure`, `spec.md > Open Items To Verify Early In The Build`
  Build: Scaffold the project per the file structure, install dependencies, write the server pipeline (find, search, judge, rebuttal, reconcile) with the stage time limits, the `POST /api/check` route, and a bare page with a text box, Check button and result rows. Write the reconciler as a tested pure function.
  Verify (mechanical): `npm test` passes for the reconciler; run a check on a 6-statement paragraph that contains one known false statement; confirm the server returns every statement with three rulings and at least one source link, the false one is marked wrong, and the whole run takes 30 seconds or less. Record the model names used and the run time.
  Learner check: Open the page, paste a paragraph from an AI answer you know contains a mistake, press Check, and say whether the verdicts look right to you.
  Commit: `Add live check engine and bare page`

- [x] **2. Watch the work happen, then read a proper verdict**
  Becomes usable: The step indicator updates live (finding statements, searching, judges ruling, reconciling), then the verdict line with counts and percentage, and one card per statement with mark, why, source links and the three judges' votes (with a note if one changed its mind).
  Why now: The receipts are the product and the Presentation criterion; they must be real before polish. It also settles the streaming approach early.
  PRD ref: `prd.md > Checking, with the work shown`, `prd.md > The verdict`
  Spec ref: `spec.md > The Core Journey Through the System`, `spec.md > Look and Feel`
  Build: Stream stage results from the server to the page; build the step indicator, verdict banner and cards in the clean, calm style from the spec.
  Verify (mechanical): Run a check and confirm the browser receives stage events in order; the banner counts equal the number of cards; every card shows three votes; a forced judge failure shows a plain message instead of hanging.
  Learner check: Run your own example and say whether the screen makes it clear why each statement got its mark.
  Commit: `Show live steps, verdict line and statement cards`

- [x] **3. See each statement marked in your own text**
  Becomes usable: The original text appears with each statement tinted by its mark (with a small icon), and hovering shows each judge's vote and reason. A statement that cannot be located is left unmarked and still has its card.
  Why now: This is the "oh, that's cool" moment for the video, and the matcher is the fragile part, so it gets its own verified step.
  PRD ref: `prd.md > The verdict` (marked text, hover detail)
  Spec ref: `spec.md > Components` (Statement matcher)
  Build: Write the matcher (exact, normalised, then sliding window with similarity at least 0.85, else unmarked), with tests; render marks and hover detail.
  Verify (mechanical): `npm test` passes the matcher cases: exact quote, changed spacing and punctuation, slightly reworded quote (matched), unrelated quote (unmarked), overlapping marks.
  Learner check: Hover the red mark and confirm you can see which judge said what and why.
  Commit: `Mark statements in the original text with hover detail`

- [x] **4. Drop a file or speak your answer**
  Becomes usable: Drag a .txt, .md or .pdf onto the zone and its text appears; tap the microphone and speak it. Over-length text is trimmed with a notice.
  Why now: Completes "paste, drop or speak" from the product promise once the core is solid.
  PRD ref: `prd.md > Input`
  Spec ref: `spec.md > Stack` (pdf.js, Web Speech), `spec.md > Components` (Input zone)
  Build: Add drop handling, local pdf.js text extraction, the microphone button (hidden where unsupported), the 6,000-character trim and notice.
  Verify (mechanical): Drop a sample .txt and a sample .pdf and confirm their text appears in the zone; confirm the microphone button is present in Chrome and absent when speech support is missing.
  Learner check: Drop in a PDF of an AI answer and say it out loud once; confirm both land in the box.
  Commit: `Add file drop, PDF reading and voice entry`

- [x] **5. Download the report, try the example, and nothing breaks**
  Becomes usable: Download a one-page report and Copy as text; "Try an example" shows a saved result with no network; the empty, nothing-checkable, timeout and error states all behave as described.
  Why now: The report is the tangible artefact for the video, and the saved example is the demo safety net the committee asked for.
  PRD ref: `prd.md > The documented report`, `prd.md > Saved example`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components` (Result view and report)
  Build: Report page and copy text, the saved example fixture and its loader, and the remaining states.
  Verify (mechanical): Download the report and confirm every statement and source link is in it; load the example with the network disabled; submit an opinion paragraph and confirm "No factual statements to check here"; force a timeout and confirm the message and Retry.
  Learner check: Press Download and open the report; say whether you would hand it to someone.
  Commit: `Add report, saved example and edge states`

- [x] **6. Guards, public link, and README**
  Becomes usable: Per-session and daily caps, per-IP rate limit and spend stop are active; the app is reachable at a public link; the README explains what it is, how it works and how to run it, with no secrets anywhere in the repository.
  Why now: Last, because it protects and publishes a finished app; the public link also decides the Design and Presentation story for judges.
  PRD ref: `prd.md > States and Boundaries` (limits), `prd.md > Product Decisions`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Components` (Guards)
  Build: Guards with tests, `.env.example`, README, tunnel setup notes; scan the repository and history for secrets.
  Verify (mechanical): `npm test` passes the guard cases (sixth check in a session refused, daily cap reached shows the example fallback); open the public link from a different network and run one check; secret scan finds nothing.
  Learner check: Open the public link on your phone and run one check.
  Commit: `Add guards, README and public link notes`

## Hands-on Checkpoints

- [ ] Early usable behavior explored: after slice 2 (you see real verdicts, steps and cards on your own example)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Brief learning wrap-up complete (your goal: explaining your idea plainly to consumers and investors) and `devpost/app-map.html` created

## Revisions


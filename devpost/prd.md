---
doc: prd
status: approved
---

# Clarify — Product Requirements

One line: drop in any AI answer and find out, statement by statement, whether it is real, with receipts. For anybody who uses AI to answer a question. Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.
1. The person opens the page. They see one drop zone, a one-line explanation, a microphone button and a Check button. Nothing else.
2. They paste an AI answer, drag a text or PDF file onto the zone, or tap the microphone and speak it.
3. They press Check. The page shows the work as it happens: "Finding statements (7)", "Searching sources", "Judges ruling", "Reconciling". About 10 to 20 seconds in total.
4. The result replaces the drop zone: an overall verdict line at the top ("2 of 7 statements false, 1 unsettled"), then the original text with each statement marked in colour, then one card per statement with its mark, its sources as links, the three judges' votes side by side, and a one-line why.
5. They press Download for a one-page documented report, or Copy. They press "Check another" to start again.

## Screens and Layout
One page, two states. Source: `scope.md > Inspiration & Identity`.
- **Input state:** centred drop zone (large, dashed border), placeholder text "Paste an AI answer, drop a file, or tap the mic", microphone button inside the zone, Check button below. Footer: one line on how it works and a link to the source repo.
- **Result state:** verdict banner at the top; the marked-up text; the statement cards in order of appearance; Download, Copy and "Check another" buttons. On a phone the same elements stack in one column.

## Look and Feel
Clean and calm: white page, plain readable type (a system sans-serif), generous spacing. One accent colour per mark: green for verified, amber for unsettled, red for wrong, grey for unsupported. No dashboard chrome, no gradients, no mascots. Feels like a trusted second opinion. Avoid generic AI-app purple gradients and card-heavy layouts.

## Features and Behavior

### Input
- Paste text into the zone. Drag and drop a .txt, .md or .pdf file; the text is extracted and shown in the zone. Tap the microphone to dictate using the browser's built-in speech recognition; the words appear in the zone as they are spoken.
  - [ ] Pasted text, a dropped text file and a dropped PDF all appear in the zone within a second.
  - [ ] The microphone button fills the zone with spoken words in Chrome; in a browser without speech support it is hidden.
- As anybody with an AI answer, I want to drop it in with no sign-up so that checking it costs nothing but a few seconds.

### Checking, with the work shown
- Pressing Check runs the engine: split into statements, Nova grounding search per statement, a 2-3 fast-model debate (independent rulings, one rebuttal round), reconciled verdict. Source: `scope.md > The POC Boundary`.
  - [ ] A step indicator shows each stage as it completes, with the statement count.
  - [ ] A typical paragraph of 5 to 8 statements finishes in about 10 to 20 seconds.
  - [ ] If the engine fails or takes longer than 30 seconds, the page says so plainly and offers Retry; it never hangs silently.

### The verdict
- Overall line with counts, in plain words.
  - [ ] Reads like "2 of 7 statements false, 1 unsettled, 4 verified"; never a bare percentage.
- Each statement is marked in the original text and gets a card.
  - [ ] Card shows: the statement text, the mark, the one-line why, the source links (at least one for verified or wrong), and the three judges' votes side by side with a note if any judge changed its mind in the rebuttal round.
  - [ ] Marks: Verified (green), Wrong (red, with the contradicting source), Unsupported (grey, no reliable source found), Unsettled (amber, sources disagree or judges split).
  - [ ] If a statement cannot be located in the original text, it is still shown as a card and the text is left unmarked for that statement; nothing breaks.
- As a reader, I want to see the sources and the votes so that this is more than one AI's opinion of another AI.

### The documented report
- Download produces a one-page report (PDF or printable HTML) with the verdict line, every statement, its mark, why, sources and votes, and the date and time. Copy puts the same content on the clipboard as plain text.
  - [ ] The downloaded file opens and contains every statement and source link.

### Saved example
- A "Try an example" link loads a saved answer and its saved result instantly, so the demo and first-time visitors never depend on a live call.
  - [ ] The example renders the full result state without any network call.

## States and Boundaries
- **First use / empty** — the input state with the placeholder. Check is disabled until there is text.
- **Nothing checkable** — if no factual statements are found (an opinion, a poem), the result says "No factual statements to check here" and nothing else, with "Check another".
- **Checking** — the step indicator; the input is locked.
- **Error / timeout** — plain message and Retry; the pasted text is kept.
- **Success** — the result state.
- **Persistence** — nothing is stored between visits. No accounts. The pasted text leaves the browser only to run the check.
- **Limits** — text over about 6,000 characters is trimmed with a notice, to keep checks fast. A visitor gets 5 checks per session; when the daily server cap is reached the page says so and offers "Try an example".

## Product Decisions
- Own engine, built new in this repo, not a call to an existing service — so the new code is the product and judges can read it. (Learner, 25 Oct.)
- "Nova grounding search, 2-3 fast model debate and that is it." Speed over panel size: results in seconds, not minutes. (Learner.)
- "Needs to be more complex than copying a GPT answer into Claude and asking what it thinks": the receipts (sources, votes, why) are shown for every statement. (Learner.)
- Modelled on the learner's executive-committee tool and the original Slack debate engine: independent rulings, one rebuttal round, consensus with the vote split shown. (Learner.)
- Outrageously simple: one page, no sign-up, no settings, paste or drop or speak. (Learner.)
- Committee changes (#2005, 25 Oct, adopted): hard time limits (15 seconds per stage, 30 seconds for the whole check); a limit of 5 checks per visitor session and a daily cap on the server; the verdict line also shows the plain percentage ("4 of 7 statements verified, 57%"); hovering a marked statement shows each judge's vote and short reason; the demo run uses saved results so it cannot fail.
- Look and feel, nothing-checkable wording and the amber Unsettled mark: proposed by the agent, approved by the learner ("good, push forward").

## What We're Building
Input (paste, drop, mic); Check with visible steps; the engine (statements, grounding, 2-3 model debate, reconcile); verdict line; marked text; statement cards with sources, votes and why; Download and Copy; Try an example; the empty, nothing-checkable, checking and error states; phone layout.

## Deferred From the POC
- Images and screenshots of answers, web links, very large documents: need OCR and crawling; not needed to prove the kernel.
- Accounts, history, share by link: the POC stores nothing.
- Browser extension: a second surface; later.
- Bigger panel and a deeper research engine behind it; paid plans.

## Possible Later Enhancements
A confidence heat map across the text. Checking a whole document section by section. Letting the reader add a source and re-run.

## Non-Goals
No chat or follow-up questions. No rewriting or "fixing" the pasted answer. No App Store release. No logins or payments.

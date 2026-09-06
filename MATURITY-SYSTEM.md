# Design Maturity Assessment: how the whole thing works

Last updated 2026-09-06. Written so a cold session can pick this up without archaeology.

---

## What it is

A free, ungated assessment at `aneilrazvi.com/maturity.html` that scores a company on
**two independent axes** and recommends the engagement that fits. It is the top of the
fractional funnel: no email is needed to see where you land, an email unlocks the written
read and the engagement detail.

**Why two axes.** Most maturity models collapse design practice and AI adoption into one
number. They move independently, and the gap between them is usually the real problem.

| Axis | Levels | Source model |
|---|---|---|
| Design capability | Absent · Limited · Emergent · Structured · Integrated · User-Driven | NN/g capability levels |
| AI maturity | Limited · Reactive · Developing · Embedded · Leading · Symbiotic | Nielsen AI CMM |

**15 questions.** 12 scored (6 per axis, 0 to 5 each, so 30 points per axis) plus 3 context
questions that are captured but not scored. The intro copy derives the count from the data at
runtime, so editing the questions updates the wording automatically. Do not hardcode it again.

---

## The pieces

| File / object | Where | What it does |
|---|---|---|
| `maturity.html` | site repo root | The assessment. Holds the canonical `CAPDIM`, `AIDIM`, `CAPL`, `AIL`, `SCOPE`, `offers()`, `scatter()`, `radar()` |
| `report.html` | site repo root | Per-lead read at `/report.html?s=<session_id>`. Fetches from `/api/report`, redraws the same charts, prints to a 2-page PDF |
| `api/lead.js` | site repo | Upserts the lead, sends the branded report email via Resend, notifies Aneil |
| `api/report.js` | site repo | GET returns one lead's scores by session id. POST logs an interaction |
| `api/progress.js` | site repo | Records the funnel: one row per visitor, moved forward on every step. This is how abandonment is measured |
| Supabase `bpdjmixiohrqqoxbljvl` | job-search-hq | `leads`, `report_events`, `assessment_progress`, plus the `report_activity`, `report_forwarding`, `assessment_dropoff` and `assessment_abandoned` views |

**The scoring logic lives in exactly one place: `maturity.html`.** `report.html` and the PDF
generator extract those blocks verbatim rather than reimplementing them, so a score can never
drift between what a visitor saw and what lands in their inbox. If you change `offers()` or
`SCOPE`, regenerate `report.html` from `maturity.html` rather than editing it by hand.

---

## Data model

### `leads`
One row per session. Upserted on `session_id`, so a retake from the same browser **updates
rather than inserts**. `created_at` is the first take, `completed_at` is the latest.

Carries first-touch attribution: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
`referrer`, `landing_path`. Put `?utm_source=linkedin&utm_campaign=whatever` on every link you
post and the answer comes back in one query.

`answers` is `{raw: [...], capability_score, ai_score}`. **It is an object, not an array.**
Read `answers.raw`.

### `report_events`
One row per interaction with a personal report. Events: `view`, `revisit`, `print`,
`copy_link`, `book_click`. `print` means they saved the PDF.

Records `device`, `os`, `browser`, `screen_w`, `country`, `city`, `is_bot`.
**No IP address is stored anywhere** by design: enough to tell two machines apart, not enough
to identify a person.

### `assessment_progress`
One row per visitor, keyed on the same `session_id` `leads` uses. Written from
`/api/progress` through the `record_assessment_progress` RPC.

Five events fire from `maturity.html`:

| Event | When | Carries |
|---|---|---|
| `land` | the page finishes loading | this is the funnel denominator |
| `start` | the Start button is pressed | |
| `q` | a question is reached for the first time | `question` (1 based), `axis` |
| `complete` | the result screen renders | |
| `email` | the unlock is submitted | |

**The row only ever moves forward.** `max_question`, `answered_count`, `started`,
`completed` and `gave_email` are merged with `greatest` and `or`, so a hit that arrives
late cannot walk a visitor backwards, and pressing Back does not re-fire. Attribution columns
are first touch and never overwritten. Device columns are last touch.

Transport is `navigator.sendBeacon`, falling back to `fetch` with `keepalive`. The endpoint
always returns 204 and never blocks the visitor, so a broken analytics call cannot break the
assessment.

Same privacy shape as `report_events`: coarse device and city, **no IP address anywhere**.

### Views
- `report_activity`: every open and download in plain language
- `report_forwarding`: one row per lead: opens, downloads, distinct real machines, and
  `likely_forwarded`
- `assessment_dropoff`: the funnel by step, bots excluded. Read it top to bottom: the biggest
  gap between two adjacent rows is where people quit
- `assessment_abandoned`: one row per person who started and never saw a result, with where
  they quit, where they came from, and how long they lasted

All five views are `security_invoker`, so they respect row level security rather than running
with the creator's rights. Do not recreate one without setting that again.

---

## The First Look, and the two files that must agree

`FIRSTLOOK` is the $2,500 entry rung. It is deliberately **not** in `offers()`, so it never
competes in the ranking. It renders under the four ranked engagements, in both
`maturity.html` and `report.html`.

Its copy is duplicated in three places and they must stay in step:

| File | What it holds |
|---|---|
| `maturity.html` | `FIRSTLOOK` object and `firstLookHtml()` |
| `report.html` | its own `FIRSTLOOK` copy, plus the band under the ranking table |
| `api/lead.js` | the same band as nested tables, in the report email |

Plus the two PDFs built outside this repo: the public one-pager and the private rate sheet.

**The credit rule is not what it first looks like.** It credits in full against the AI
Experience Framework, the Design System Build, or the retainer. It does **not** credit against
the Audit. The arithmetic is the reason: $7,500 minus $2,500 is $5,000 for roughly 36 hours of
work, or $208 an hour, under the $225 floor. The three that do credit blend to $227, $234 and
$242. The public framing is positioning rather than fine print: the Audit is the same work done
properly, so buy one or the other.

---

## The link-scanner trap

**Observed 2026-09-06.** A Windows / Chrome / 1366px hit follows every real view by 13 to 18
seconds. It never prints and never clicks through. It is a mail-security link scanner
(Safelinks, Proofpoint or similar) following the URL out of the email. Its user agent is a
plain Chrome string, so no bot filter catches it.

Left alone it would have made **every report look forwarded** and doubled every view count.

`report_forwarding` therefore only counts a second machine as a real reader if it either
downloaded, clicked to book, or first appeared **more than ten minutes** after the original.
Raw rows are never mutated; the judgement lives in the view so the rule can change without
losing data.

---

## Bugs already fixed, so nobody reintroduces them

| Bug | Cause | Fix |
|---|---|---|
| Black frame around the page | `html` stayed `background:var(--dark)` while `body` transitioned to light | `html` transitions in lockstep and gets `.lit` |
| Radar labels clipped ("roduct AI") | viewBox too narrow for edge labels | viewBox 340 to 452, radius 104 to 112, label ring 1.19 |
| Horizontal scrollbar under the matrix | `.scroller svg{min-width:430px}` forced it wider than its card | scales to the card |
| Lightbox showed a giant magnifier | `host.querySelector("svg")` grabbed the zoom hint's own icon | `:scope > svg` |
| **Nothing on the report page was clickable** | `.lb{display:flex}` beats the browser's `[hidden]` rule, so an invisible full-screen overlay at z-index 60 swallowed every click | `.lb[hidden]{display:none!important}` |
| Printed PDF was 4 pages with a date header | no `@page{margin:0}`, no break control, content too tall | `@page{margin:0}`, `break-after:page`, print root font 12.5px |
| Intro said "Twelve questions", it asks 15 | hardcoded word | derived from `CAPDIM.length + AIDIM.length + CTX.length` |

**Two testing lessons, learned the hard way:**

1. `element.click()` in JavaScript **bypasses hit-testing**. It will happily "pass" on a page
   where an invisible overlay makes every control unclickable. Verify with real coordinate
   clicks and `document.elementFromPoint`.
2. A screenshot taken during a CSS transition looks broken. Check computed styles before
   believing an image.

---

## Where the CTA lives

Nav link on every page.

`index.html` carries a full section, `#maturity`, sitting between Selected Work and Speaking.
It explains both axes and holds the quadrant map. It deliberately breaks the page's dark
alternation so it reads as the one interactive thing on the homepage. The smaller duplicate
block that used to sit above the footer was removed on 2026-09-06: one headline, one place.

A call-to-action block on `portfolio.html`, `work-with-me.html`, and all nine case studies.
Plus an entry in `links.html`, positioned straight after "Book a call".

---

## Test data

Aneil's own testing was cleared on 2026-09-06 so the real numbers start at zero. It is
preserved in `leads_archive` (1 row) and `report_events_archive` (18 rows). Both are safe to
drop once you are sure nothing is needed.

---

## Useful queries

```sql
-- where people quit
select * from assessment_dropoff order by step_no;

-- who bailed, and from what source
select quit_at, came_from, device, seconds_on_page from assessment_abandoned;

-- what came in, and from where
select utm_source, count(*) leads from leads group by 1 order by 2 desc;

-- who opened their report, from what machine, and did they save it
select * from report_activity;

-- who forwarded it
select name, company, opens, downloads, real_machines, scanner_hits, likely_forwarded, machines
from report_forwarding order by downloads desc;
```

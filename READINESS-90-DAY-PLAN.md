# The 90-day plan behind the readiness email

Written 2026-09-24, in response to the "Prompt 2 / 90-day plan" screenshot.

---

## First: you are already ahead of that prompt on the part that matters

That prompt spends most of its guardrails telling the model not to overclaim.
Your page already does all of it, in the page copy, before anyone asks:

| Their guardrail | Where you already have it |
|---|---|
| "Treat automation/augmentation as observed usage" | *"It describes how people are using AI on this kind of task today, and nothing more."* |
| "Unmatched tasks as unknown" | The coverage tier, plus *"Only X of Y tasks were measured individually, so read the list below as a sample."* |
| "Do not promise a safe job or guaranteed pay" | *"It is not a probability your job disappears, not a forecast, and not a measure of how much of your work AI is capable of."* |
| Cite the source | O*NET 31.0 and the Anthropic Economic Index, both named, both linked, both version-pinned |

The one guardrail you do **not** have is the one about hours, and you do not have
it because you never make an hours claim. That prompt has to say "assume a
40-hour week for planning only" precisely because it is about to allocate hours
it never measured. **The moment you add a plan, you inherit that trap.**

---

## What the prompt has that you do not

Your page answers *where do I stand*. It does not answer *what do I do Monday*.

That is the whole gap, and it is exactly the right thing to put behind an email.
Someone who has just seen a number next to their own job title is at the single
highest-intent moment they will ever have on your site. "Want this in writing?"
is a weak ask at that moment. "Here is what to do about it" is a strong one.

---

## Recommendation

**Yes, gate a 90-day plan behind the email. Keep the lookup free.**

And build it as a **measurement protocol, not a survival plan.** That distinction
is the whole thing.

A survival plan says: here is how to keep your job. That contradicts your own
page, which just finished telling them the number is not a forecast. You cannot
say "this does not predict anything" and then sell them a plan predicated on it
predicting something.

A measurement protocol says: **you do not actually know what is true for your
job yet, and in thirty days you could.** That is consistent with the page, it is
more useful, and it is the only honest version.

### The shape

| Phase | What it is |
|---|---|
| **Days 1 to 30** | Log your own hours against your own tasks. You have the O*NET list; now find out which of them you actually spend time on. Then benchmark one repeatable task with and without AI, same acceptance criteria, and record time, defects and review effort |
| **Days 31 to 60** | Put the one workflow that measurably won into routine use, with human review. Reinvest only the time you measured, not the time you hoped for |
| **Days 61 to 90** | Write down the before and after, teach it to one colleague, and recalculate the allocation from the hours you now have rather than the ones you assumed |

Note what is missing: no hour budgets, no percentages, no "AI will take 30% of
your week." Days 1 to 30 exists because you do not know their hours and neither
do they.

### How to build it, three options

| | What | Cost | Verdict |
|---|---|---|---|
| **A** | Static plan, keyed to coverage tier and automation band. Nine variants covers everyone | An afternoon, zero per lead | **Do this** |
| **B** | Generated per person through the Anthropic API | Per-lead cost, latency, a new failure mode in a send path that currently cannot fail | Not yet |
| **C** | Ship them the prompt, pre-filled with their occupation, SOC code, share, coverage tier and top six tasks, ready to paste into Claude or ChatGPT | An hour, zero per lead | **Do this too** |

**A plus C together, and C is the differentiator.**

Everyone else in this space hands you a PDF. You would be handing someone their
own data, already shaped into a prompt, and teaching them to direct the tool
rather than defer to it. That is not a nice extra. **That is the thing you
actually sell**, demonstrated for free, in the first email, to a person who is
worried about their job.

It also makes the email forwardable. Nobody forwards a generic plan. People
forward a prompt that worked.

### On "behind an email to mentor"

Gate on the **email**, not on a call. Someone who typed their job title four
minutes ago will not book a mentoring session, and asking turns a good moment
into an awkward one.

Put the offer at the **end of the plan** instead, where it reads as a next step
rather than a toll: *"If you get through the first thirty days and the numbers
surprise you, tell me what you found."* That is a real invitation, it costs them
nothing, and the people who take it are pre-qualified by having done the work.

---

## The lines I would refuse to write

- Anything that says a job is safe, or doomed
- Any hour or percentage allocation that was not measured by the person themselves
- Any implication that the automation share is a countdown
- Any "reskill before it is too late" urgency. The people reading this are
  already frightened, and manufactured urgency aimed at a frightened person is
  the thing your whole page is built to avoid

---

## What this needs from you

One decision: **A plus C, or A alone.** If A plus C, I need nothing else and I
can build both. The plan text is mine to draft, the prompt is mechanical, and
the email template already exists.

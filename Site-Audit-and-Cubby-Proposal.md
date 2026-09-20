# aneilrazvi.com: audit + proposed Cubby additions
Nothing has been changed. This is for your review.

Live source confirmed: `aneilrazvi-site-v2` → Vercel project `aneilrazvi-portfolio` → aneilrazvi.com
(The `Portfolio-Site` folder is a stale August 17 snapshot with no git or deploy config. Do not edit that one.)

---

# PART 1: THE AUDIT

I checked all 17 HTML pages for placeholder copy, dead links, broken images, and orphaned assets.

## The one real problem

**spotio-case-study.html, line 36.** Under "Latest walkthrough":

> The newest cut: a fresh overview of the SPOTIO AI experience. (Rename this title anytime.)

Proposed replacement:

> The newest cut: a full overview of the SPOTIO AI experience, from the framework to what shipped.

## Everything else came back clean

| Check | Result |
|---|---|
| Placeholder or template copy | 1 instance, above. No lorem ipsum, no TODO, no TBD, no bracketed variables |
| Dead links (`href="#"` or empty) | None |
| Referenced images missing from disk | None. Every image resolves |
| Orphaned images | None. All are used via meta tags or CSS |
| Empty alt text | 35, all on decorative carousel thumbnails that sit next to a labeled button. Correct as-is |

## One quality finding worth knowing

Your SPOTIO and SNHU carousel images are **467x296 pixels**. Every other case study uses 966x500, 1100x785, or 1600x1000. At 467px those will look noticeably soft on any modern laptop or phone, and SPOTIO is the case study most likely to be opened by the people you just applied to.

Recommend re-exporting those 8 files at 1600x1000. Not urgent, but it is the difference between "crisp" and "why is this blurry" on a design portfolio.

Affected: `spotio-calendar-suggestions.jpg`, `spotio-customer-communication.jpg`, `spotio-next-best-action.jpg`, `spotio-testing-concept.jpg`, `snhu-ai-credit.jpg`, `snhu-ai-guideme.jpg`, `snhu-levelup-adaptive.jpg`, `snhu-levelup-support.jpg`

---

# PART 2: PROPOSED CUBBY COPY

Two edits and two new sections. All reasoning below is pulled from your actual DECISIONS.md, so every claim is one you already made and can defend in an interview.

## EDIT A: strengthen "THE TURN" (existing section)

Right now it says the kids space was "saturated, COPPA-heavy, and hard to differentiate." True, but it does not say what you actually found. The specific evidence is far stronger than the summary.

**Replace the "Where it started" body copy with:**

> Cubby began as a parent-controlled kids' viewing app: a Parent Hub, child profiles, and a curated feed of kid-safe videos. Then YouTube Kids shipped "Approved Content Only" for free, where a parent handpicks every video and search is off. That was my pitch, released by the incumbent, at no cost. Sensical and Kidoodle were free too. Every version of the kids product was now competing against a free, better-funded version of itself.

**Replace the "Where it is now" body copy with:**

> The autism and IDD app market is active and well funded, but nobody was doing caregiver-curated video for teens and adults. The segment's own complaint is that everything is built for young children. My architecture, a locked-down library an adult controls for a viewer who should not wander, was already that product with the age grown up. Five caregiver interviews confirmed it, and I wrote the decision rule before I made the calls so I could not move the goalposts afterward.

## NEW SECTION B: "How I decided"

Goes between "What I Did" and "The Turn". Four cards. Each states the question, the evidence, the call, and what it cost.

**Section eyebrow:** How I Decided
**Section headline:** Four calls that shaped the product

---

**01. Should Cubby store a user's age?**

The obvious answer is yes. Age tells you what to recommend and how to tune the reading level. I built it, then removed it.

Storing an age band is what manufactures the "actual knowledge" that re-triggers COPPA. Collecting the data was the liability, not the protection. So age came out of the app and out of the database schema entirely.

**What it cost:** any age-based personalization, and a feature I had already built.

---

**02. What is a capable disabled adult allowed to do in their own account?**

The easy model is parent and child: one person controls everything, the other watches. For an audience of teens and adults, that model is insulting.

I split it into three roles. Admin belongs to the login and owns billing, PINs, and profiles. Curator and Viewer belong to a profile. Curator is the dignity tier: a capable adult can stock their own shelf without being able to touch the account. "Nothing about us without us" is a core value in this community, and a product that treats a disabled adult like a child gets rejected by the advocates who recommend it.

**What it cost:** a more complex permission model than a parent and child split.

---

**03. Could the existing design system be tuned, or did it have to go?**

Cubby had a finished 8-bit visual system. I threw it out.

Sensory research for this population says avoid pure black and white, which cause glare and visual fatigue; saturated warm accents and primary reds, which raise heart rate and read as punishment; sharp high-contrast edges, which complicate visual tracking; repeating patterns; ALL-CAPS, which destroys word-shape recognition and slows reading; and high-frequency motion, which triggers sensory anxiety.

The old system did every single one. That is not a tuning problem. I replaced it with a sensory-adaptive token system with three per-profile modes, calm, balanced, and engage, set by the admin, using Atkinson Hyperlegible. A contrast gate runs in the build and fails it if any token pair drops below WCAG AA.

**What it cost:** a complete design system, rebuilt from scratch.

---

**04. Should Cubby use an accessibility overlay?**

An overlay is the cheap way to claim accessibility. One script, instant compliance badge.

I ruled it out permanently. The FTC fined accessiBe one million dollars in 2025 over deceptive claims, overlays actively interfere with real assistive technology, and the disability community rejects them. My users are that community. Accessibility is built natively into the player and tuned per profile instead.

**What it cost:** the fast checkbox, and real engineering time.

## NEW SECTION C: "What I got wrong"

Goes after "How I decided". One card. This is the section most portfolios do not have, and it is the one that reads as senior.

**Section eyebrow:** What I Got Wrong
**Section headline:** The build was green and the product was broken

> Cubby has a PIN wall that keeps a viewer out of the admin area. It built clean. I confirmed the right code had shipped by checking the production bundle. It did nothing.
>
> The guard used OR logic, so any signed-in session satisfied it. The entire admin area was reachable by typing the address into the bar. The PIN wall was decorative and had been for a while.
>
> Two more bugs in the same batch would have passed the same checks. Every visual accessibility setting was silently wiped, because the video filter was set on an element the YouTube player replaces at runtime. And all three sensory modes were clobbered by a stylesheet fallback with identical CSS specificity sitting later in the file. The mode attribute flipped correctly. No color ever followed.
>
> None of the three could be caught by a build or a search. All three were caught by opening the live app and reading what was actually on the screen.
>
> I now have a rule: anything touching sessions, guards, roles, or design tokens gets tested by driving production. Bundle presence is not behavior. A passing build proves nothing about correctness.

---

# PART 3: IMAGES YOU NEED

## Specs

Match your existing Cubby assets exactly:

- **Dimensions: 1600 x 1000 px** (16:10). This is what `cubby-story-1.jpg`, `cubby-story-2.jpg`, and `cubby-the-hard-part.jpg` already use, and it is the highest quality convention on your site.
- **Format:** JPG, quality 80. Target 120 to 200 KB each. Your existing Cubby images are 143 to 160 KB.
- **Folder:** `assets/work/`
- **Naming:** lowercase, hyphens, `cubby-` prefix. Matches every other file.

## The five files

| Filename | What it should show | Why this one |
|---|---|---|
| `cubby-decision-audience.jpg` | Your Miro board or paper map of the competitive landscape. YouTube Kids, Sensical, Kidoodle on one side, the autism and IDD tools on the other, with the gap marked | This is the evidence behind the pivot. It is the single most persuasive artifact you have |
| `cubby-decision-age-data.jpg` | The schema or profile screen with age fields, marked up for deletion. A photo of the crossed-out sketch works | Deleting a shipped feature on purpose is counterintuitive. Show the thing you removed |
| `cubby-decision-roles.jpg` | Your sketch or Miro of the three-role model. The Admin, Curator, Viewer grid with what each can do | Roles as a values decision, drawn by hand, reads completely differently than a finished settings screen |
| `cubby-decision-sensory-system.jpg` | Figma: the dead 8-bit tokens beside the three sensory modes. Old and new side by side | Before and after in one frame is the fastest way to show a systems decision |
| `cubby-what-i-got-wrong.jpg` | A browser on the admin URL with devtools open, or your handwritten note of the three bugs | Proof you actually drive production. Slightly ugly is correct here. Do not polish it |

## One rule that decides whether this works

**The caption does the work, not the image.** A photo of a sketch with no reasoning next to it is just a messier polished screen, which is exactly the thing the feedback was complaining about. Every artifact above is paired with copy that names the question, the evidence, the call, and the cost. That pairing is the whole point.

Rough and real beats clean and mute. Do not redraw these to look nice.

---

# WHAT I WOULD DO, IN ORDER

1. Fix the SPOTIO placeholder line. One minute, and it is live right now on the page your applications point at.
2. Drop in the two "THE TURN" copy edits. No images required, pure text, immediate improvement.
3. Export the five images, then I add sections B and C.
4. Re-export the eight low-resolution SPOTIO and SNHU images at 1600x1000 when you get a chance.

Steps 1 and 2 need nothing from you but a yes. Step 3 needs your artifacts.

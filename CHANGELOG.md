# Changelog

Newest first. One entry per shipped push, with the proof it works on production.

## 2026-11-12 · Citi accuracy fix and exact recommendation quotes

citi.html (and scripts/build_cases.py, its generator): removed the virtual-assistant claim (stat, What I Did bullet, Impact
card). Aneil confirmed 11 Nov there was no virtual assistant and no AI work at Citi. Replaced with the Apple Watch finding:
pre-launch user testing showed people didn't trust themselves with that much power on their wrist, so the experience was
tiered across watch, phone and desktop. work-with-me.html and fractional-head-of-design.html: the four recommendation
quotes (Travis Willard, Michael Grigone, Amira Maruf, Tyler Forcum) now use their exact LinkedIn words, with "..." marking
cuts. Links to their profiles unchanged.

## 2026-11-11 · Sidenote no. 07: Follow It Past the Handoff

New site-first essay at blog/follow-it-past-the-handoff.html, credited to Hannah Zhang's "non-linear" framing. Cover
assets/newsletter/sidenote-07-past-the-handoff.jpg built in Figma (brand file, page "Newsletter covers", frame 264:97) to
NEWSLETTER-COVER-STYLE. blog.html: new Latest feature, list item (lead), count 16, #SystemsThinking filter, ItemList schema
16. feed.xml, llms-full.txt, llms.txt and sitemap.xml regenerated or updated. Generator: wired.py article() gained a branch
for local posts with no LinkedIn article and no episode ("Published here first on ..."). Numbered 07 because Sidenotes 05
and 06 are already made for December, so this one publishes out of order. LinkedIn feed post scheduled separately.

## 2026-11-10 · Sketch to Ship paused: date TBD

Aneil paused the 5 December Sketch to Ship. Every live mention of the date now reads "Date TBD": build.html (date card, FAQ,
reserve strip, sticky bar), build/faq.html (FAQ and its schema answer), build/how-it-works.html, the home page card and "Next"
chip (status now "Join the list"), the Speaking timeline, llms.txt, and the speaker packet (re-rendered, 4 pages).
assets/reserve.js: paper-day date set to null, so the reserve panel says "Date TBD" and no countdown shows. build.html Event
schema: eventStatus EventPostponed (startDate kept, as schema.org asks for a postponed event with no new date). Seats and
prices unchanged; the list keeps collecting. Not changed: api/go.js campaign name "sketch-to-ship-dec5" (tracking label only).

## 2026-11-09 · PostHog follow-up: comment, project settings, proof

Proof for 1512504: live assets/analytics.js 200 with the new key (1 match) and the old key (0); 7 pages load it; www 308s to
the apex. First events in project 723395 at 14:24 to 14:43 CT ($pageview, $pageleave, $web_vitals, section_viewed,
scroll_depth, assessment_landed), all with $host aneilrazvi.com. Cubby's project 546540 last saw aneilrazvi.com at 14:11 CT.
analytics.js line 2 comment now names project 723395. Project settings (in PostHog, not in this repo): timezone
America/Chicago; web vitals on and click autocapture off, matching what the site sent before; test-account filter keeps
$host = aneilrazvi.com; new pinned dashboard "Site: leads and assessment".

## 2026-11-09 · PostHog: the site gets its own project

aneilrazvi.com now reports to its own PostHog organization and project ("aneilrazvi.com" org, project 723395, US Cloud),
instead of sharing Cubby's project 546540. Same PostHog login; the free plan allows one project per organization.
Only change: the project key on line 12 of assets/analytics.js (old phc_rv6h... out, new phc_nX3y... in). The old key appears
nowhere else in deployed files. Cubby's project, key and settings are untouched.

## 2026-11-07 · Future of AI Dallas: "not a panel, a conversation", event photos

Wording (Aneil, 6 Nov): the organizers bill it "Not a panel. A conversation." (futureofaidallas.com/memory), so every
"speaker panel" for this event is now "conversation": home chip and On Stage card title, Speaking JSON-LD Event name and
description, the FAQ answer (visible and JSON-LD), llms.txt, and the speaker packet (re-rendered, still four letter pages).
The AIGA Mini-Con line stays "panel" because that one was.
Photos: three event photos by Smagshot Photography replace the promo graphic on Speaking (stage, room, Aneil close-up, same
.sp-gal pattern as Mini-Con) and on the home On Stage card (home.css background, credit line updated). New files in
assets/speaking: future-of-ai-dallas-2026-{stage,room,aneil}.jpg, 800x534 (the organizer's web copies; swap in high-res at the
same names when Aneil downloads them). The old graphic stays in the repo, unused. Sitemap lastmod 2026-11-07 for / and speaking.
Checked locally at 1440 and 390 (iframe wrapper).

## 2026-11-05 · Capital One hero photo: a dealership finance desk

Capital One (capital-one.html): the hero background is now a couple talking through car financing with a finance manager on a
dealership floor (Aneil's photo, 5 Nov), replacing the barista at a coffee counter, which didn't say auto lending.
New file assets/work/capital-one-hero-dealership.jpg (2400x1350, about 300KB); --hero-pos 60% 40%; aria-label updated.
The old capital-one-hero.jpg stays in the repo, unused. Sitemap lastmod set to 2026-11-05. Checked locally at 1440.
Cubby push (a8c9f7b) verified live first: all new sections, images 200, banned words 0. IndexNow 200 for cubby, speaking, llms.txt.

## 2026-11-05 · Cubby case study rebuilt around the player; Speaking tagline

Cubby (cubby.html), per Aneil's comments on the 5 Nov markup (Cubby-Case-Study-Markup.html):
- Positioning: the core is now the player set for each person (brightness, contrast, color, warmth, dim, volume ceiling,
  captions, speed); the caregiver-picked library is built around it. New H1 "A video app tuned to their senses, designed and
  shipped solo", a why line from /press, title/description/og/twitter/JSON-LD updated to match.
- Hero keeps the photo (Aneil: it tells the story) and adds one iPhone (Sam's home, Balanced, from cubbyplaylist.com/press) over
  the pillow, plus the official App Store badge and "Join the Android beta" (forms.gle/UCoZSuTuahnhNbvW9, the same link as cubbyplaylist.com).
  On phones the iPhone rises from the bottom edge of the hero.
- New sections: Why I Care, See It (Shipaton demo zQNVwbs3jtM via youtube-nocookie, the with/without Cubby split from the live
  landing hero at 2x, Calm/Balanced/Engage phones), What Caregivers Taught Me (anonymized: two hours vs 20 minutes -> bulk add;
  "no escape" read as a threat -> "No recommendations. No rabbit holes."; picture and sound controls), Today & Next (facts plus
  the discovery paradox, co-parents, Android to production). Impact is gone; "The hard part" (tech stack, AI coding agents chip) is cut.
- Language guide: identity-first, intellectual and developmental disabilities spelled out, no "locked-down", "dignity" or "insulting".
  No coding claims: What I Did 05 now reads Figma -> written build plan -> AI-assisted tools in small batches, checked on a preview.
- What I Got Wrong adds the November yearly-row bug (looked clickable, wasn't; caught by using the site; yearly was always
  available in billing).
- Stats: Live (iPhone + web, Android beta) / Solo / 13+ / WCAG AA. Jump nav is eight sections.
- New images in assets/work: cubby-phone-{calm,balanced,engage}.jpg (560w), cubby-tune-split.jpg, cubby-story-now.jpg,
  app-store-badge.svg (Apple's official file, from cubbyplaylist.com). CSS in cases.css under "Cubby rebuild (Nov 2026)".
- Checked locally at 1440 and at 390 (iframe wrapper, since headless Chrome won't go narrower than ~500).

Speaking: "Imagination is the new scarcity. Let's design what should exist." now sits under the H1 (.sp-tagline in pages.css).
llms.txt: Cubby line rewritten to the new positioning and language.

## 2026-11-05 · Packet cover fixed for macOS Preview, new cover line, Speaking FAQ spacing, Work With Me ladder

- Work With Me "How much design do you actually need?": the five levels were stepped up with margin-top and kept their own heights,
  so the tops and bottoms were ragged (Aneil's screenshot). Now five equal-height cards on one baseline (grid-auto-rows:1fr), titles
  get room for two lines so every description starts at the same height, a "Lighter investment -> Heavier investment" axis sits above,
  and each card has a five-bar meter filled to its level. Under 1100px the cards become equal-height rows; under 640px, stacked cards.
  Checked at 1440, 1024 and 600 wide.
- Speaker packet: macOS Preview drew the cover's CSS grid and mask as tiled patterns with visible seams (Aneil's screenshot).
  The cover photo, navy shade and faint grid are now one flattened JPG (_source/speaker-packet/make_cover.py writes cover-hero.jpg),
  so the PDF has no masks or pattern fills. Checked with macOS's own renderer (sips, same engine as Preview) on all four pages.
- Cover line (Aneil, 5 Nov): "Imagination is the new scarcity. Let's design what should exist." replaces "Talks that make AI feel human, not hyped"
  on the packet. The Speaking page H1 is unchanged.
- Speaking: the FAQ ("Before you book") had an inline padding-top:0, so its eyebrow sat on the edge of the dark band after the light
  organizers band. Removed; it now gets the normal section padding (6.5rem desktop, 4.5rem under 700px).

## 2026-11-05 · Speaker packet; Cubby is a passion project; Behance no longer listed as ongoing

Cubby: "personal project" is now "passion project" everywhere on the site (Aneil, 5 Nov). 41 instances across about, cubby
(including JSON-LD keywords), portfolio, fractional-head-of-design, speaking, build/teams, the team one-pager, six blog posts,
llms.txt and llms-full.txt. The linkedin-import build.py, site_files.py and out/ copies are updated so a re-import keeps it.
Sitemap lastmod set to 2026-11-05 on every changed page.

Speaker packet (Aneil asked for one, 4 Nov)
- Page 2 adds "Off script is welcome": the five talks are starting points, plus a new talk (Dream It, Then Build It: anyone,
  creatives most of all, can build what they imagine now; also runs as his workshop for creatives), From Print to Digital,
  and AI in Plain English. The cover topic list includes the new talk.
- New 4-page PDF for event organizers: assets/speaking/aneil-razvi-speaker-packet.pdf (cover with short bio and headshot,
  five signature talks, recent stages and quotes, then intro to read on stage, long and short bios, at a glance, on-the-day needs, booking).
  Copy matches speaking.html; fee stays "on request".
- Source: _source/speaker-packet/speaker-packet.html. Re-render on the Mac with `bash _source/speaker-packet/render.sh` (Google Fonts need the Mac).
  Update it whenever speaking.html changes (talks, appearances, bios).
- Speaking "Booking at a glance": "Photos and a headshot on request." is now a download link to the packet (styled in assets/v3/pages.css). llms.txt links it too.

Behance: Aneil no longer facilitates Behance Portfolio Reviews (4 Nov).
- Speaking: removed the "Ongoing" group from Talks and appearances (its only item was Behance Portfolio Reviews).
- Speaking credibility strip: "Portfolio-review facilitator" now "Portfolio-review facilitator, 3 years" so it reads as a past credential.
- If I Had AI Then (build/portfolio): "Facilitates Behance Portfolio Reviews" now "Facilitated Behance Portfolio Reviews for 3 years".
- Kept as history: the "Behance Portfolio Reviews · 3 years" chip on Speaking and the past-appearances list in llms.txt.

## 2026-11-04 · Numbers-and-dates audit fixes, three posts caught up

Audit (4 Nov): every number, date and time on the 43 live pages, schema, llms files, sitemap and feed checked against the record.
Full findings: Résumé project doc SITE-AUDIT-NUMBERS-DATES-2026-11-04.

Blog
- Added Sidenote no. 03 (20 Oct), Issue no. 10 (27 Oct) and Issue no. 11 (3 Nov) as site posts, built from the live LinkedIn articles
  (build.py, then the new _source/linkedin-import/v3ify.py; v3ify reproduces all 12 existing posts byte-for-byte). Blog list, Latest feature,
  post count (15), topic filter, feed.xml, llms-full.txt, llms.txt, sitemap and the homepage Building in the Open cards updated.
- Cadence corrected to Tuesday ("New every Tuesday", "A new issue every Tuesday") on the blog and every post. Posts go out Tuesdays 7am CT.
- Coming up now lists Sidenote no. 04, Issue no. 12 and Issue no. 13.

Facts
- Kalkomey: 225%+ was the whole company's content-sales number, not Aneil's. Reframed everywhere (home stat now $300K+ cost savings,
  Kalkomey title, description, H1, stats, bullets, schema headline, About, Portfolio, Fractional page, llms.txt); 225% kept only as
  "company-wide" context on the case study. New share image assets/og/og-kalkomey.jpg.
- Privacy: "Last updated" was 20 September; the mobile-number and texts section was added 1 November. Date corrected.
- Omnitracs: "hundreds of thousands of vehicles across dozens of countries" contradicted the page's own ~1M and 60+. Now "about a million vehicles in more than 60 countries" (page, two schema descriptions).
- Sketch to Ship time added: 9am to 1pm (home, course page, FAQ, how it works, speaking, llms.txt) and in the Event and CourseInstance schema (-06:00, CST).
- Workshops: AI, Built On Paper card said three hours (course says four). Header and Work With Me now "Half a day to two weeks, for teams of 4 to 20";
  "two years ago" now "a few years ago".
- Speaking Event schema: end times, Mini-Con time and street address, online-event URLs, descriptions and images.
  Search Console (last update 2 Nov) showed the one invalid item was the nested "Texas Startup & Tech Week" superEvent
  (missing location and startDate). It is removed; the event name now carries "(Texas Startup & Tech Week)".
- Omnitracs product count settled at five (Aneil, 4 Nov): the rules-engine post said "merge four products"; now five, matching the case study. Tyler Forcum's testimonial ("3 separate product lines") is left as quoted.
- Live check after 1e03036 went READY: 33 of 33 production checks passed (curl, cache-busted); IndexNow HTTP 200 for 21 URLs.
- Maturity: InVision New Design Frontier dated 2019 (published 31 Jan 2019), not 2018.
- Cubby: competitor figures dated and corrected (Sensical 15k at launch, Kidoodle 45k+).
- About: independent practice row added (2026 to now).
- sitemap.xml lastmod set to 4 Nov on every page changed here; three new posts added.

## 2026-11-02 · Search Console, runbook, retired generators

- Google Search Console (property https://aneilrazvi.com/): sitemap resubmitted, read the same day, 37 pages discovered (was 34 on 24 Oct).
  Indexing requested for /build.html and /spotio-case-study.html (both "Indexing requested", priority crawl queue).
  Page indexing at the time: 31 indexed, 13 not. 8 of the 13 are alternates with a correct canonical (fine), 1 is /build (the QR redirect, fine),
  3 are "Discovered, currently not indexed" (Google has not crawled them yet), 1 is a duplicate without a chosen canonical (to check next time).
- RUNBOOK.md added: how to ship, preview, verify, ping IndexNow, use Search Console, build photo heroes and test lead forms.
- scripts/: seo_audit.py, indexnow.sh, preview.sh.
- Retired generators now refuse to run without --force: scripts/build_cases.py (would overwrite all nine case studies)
  and _source/linkedin-import/site_files.py (would overwrite the hand-kept sitemap.xml and llms.txt). README updated to match.

## 2026-11-02 · SEO and GEO pass

Audit: every page checked for title, description, canonical, Open Graph, Twitter card, JSON-LD, H1, alt text, sitemap and links
(script: _to_delete/seo_audit.py, not deployed). robots.txt already welcomes AI crawlers; llms.txt and llms-full.txt already strong.

Fixed
- Case-study titles were "SPOTIO, Aneil Razvi". Now keyword titles under 60 characters, e.g. "SPOTIO: Designing AI for Field Sales | Aneil Razvi".
  Same for Cubby, Omnitracs, SNHU, Kalkomey, Citi, Capital One, TPN, PhzMe, build.html and build/portfolio. og:title and twitter:title match.
- Meta descriptions over 160 characters cut to 129 to 160 on 14 pages (case studies, course pages, one blog post); og and twitter match.
- Share images: case studies used 780x487 thumbnails (LinkedIn shows those small). New 1200x630 images per case study in
  assets/og/og-<page>.jpg (hero photo, color logo, headline), used for og:image, twitter:image and the JSON-LD image.
- Structured data added where there was none: build.html (Course with three offers and course instances, plus the 5 Dec Sketch to Ship Event),
  build/faq (FAQPage with all 27 questions), build/how-it-works, build/teams (Service, $9,500), build/portfolio (Service, $395/$295),
  maturity.html and readiness.html (free WebApplication). All with Person and BreadcrumbList.
- Sitemap listed build/*.html while those pages declare build/<slug> as canonical. Sitemap now uses the canonical URLs.
  lastmod set to 2026-11-02 on the 20 pages changed today.
- llms.txt: canonical course URLs, plus the next Sketch to Ship date and founding prices.
- index.html: 16 decorative logo images got alt="".

Left as is
- maturity.html has no <html>/<head>/doctype wrapper (so no lang attribute). Adding one could change how the page renders; do it with a visual check.
- links.html and privacy.html stay out of the sitemap on purpose.

## 2026-11-02 · Cubby and SNHU hero logos from Aneil's files

- Cubby hero now uses Aneil's CUBBYLOGO.svg in brand purple #906099 (assets/logos/cubby-purple.svg), replacing the lavender variant.
- SNHU hero now uses the full-color logo (white wordmark, navy shield, blue and gold flame): assets/logos/snhu-color.svg.
- TPN is the only case-study logo still white.
- Portfolio page: the featured Cubby title now uses the same condensed uppercase type as the SPOTIO and SNHU cards (more.css .pf-feat-body h2).

## 2026-11-02 · Color client logos in the case-study heroes

- SPOTIO, Citi, Kalkomey, Capital One, Omnitracs, Cubby and PhzMe now show their brand color in the hero (class `keep-color`
  skips the white filter). Dark wordmark text was switched to white so it reads on the photo, and the brand accent stays:
  SPOTIO yellow pin, Citi red arc, Kalkomey red mark, Capital One red swoosh, Omnitracs green ring, Cubby lavender (#C0A8CE, from Figma).
- Files: assets/logos/<name>-color.svg (omnitracs-color.png and phzme-color.png are PNG). Omnitracs uses the green-ring mark from
  _source/logos/Omnitracs_Logo.png, which differs from the sun-gear mark in omnitracs.svg.
- SNHU and TPN stay white: both are one-color brands and white is their on-dark version.

## 2026-11-02 · Photo heroes on all nine case studies and About

Shipped
- Case-study heroes (SPOTIO, SNHU, Omnitracs, Kalkomey, Capital One, Citi, TPN, PhzMe, Cubby) now use the homepage treatment:
  a full-bleed photo with the 24s drift, the left-to-right navy shade and the grid. The framed image box on the right is gone.
- The client logo, in white, replaces the client name at the top of the copy column; the eyebrow keeps the category line.
- About uses the same treatment with the fly-fishing photo; the framed portrait is gone.
- Photos: assets/work/<page>-hero.jpg and about-fishing-hero.jpg, 2400x1350, 280 to 500 KB. Capital One, Omnitracs and Kalkomey
  are mirrored so the subject sits in the open right half. New logo files: assets/logos/cubby-white.svg (from Figma), phzme-color.png (keeps its orange and white; class keep-color skips the white filter).
- Styles: one reusable block `.csx-heroph` in assets/v3/cases.css (per-page `--hero`, `--hero-pos`, `--logo-h`) and `.abx-heroph` in pages.css.
- Motion stops for visitors with reduced motion turned on.

To add a photo hero to a new case study: copy the four hero lines from cubby.html, point `--hero` at a 2400x1350 photo
(subject on the right, no text in it), and swap the logo file.

## 2026-11-02 · Readiness keeps UTM tags

Fixed
- readiness.html: picking a job title rewrote the address to `?q=...&soc=...` and dropped every `utm_` tag
  before the lead was sent, so readiness leads never carried their source. The rewrite now keeps `utm_` params.
  Verified on production after deploy 584b3db: picking Graphic Designer keeps utm_source and utm_campaign in the address.
  Found by the test lead below: the maturity and Build rows kept utm_source=claude-test, the readiness row had null.

## 2026-11-02 · v3 supporting materials (commit 277776d)

Shipped
- Team one-pager rebuilt in the course theme (Graphite and Marigold): `assets/course/team-one-pager.html` and `.pdf`
- Thirty-Six Squares PDF refreshed: `thirty-six-squares.pdf`
- New share image `assets/og-image-v5.jpg`, wired into every public page's `og:image`
- Lead emails reworked in `api/lead.js` (maturity, readiness and Build list paths)
- Cubby wording updated across the case-study and site pages (31 files total)

Verified on production
- Vercel production deploy READY on commit 277776d
- One-pager, PDF and share image all return 200 with the right content types
- Every public page points `og:image` at og-image-v5.jpg. Only build-v2, idea-map and report have none, and all three are noindex
- End-to-end test lead through maturity.html (utm_source=claude-test, email aneilsr+sitetest@gmail.com):
  page showed "Report on its way", visitor email and "New lead" notice to hi@ both arrived,
  `leads` row written with status New and report_sent_at set, and the report.html link in the email renders

Also tested the same night (aneilsr+sitetest@gmail.com, name Claude Test)
- Readiness (Graphic Designer): page said "On its way", visitor email and "Readiness lookup" notice to hi@ both arrived, row written with report_sent_at
- Build list (at-home list): page said "Check your inbox", visitor email "You are on the list for the course" arrived, row written with report_sent_at
  The "Build list: ..." notice to hi@ is in the hi@ inbox at 8:28 PM (Resend: Delivered). hi@ forwards every message to
  aneilsr@gmail.com, and this one copy never arrived there, with no bounce in hi@. Gmail dropped the forwarded copy silently.
  The site code is fine, and earlier Build notices (Sep and Oct) forwarded normally. hi@ inbox is the source of truth for lead notices.
- All three test rows were deleted from `leads` afterwards

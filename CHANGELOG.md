# Changelog

Newest first. One entry per shipped push, with the proof it works on production.

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

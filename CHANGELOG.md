# Changelog

Newest first. One entry per shipped push, with the proof it works on production.

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

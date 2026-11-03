# Changelog

Newest first. One entry per shipped push, with the proof it works on production.

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

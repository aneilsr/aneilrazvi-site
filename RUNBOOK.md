# Runbook: shipping and verifying aneilrazvi.com

How Claude (or anyone) ships changes to this site and proves they work. Written 2 Nov 2026 after the photo-hero, color-logo and SEO/GEO passes.
The log of what shipped lives in CHANGELOG.md. Accounts and logins live in Aneil's ACCOUNTS.md, not here.

## Where things are
- Repo: this folder on Aneil's Mac (`~/Claude projects/aneilrazvi-site-v2`), GitHub `aneilsr/aneilrazvi-site`. Push to `main` deploys on Vercel.
- Vercel: project `aneilrazvi-portfolio`, team `cubby1`. A deploy takes about a minute.
- HTML files are the source of truth. There is no page generator anymore: `scripts/build_cases.py`, `scripts/seo_inject.py`
  and `_source/linkedin-import/site_files.py` are retired and refuse to run without `--force`.
- Styles: `assets/v3/v3.css` (shared), `cases.css` (case studies), `pages.css` (About and others), `more.css` (portfolio and others).
- Not deployed: `*.md`, `_source/`, `scripts/`, `_to_delete/` (see `.vercelignore`). `_to_delete/` is also gitignored: use it for scratch.

## Ship a change
1. Edit the files. Keep CHANGELOG.md updated in the same commit (newest first, with proof).
2. Preview locally: `bash scripts/preview.sh cubby about` (screenshots land in `_to_delete/preview/`).
3. Commit and push from the Mac. Claude does this through the Mac's shell, since the Linux file bridge cannot push.
4. Wait for the Vercel deploy to be READY, then verify on the live site with curl (pages 200, new assets 200, new CSS rule present).
   The first check right after READY can still be cached. Re-run once before calling it broken.
5. Ping search engines: `bash scripts/indexnow.sh /page.html /other-page.html`.

## SEO and GEO
- Audit everything: `python3 scripts/seo_audit.py` (titles, descriptions, canonicals, Open Graph, JSON-LD, H1s, alts, sitemap, links).
  Expected noise: build/* pages report "canon"/"not in sitemap" (they are canonical without .html), and links to build/* look broken
  to the script but are served by vercel.json rewrites.
- Rules the site follows: titles under 60 to 65 characters with keywords first and " | Aneil Razvi" last; descriptions 120 to 160;
  og:description and twitter:description match the meta description; share images 1200x630 (case studies use assets/og/og-<page>.jpg).
- Structured data is hand-written JSON-LD in each page head. Person @id is https://aneilrazvi.com/#aneil.
- sitemap.xml and llms.txt are hand-maintained. Update lastmod for every page you change, and add new pages and posts by hand.
- robots.txt welcomes AI crawlers. llms.txt and llms-full.txt are what AI engines read: keep facts (dates, prices, URLs) current.
- Google Search Console: property https://aneilrazvi.com/ (URL prefix). Sitemaps > submit `sitemap.xml`;
  URL inspection (search box at the top) > Request indexing for the most important changed pages. Google limits requests per day.
- After sharing on LinkedIn for the first time after a change, run the URL through linkedin.com/post-inspector to refresh the preview.

## Case-study and About heroes
- Pattern: `<section class="cs2-hero csx-heroph" style="--hero:url('/assets/work/<page>-hero.jpg');--hero-pos:62% 40%;--logo-h:40px">`
  followed by `.ph`, `.shade`, `.gridov`, then the copy column. The client logo sits at the top of the copy column in `.csx-logo`.
- Photos: 2400x1350, subject in the right half, no text baked in, about 300 KB. Mirror the photo if the subject is on the left.
- Logos: white versions get a white filter automatically. Color logos use `class="keep-color"`. Files in assets/logos/*-color.*.
- About uses the same layers in `.abx-heroph` (pages.css).

## Lead forms
- maturity.html, readiness.html and the Build list panel post to api/lead.js. Rows go to Supabase (project job-search-hq, table leads).
  Emails go out through Resend from hi@aneilrazvi.com: one to the visitor, one notice to hi@.
- hi@ is a Google Workspace inbox that forwards to Aneil's Gmail. Gmail can silently drop a forwarded copy, so the hi@ inbox is
  the source of truth for lead notices. Resend > Emails shows whether a message was delivered.
- To test: submit with aneilsr+sitetest@gmail.com and the name "Claude Test", check both inboxes and the leads row, then delete the row.

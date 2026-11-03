# Aneil Razvi — Portfolio site (source of truth)

This folder is the complete, self-contained home for aneilrazvi.com.
Everything the website needs is inside it — no dependency on the old
React site or any external CDN.

## What deploys (the website)
- `index.html` + `portfolio, speaking, work-with-me, about, blog, contact`
- Case studies: `spotio-case-study, omnitracs, snhu, kalkomey, citi,
  capital-one, tpn, phzme, cubby`
- `site.css` — one shared stylesheet
- `assets/` — every image the site references (logos, photos, case-study
  images, blog + Cubby story images). Fully local.

## What does NOT deploy (kept for editing)
- `_source/` — high-res masters: original client logos, case-study hero
  images, and all AIGA photos. Re-crop from here when you need a new size.
- `scripts/`: `seo_audit.py`, `indexnow.sh`, `preview.sh`. The old generators (`build_cases.py`, `seo_inject.py`) are retired and refuse to run.
- `*.md` docs. `.vercelignore` keeps all of this out of the deploy.

## Docs
- `RUNBOOK.md`: how to ship, preview, verify, ping search engines, and test the lead forms. Start here.
- `CHANGELOG.md`: what shipped, newest first, with the proof.
- `PUBLISHING.md` — how to deploy + point aneilrazvi.com here.
- `ASSET-CHECKLIST.md` — every image slot, filename, and size.
- `README-EDITING.md` — how to edit pages and add work/speaking/testimonials.
- `_source/MANIFEST.md` — what's in the masters archive and where it came from.

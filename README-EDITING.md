# Aneil Razvi Portfolio Site (static): how to edit and ship

Plain HTML/CSS/JS. No build step, no framework. Edit a file, push, it goes live.
This is the definitive guide. If you tell Claude "read README-EDITING.md," this is
what orients it. Claude also keeps this workflow in its project memory.

## THE RULE
No em dashes (the long dash) anywhere on the site or in copy. It reads as AI writing.
Regular hyphens and colons are fine. En-dashes are allowed only for ranges like 2017-2020.

## Structure
- `index.html` : Home
- `portfolio.html` : Work landing (two-tier grid)
- `<company>.html` : case studies (spotio-case-study, omnitracs, snhu, kalkomey, citi, capital-one, tpn, phzme, cubby)
- `work-with-me.html`, `about.html`, `blog.html`, `speaking.html`, `contact.html`
- `site.css` : shared styles (the whole design system)
- `assets/` : images (`assets/work/` holds case-study + section images)
- `scripts/build_cases.py` : regenerates the 9 case-study pages from one content list
- `scripts/seo_inject.py` : regenerates SEO tags for the 7 hand pages + writes sitemap.xml and robots.txt
- `sitemap.xml`, `robots.txt`, `llms.txt` : search + AI-discovery files (keep them current)

## Common edits
- Add a Speaking item: edit `speaking.html`, copy a `.talk-card` block, change the text.
- Add a Testimonial (Work With Me): edit `work-with-me.html`, copy a `.rec` block; drop a square photo in `assets/work/` and point the `<img class="av">` at it.
- Add or change a portfolio piece: the case studies are generated. Edit `scripts/build_cases.py` (the `CASES` list), then run `python3 scripts/build_cases.py` from this folder. It rewrites the case `.html` files. (Or hand it to Claude and say what to change.)
- Swap an image: replace the file in `assets/` using the same filename. Selected-Work images are 1600x1000 (16:10); About portrait/personal are 1200x1500 (4:5); blog thumbs 1200x675 (16:9); the social share card `assets/og-image.jpg` is 1200x630.
- Add or remove a page: also update the slug list in `scripts/seo_inject.py` and re-run it so the sitemap stays correct.
- Booking link: search-replace the Calendar schedule id if your Google booking link changes.

## SEO and AI discovery (already built, keep intact)
- Every page carries a meta description, canonical (pointing to https://aneilrazvi.com/...), Open Graph, Twitter card, and JSON-LD structured data.
- `index.html` has a Google Search Console verification meta tag in its head. Do not remove it, or Search Console will un-verify the site.
- The site is verified in Google Search Console and its sitemap is submitted.

## Deploy (this is the whole loop now)
The site auto-deploys from GitHub. There is no manual Vercel command anymore.

From this folder, in a regular Terminal (NOT Claude Code):
```
git add -A
git commit -m "what you changed"
git push
```
That is it. Vercel builds `main` and updates https://aneilrazvi.com in about 30 seconds.
If git complains about a lock file, run `rm -f .git/index.lock` first.

- Live site: https://aneilrazvi.com (www redirects to it)
- GitHub repo: aneilsr/aneilrazvi-site (branch main)
- Vercel: team cubby1, project aneilrazvi-portfolio (static, auto-deploy on push)

## Notes
- `_source/` (high-res masters), `scripts/`, and the `.md` docs do not deploy (see `.vercelignore`).
- Only your machine can push (it has the GitHub key). Claude edits and preps files, you run the push.

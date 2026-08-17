# Aneil Razvi — Portfolio Site (static)

Plain HTML/CSS/JS. **No build step.** Edit a file, save, redeploy. This is intentional so you can keep adding work, speaking, and testimonials over time without touching a framework.

## Structure
- `index.html` — Home
- `portfolio.html` — Work landing (two-tier grid)
- `<company>.html` — case studies (spotio-case-study, omnitracs, snhu, kalkomey, citi, capital-one, tpn, phzme, cubby)
- `work-with-me.html`, `about.html`, `blog.html`, `speaking.html`, `contact.html`
- `site.css` — shared styles (the whole design system)
- `assets/` — images (`assets/work/` holds case-study + section images)
- `scripts/build_cases.py` — regenerates the 9 case-study pages from one content list

## Common edits
- **Add a Speaking item:** edit `speaking.html` — copy a `.talk-card` block, change the text.
- **Add a Testimonial (Work With Me):** edit `work-with-me.html` — copy a `.rec` block; drop a square photo in `assets/work/` and point the `<img class="av">` at it.
- **Add / change a portfolio piece:** the case studies are generated. Edit `scripts/build_cases.py` (the `CASES` list + `EXTRA`/`PILLS`), then run `python3 scripts/build_cases.py` from this folder. It rewrites the `.html` files. (Or hand it to Claude and say what to change.)
- **Swap an image:** replace the file in `assets/work/` using the **same filename**. Selected-Work images are **1600×1000 (16:10)**; About portrait/personal are **1200×1500 (4:5)**; blog thumbs **1200×675 (16:9)**.
- **Booking link:** search-replace `insHQBTTsdfgxxMz5` if your Google Calendar link changes.

## Deploy
First time (Terminal — a regular terminal, NOT Claude Code), from this folder:
```
npx vercel            # preview URL (asks you to log in the first time)
npx vercel --prod     # promote to production
```
Best long-term: push this folder to a GitHub repo and "Import Project" in Vercel — then every push auto-deploys, and you can point aneilrazvi.com at it.

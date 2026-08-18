#!/usr/bin/env python3
"""Inject SEO/AEO metadata + JSON-LD into the 7 hand-authored pages, and
generate sitemap.xml, robots.txt, llms.txt. Idempotent: re-running replaces
the block between <!-- SEO-START --> and <!-- SEO-END -->.
Run from the site root (where the .html files live)."""
import html, json, re, os

BASE = "https://aneilrazvi.com"
OG = f"{BASE}/assets/og-image.jpg"
LINKEDIN = "https://www.linkedin.com/in/aneilrazvi/"

# ---- shared entity nodes (identical on every page, so each page is self-describing) ----
PERSON = {
    "@type": "Person",
    "@id": f"{BASE}/#aneil",
    "name": "Aneil Razvi",
    "url": f"{BASE}/",
    "image": OG,
    "jobTitle": "VP of Product Design & AI Experience",
    "description": ("Product design and AI experience leader with 15+ years building design teams, "
                    "AI-native products, and 0 to 1 experiences across enterprise and startups."),
    "address": {"@type": "PostalAddress", "addressLocality": "Allen", "addressRegion": "TX", "addressCountry": "US"},
    "sameAs": [LINKEDIN, "https://cubbyplaylist.com"],
    "knowsAbout": [
        "AI product design", "AI experience strategy", "Human-in-the-loop AI",
        "Product design leadership", "Design systems", "Building and scaling design teams",
        "Fractional design leadership", "Design maturity", "UX research",
        "0 to 1 product design", "Enterprise UX", "Accessibility", "Design operations",
    ],
    "knowsLanguage": "en",
}
WEBSITE = {
    "@type": "WebSite",
    "@id": f"{BASE}/#website",
    "url": f"{BASE}/",
    "name": "Aneil Razvi",
    "description": "Portfolio of Aneil Razvi, product design and AI experience leader.",
    "publisher": {"@id": f"{BASE}/#aneil"},
    "inLanguage": "en",
}

# ---- per-page metadata ----
PAGES = {
    "index.html": {
        "slug": "", "type": "website", "pagetype": "WebPage",
        "title": "Aneil Razvi, VP of Product Design & AI Experience",
        "desc": ("Aneil Razvi is a product design and AI experience leader in Allen, Texas, with 15+ years "
                 "building design teams, AI-native products, and 0 to 1 experiences."),
        "crumbs": [],
    },
    "portfolio.html": {
        "slug": "portfolio.html", "type": "website", "pagetype": "CollectionPage",
        "title": "Portfolio, Aneil Razvi",
        "desc": ("Selected product design and AI work by Aneil Razvi across SPOTIO, Omnitracs, SNHU, "
                 "Kalkomey, Citi, Capital One, TPN, and Cubby."),
        "crumbs": [("Portfolio", "portfolio.html")],
    },
    "speaking.html": {
        "slug": "speaking.html", "type": "website", "pagetype": "WebPage",
        "title": "Speaking, Aneil Razvi",
        "desc": ("Aneil Razvi speaks on AI-native product design, design maturity, and building design teams. "
                 "20+ talks including Vista UX Summit and AIGA Dallas."),
        "crumbs": [("Speaking", "speaking.html")],
    },
    "work-with-me.html": {
        "slug": "work-with-me.html", "type": "website", "pagetype": "WebPage",
        "title": "Work With Me, Aneil Razvi",
        "desc": ("Work with Aneil Razvi: fractional design leadership, AI product strategy, and "
                 "design-maturity assessments sized to where your company actually is."),
        "crumbs": [("Work With Me", "work-with-me.html")],
    },
    "about.html": {
        "slug": "about.html", "type": "profile", "pagetype": "ProfilePage",
        "title": "About, Aneil Razvi",
        "desc": ("About Aneil Razvi, a product design and AI experience leader in Allen, Texas. How he leads, "
                 "what he believes about design maturity, and the teams he has built."),
        "crumbs": [("About", "about.html")],
    },
    "blog.html": {
        "slug": "blog.html", "type": "website", "pagetype": "CollectionPage",
        "title": "Blog, Aneil Razvi",
        "desc": "Writing by Aneil Razvi on product design, AI experience, and design leadership.",
        "crumbs": [("Blog", "blog.html")],
    },
    "contact.html": {
        "slug": "contact.html", "type": "website", "pagetype": "ContactPage",
        "title": "Contact, Aneil Razvi",
        "desc": ("Get in touch with Aneil Razvi. Book a call about fractional design leadership, AI product "
                 "work, design-maturity assessments, or speaking."),
        "crumbs": [("Contact", "contact.html")],
    },
}


def crumb_node(url, crumbs):
    items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"}]
    for i, (name, slug) in enumerate(crumbs, start=2):
        items.append({"@type": "ListItem", "position": i, "name": name, "item": f"{BASE}/{slug}"})
    return {"@type": "BreadcrumbList", "@id": f"{url}#breadcrumb", "itemListElement": items}


def build_block(meta):
    slug = meta["slug"]
    url = f"{BASE}/{slug}" if slug else f"{BASE}/"
    title = meta["title"]
    desc = meta["desc"]
    e = lambda s: html.escape(s, quote=True)

    page_node = {
        "@type": meta["pagetype"],
        "@id": f"{url}#webpage",
        "url": url,
        "name": title,
        "description": desc,
        "isPartOf": {"@id": f"{BASE}/#website"},
        "about": {"@id": f"{BASE}/#aneil"},
        "primaryImageOfPage": OG,
        "inLanguage": "en",
    }
    if meta["pagetype"] == "ProfilePage":
        page_node["mainEntity"] = {"@id": f"{BASE}/#aneil"}

    graph = [PERSON, WEBSITE, page_node]
    if meta["crumbs"]:
        graph.append(crumb_node(url, meta["crumbs"]))
    ld = {"@context": "https://schema.org", "@graph": graph}
    ldjson = json.dumps(ld, ensure_ascii=False, separators=(",", ":"))

    lines = [
        "<!-- SEO-START -->",
        f'<meta name="description" content="{e(desc)}"/>',
        '<meta name="author" content="Aneil Razvi"/>',
        '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>',
        f'<link rel="canonical" href="{url}"/>',
        f'<meta property="og:type" content="{meta["type"]}"/>',
        '<meta property="og:site_name" content="Aneil Razvi"/>',
        f'<meta property="og:title" content="{e(title)}"/>',
        f'<meta property="og:description" content="{e(desc)}"/>',
        f'<meta property="og:url" content="{url}"/>',
        f'<meta property="og:image" content="{OG}"/>',
        '<meta property="og:image:width" content="1200"/>',
        '<meta property="og:image:height" content="630"/>',
        '<meta property="og:image:alt" content="Aneil Razvi, Product Design and AI Experience"/>',
        '<meta name="twitter:card" content="summary_large_image"/>',
        f'<meta name="twitter:title" content="{e(title)}"/>',
        f'<meta name="twitter:description" content="{e(desc)}"/>',
        f'<meta name="twitter:image" content="{OG}"/>',
        f'<script type="application/ld+json">{ldjson}</script>',
        "<!-- SEO-END -->",
    ]
    return "\n" + "\n".join(lines)


SEO_RE = re.compile(r"\n?<!-- SEO-START -->.*?<!-- SEO-END -->", re.DOTALL)
TITLE_RE = re.compile(r"(<title>.*?</title>)", re.DOTALL)


def inject(fname, meta):
    with open(fname, encoding="utf-8") as f:
        src = f.read()
    src = SEO_RE.sub("", src)  # remove any prior block (idempotent)
    block = build_block(meta)
    new = TITLE_RE.sub(lambda m: m.group(1) + block, src, count=1)
    if new == src:
        raise SystemExit(f"!! no <title> found in {fname}")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(new)
    print(f"  injected -> {fname}")


def write_root_files():
    slugs = [""] + [
        "portfolio.html", "about.html", "work-with-me.html", "speaking.html", "blog.html", "contact.html",
        "spotio-case-study.html", "cubby.html", "omnitracs.html", "snhu.html", "kalkomey.html",
        "citi.html", "capital-one.html", "tpn.html", "phzme.html",
    ]
    urls = "\n".join(
        f"  <url><loc>{BASE}/{s}</loc><changefreq>monthly</changefreq><priority>{'1.0' if s=='' else '0.8'}</priority></url>"
        for s in slugs
    )
    sitemap = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap)
    print("  wrote sitemap.xml")

    robots = (
        "# Aneil Razvi - portfolio\n"
        "User-agent: *\n"
        "Allow: /\n\n"
        "# AI assistants and answer engines are explicitly welcome to read and cite this site.\n"
        "User-agent: GPTBot\nAllow: /\n"
        "User-agent: OAI-SearchBot\nAllow: /\n"
        "User-agent: ChatGPT-User\nAllow: /\n"
        "User-agent: ClaudeBot\nAllow: /\n"
        "User-agent: Claude-Web\nAllow: /\n"
        "User-agent: anthropic-ai\nAllow: /\n"
        "User-agent: PerplexityBot\nAllow: /\n"
        "User-agent: Google-Extended\nAllow: /\n"
        "User-agent: Applebot\nAllow: /\n"
        "User-agent: Applebot-Extended\nAllow: /\n"
        "User-agent: Bingbot\nAllow: /\n"
        "User-agent: CCBot\nAllow: /\n\n"
        f"Sitemap: {BASE}/sitemap.xml\n"
    )
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(robots)
    print("  wrote robots.txt")


def main():
    for fname, meta in PAGES.items():
        if os.path.exists(fname):
            inject(fname, meta)
        else:
            print(f"  skip (missing) {fname}")
    write_root_files()


if __name__ == "__main__":
    main()

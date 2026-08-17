import re
FONTS='<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">'
def nav(active):
    def it(h,l):
        cls=' class="active"' if l==active else ''
        return f'<li><a href="{h}"{cls}>{l}</a></li>'
    return ('<nav class="site-nav" id="nav"><a href="index.html" class="nav-brand">Aneil <b>Razvi</b></a>'
            '<ul class="nav-links">'+it("index.html","Home")+it("portfolio.html","Portfolio")+it("speaking.html","Speaking")
            +it("work-with-me.html","Work With Me")+it("about.html","About")+it("blog.html","Blog")+'</ul>'
            '<a href="contact.html" class="nav-cta">Let\'s Talk</a>'
            '<button class="nav-hamburger" aria-label="Menu"><span></span><span></span><span></span></button></nav>')
FOOT=('<footer style="background:#0a1420;border-top:1px solid rgba(255,255,255,.08);padding:40px 6%;text-align:center;color:rgba(255,255,255,.6)">'
      '<div style="font-family:\'DM Serif Display\',serif;font-size:1.2rem;color:#fff;margin-bottom:12px">Aneil <span style="color:var(--teal)">Razvi</span></div>'
      '<div style="font-size:.9rem"><a style="color:#cfe;text-decoration:none;margin:0 10px" href="https://www.linkedin.com/in/aneilrazvi/" target="_blank">LinkedIn</a>·'
      '<a style="color:#cfe;text-decoration:none;margin:0 10px" href="https://calendar.app.google/insHQBTTsdfgxxMz5" target="_blank">Book a call</a>·'
      '<a style="color:#cfe;text-decoration:none;margin:0 10px" href="mailto:aneilsr@gmail.com">Email</a></div>'
      '<div style="font-size:.78rem;color:rgba(255,255,255,.4);margin-top:14px">© 2026 Aneil Razvi · Allen, TX</div></footer>')

def videos_section(c):
    vids=c.get("videos")
    if not vids: return ""
    slides=[]
    for i,v in enumerate(vids):
        if v.get("id"):
            frame=(f'<div class="vidframe"><iframe src="https://player.vimeo.com/video/{v["id"]}?title=0&byline=0&portrait=0" '
                   f'loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>')
        else:
            frame=('<div class="vidframe placeholder"><div><div class="play">&#9654;</div>'
                   'Add the Vimeo ID and this slot fills in.</div></div>')
        slides.append(f'<div class="vidslide"><div>{frame}</div>'
                      f'<div class="vidmeta"><span class="vidnum">{i+1:02d}</span>'
                      f'<div><h4>{v["title"]}</h4><p>{v.get("sub","")}</p></div></div></div>')
    dots="".join(f'<button class="viddot" data-i="{i}" aria-label="Video {i+1}"></button>' for i in range(len(vids)))
    return (f'<section class="cs2-sec alt"><div class="cs2-wrap"><div class="cs2-eyebrow">Walkthroughs</div>'
            f'<h2>{c.get("vid_h","See the work in motion")}</h2>'
            f'<p class="cs2-vid-lead">{c.get("vid_lead","")}</p>'
            f'<div class="vidcarousel"><button class="vidnav prev" aria-label="Previous">&#8249;</button>'
            f'<div class="vidtrack">{"".join(slides)}</div>'
            f'<button class="vidnav next" aria-label="Next">&#8250;</button></div>'
            f'<div class="viddots">{dots}</div></div></section>')

def gallery_section(c):
    g=c.get("gallery")
    if not g or not g.get("items"): return ""
    items=g["items"]; n=len(items); multi=n>1
    arrows=('<button class="spot-arrow prev" aria-label="Previous">&#8249;</button>'
            '<button class="spot-arrow next" aria-label="Next">&#8250;</button>') if multi else ''
    panels=[]; thumbs=[]
    for i,it in enumerate(items):
        eb=f'<span class="spot-eyebrow">{it["eyebrow"]}</span>' if it.get("eyebrow") else ''
        counter=f'<span class="spot-n">{i+1:02d} / {n:02d}</span>' if multi else ''
        pills="".join(f"<span>{p}</span>" for p in it.get("pills",[]))
        pillrow=f'<div class="spot-pills">{pills}</div>' if pills else ''
        linkhtml=(f'<a class="spot-link" href="{it["link"]}" target="_blank" rel="noopener">{it.get("link_label","See it live")} &rarr;</a>'
                  if it.get("link") else '')
        panels.append(f'<div class="spot-panel{" active" if i==0 else ""}" data-i="{i}">'
                      f'<div class="spot-figure"><img src="assets/work/{it["img"]}.jpg" alt="{it["title"]}" loading="lazy">{arrows}</div>'
                      f'<div class="spot-copy">{counter}{eb}'
                      f'<h3>{it["title"]}</h3><p>{it["body"]}</p>{pillrow}{linkhtml}</div></div>')
        thumbs.append(f'<button class="spot-thumb{" active" if i==0 else ""}" data-i="{i}" aria-label="{it["title"]}">'
                      f'<img src="assets/work/{it["img"]}.jpg" alt="" loading="lazy"><span>{it["title"]}</span></button>')
    thumbstrip=f'<div class="spot-thumbs">{"".join(thumbs)}</div>' if multi else ''
    return (f'<section class="cs2-sec"><div class="cs2-wrap"><div class="cs2-eyebrow">{g.get("label","Selected Work")}</div>'
            f'<h2>{g.get("title","Concepts and explorations")}</h2>'
            f'<div class="cs2-spot{"" if multi else " single"}"><div class="spot-stage">{"".join(panels)}</div>'
            f'{thumbstrip}</div></div></section>')

def story_section(c):
    s=c.get("story")
    if not s: return ""
    steps=[]
    for st in s["steps"]:
        if st.get("ph"):
            fig=(f'<div class="story-figure ph"><span class="ph-dim">{st.get("dim","1600 × 1000")}</span>'
                 f'<span class="ph-label">{st.get("ph_label","Image to add")}</span></div>')
        else:
            fig=f'<div class="story-figure"><img src="assets/work/{st["img"]}.jpg" alt="{st.get("title","")}" loading="lazy"></div>'
        eb=f'<span class="story-eyebrow">{st["eyebrow"]}</span>' if st.get("eyebrow") else ''
        steps.append(f'<div class="story-step">{fig}<div class="story-copy">{eb}<h3>{st["title"]}</h3><p>{st["body"]}</p></div></div>')
    note=f'<p class="story-note">{s["note"]}</p>' if s.get("note") else ''
    return (f'<section class="cs2-sec alt"><div class="cs2-wrap"><div class="cs2-eyebrow">{s.get("label","The Journey")}</div>'
            f'<h2>{s.get("title","Where it started, where it is now")}</h2>{note}'
            f'<div class="story-steps">{"".join(steps)}</div></div></section>')

CAROUSEL_JS='''<script>
document.querySelectorAll('.vidcarousel').forEach(function(car){
  var track=car.querySelector('.vidtrack');var slides=[].slice.call(track.children);
  var dotsWrap=car.parentElement.querySelector('.viddots');var dots=dotsWrap?[].slice.call(dotsWrap.children):[];
  function cur(){var c=track.scrollLeft+track.clientWidth/2,idx=0,min=1e9;slides.forEach(function(s,i){var ce=s.offsetLeft+s.offsetWidth/2,d=Math.abs(ce-c);if(d<min){min=d;idx=i;}});return idx;}
  function to(i){i=Math.max(0,Math.min(slides.length-1,i));var s=slides[i];track.scrollTo({left:s.offsetLeft-(track.clientWidth-s.offsetWidth)/2,behavior:'smooth'});}
  var p=car.querySelector('.prev'),n=car.querySelector('.next');
  if(p)p.addEventListener('click',function(){to(cur()-1);});
  if(n)n.addEventListener('click',function(){to(cur()+1);});
  dots.forEach(function(d,i){d.addEventListener('click',function(){to(i);});});
  track.addEventListener('scroll',function(){var i=cur();dots.forEach(function(d,j){d.classList.toggle('active',j===i);});},{passive:true});
  if(dots[0])dots[0].classList.add('active');
});
document.querySelectorAll('.cs2-spot').forEach(function(sp){
  var panels=[].slice.call(sp.querySelectorAll('.spot-panel'));
  var thumbs=[].slice.call(sp.querySelectorAll('.spot-thumb'));
  var idx=0;
  function set(i){idx=(i+panels.length)%panels.length;panels.forEach(function(p,j){p.classList.toggle('active',j===idx);});thumbs.forEach(function(t,j){t.classList.toggle('active',j===idx);});}
  thumbs.forEach(function(t,i){t.addEventListener('click',function(){set(i);});});
  sp.querySelectorAll('.spot-arrow.prev').forEach(function(b){b.addEventListener('click',function(){set(idx-1);});});
  sp.querySelectorAll('.spot-arrow.next').forEach(function(b){b.addEventListener('click',function(){set(idx+1);});});
});
var nv=document.getElementById('nav');
if(nv)window.addEventListener('scroll',function(){nv.classList.toggle('scrolled',window.scrollY>40);});
var hb=document.querySelector('.nav-hamburger');
if(hb&&nv)hb.addEventListener('click',function(){nv.classList.toggle('open');});
</script>'''

def page(c):
    stats="".join(f'<div><span class="n">{n}</span><span class="l">{l}</span></div>' for n,l in c["stats"])
    ctx="".join(f"<p>{p}</p>" for p in c["context"])
    did="".join(f"<li>{b}</li>" for b in c["did"])
    imp="".join(f"<li>{b}</li>" for b in c["impact"])
    tags="".join(f"<span>{t}</span>" for t in c["tags"])
    vidsec=videos_section(c)
    gallsec=gallery_section(c)
    storysec=story_section(c)
    if c.get("live_url"):
        cta_h="See it live, or let's talk"
        appstore=(f'<a class="cs2-btn appstore" href="{c["appstore_url"]}" target="_blank" rel="noopener">'
                  f'<svg viewBox="0 0 384 512" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>'
                  f'Download on the App Store</a>') if c.get("appstore_url") else ''
        cta_btns=(f'<a class="cs2-btn" href="{c["live_url"]}" target="_blank" rel="noopener">Visit {c["title"]} live &rarr;</a>'
                  f'{appstore}'
                  f'<a class="cs2-btn ghost" href="portfolio.html">&larr; All Work</a>'
                  f'<a class="cs2-btn ghost" href="contact.html">Get in touch</a>')
    else:
        cta_h="Explore more, or let's talk"
        cta_btns=('<a class="cs2-btn ghost" href="portfolio.html">&larr; All Work</a>'
                  '<a class="cs2-btn" href="contact.html">Get in touch</a>')
    body=f'''
<section class="cs2-hero" style="background-image:linear-gradient(rgba(10,18,28,.82),rgba(10,18,28,.88)),url('assets/work/{c["img"]}.jpg')">
  <div class="cs2-hero-inner">
    <div class="cs2-eyebrow light">{c["category"]}</div>
    <h1>{c["h1"]}</h1>
    <div class="cs2-role">{c["role"]}</div>
    <p class="cs2-lead">{c["lead"]}</p>
    <div class="cs2-stats">{stats}</div>
  </div>
</section>
<section class="cs2-sec"><div class="cs2-wrap"><div class="cs2-eyebrow">The Context</div><h2>{c["ctx_h"]}</h2>{ctx}</div></section>
<section class="cs2-sec alt"><div class="cs2-wrap"><div class="cs2-eyebrow">What I Did</div><h2>{c["did_h"]}</h2><ul class="cs2-list">{did}</ul></div></section>
{gallsec}
{storysec}
{vidsec}
<section class="cs2-sec dark"><div class="cs2-wrap"><div class="cs2-eyebrow light">Impact</div><h2>{c["imp_h"]}</h2><ul class="cs2-list">{imp}</ul><div class="cs2-tags">{tags}</div></div></section>
<section class="cs2-cta"><div class="cs2-wrap"><h2>{cta_h}</h2>
  <div class="cs2-cta-btns">{cta_btns}</div></div></section>'''
    return f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{c["title"]}, Aneil Razvi</title>{FONTS}<link rel="stylesheet" href="site.css"></head><body>
{nav("Portfolio")}{body}{FOOT}{CAROUSEL_JS}</body></html>'''

CASES=[
{"file":"spotio-case-study.html","img":"spotio","title":"SPOTIO","category":"SPOTIO · B2B Field-Sales SaaS","role":"Director of Product Design · 2025–2026",
 "h1":"Designing the <em>AI experience</em> for field sales","lead":"Recruited to build the design function and lead AI experience strategy for a platform used by thousands of field-sales teams, so reps spend less time on admin and more time closing.",
 "stats":[("AI Co-pilot","Shipped to GA"),("Design fn","Built 0→1"),("1000s","Teams served"),("Legacy","Full redesign")],
 "ctx_h":"A platform on legacy rails, with AI on the horizon","context":["SPOTIO serves field-sales teams in medical devices, distribution, and construction: reps who live on the road, not at a desk. Design operated as a production function on a legacy platform with years of accumulated usability debt, no research practice, and AI features planned without an experience framework.","My mandate was to build design as a strategic function and define how AI would show up in the product: the difference between noise and a co-pilot reps actually trust."],
 "did_h":"From production shop to strategic AI experience","did":["Defined a six-part AI experience strategy: how next-best-actions, coaching insights, and message suggestions surface at the right moments in the sales workflow","Shaped DASH, an AI co-pilot built on human-in-the-loop, decision-support patterns, now generally available","Re-architected the platform's mental-model layer and information architecture on top of legacy infrastructure","Redesigned the chat and engagement experience to strip administrative friction and return reps to human-first selling","Established the design system, a design-to-development workflow, and a product taxonomy","Drove an organization-wide AI upskilling program across product, engineering, and customer success"],
 "imp_h":"Intelligence in the flow of the work","impact":["An AI co-pilot in production that surfaces the next best action without getting in the way","A reusable design system and workflow that scaled quality and compressed delivery cycles","A research and design practice that gave the product a strategic seat at the table"],
 "tags":["AI Experience Strategy","Design Systems","Information Architecture","B2B SaaS","Research 0→1","Design Leadership"],
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"spotio-customer-communication","title":"Onboarding and communication","body":"AI as a co-pilot, not a crutch. I designed onboarding and customer communication so AI guided reps through the process and strengthened the natural flow of their work, rather than taking over or adding one more thing to manage."},
   {"img":"spotio-calendar-suggestions","title":"Just-in-time actions on the calendar","body":"I introduced calendar suggestions that surface in the gaps. When a rep had a spare minute, the calendar offered a quick, relevant action to take right then, turning dead time into progress without pulling them out of their day."},
   {"img":"spotio-testing-concept","title":"Testing with our customers","body":"Before committing engineering time to new features, I ran a hands-on testing process with small batches of real end users: change the product, test again, loop after loop, until we reached the right solution. We earned confidence before we spent the build."},
   {"img":"spotio-next-best-action","title":"Next best action, enhanced by AI","body":"Back-office managers have to keep themselves and their teams taking the right action at the right moment, and too many signals leads to decision paralysis. I built a system that weighs the relevant factors and surfaces clear suggestions, so the information needed to make a fast, confident call is right at their fingertips."}
 ]},
 "vid_h":"See the work in motion","vid_lead":"Short walkthroughs of the AI experience: the framework, the DASH co-pilot, and the legacy redesign in the product.",
 "videos":[
   {"id":"1210968441","title":"Latest walkthrough","sub":"The newest cut: a fresh overview of the SPOTIO AI experience. (Rename this title anytime.)"},
   {"id":"1205895198","title":"AI experience strategy","sub":"The six-part framework and DASH, the human-in-the-loop co-pilot."},
   {"id":"1199087661","title":"Rebuilding the legacy mental model","sub":"Redesigning the core so reps sell more and fight software less."}
 ]},

{"file":"omnitracs.html","img":"omnitracs","title":"Omnitracs","category":"Omnitracs · Global Fleet Management","role":"UX Manager → Sr. Manager · 2016–2020",
 "h1":"Unifying a fragmented fleet platform with a <em>design system</em> and ML","lead":"One of the world's largest fleet-management platforms (hundreds of thousands of vehicles across dozens of countries) grown by acquisition into a fragmented, high-cognitive-load ecosystem.",
 "stats":[("'Logic Blocks'","ML mental architecture"),("~1M","Vehicles"),("60+","Countries"),("0→1","UX Research")],
 "ctx_h":"Many acquired products, one incoherent experience","context":["Omnitracs had grown through acquisitions into a patchwork of products spanning mobile, web, cloud, and IoT hardware. Professional operators faced high cognitive load and inconsistent interfaces, and design lacked standards, process, and credibility.","The job was to raise the bar, and make dense operational data feel calm and usable for people making decisions on the road."],
 "did_h":"Systems, research, and intelligence at scale","did":["Introduced 'logic blocks,' a modular, composable design system and pattern library that unified the acquired products","Founded and led the UX Research practice: ride-alongs, weekly user interviews, SME validation, and Pendo analytics","Architected an ML-powered next-best-action framework to reduce cognitive load by surfacing critical insights at decision moments","Scaled the system and UX roadmap to support 1,000+ new customer onboardings and international expansion","Deployed a compliant Hours-of-Service (HOS/ELD) feature to meet FMCSA mandates","Ran organization-wide alignment workshops (Design Thinking, Event Storming, Design Sprints) and helped migrate teams from waterfall to agile"],
 "imp_h":"One coherent platform, calmer decisions","impact":["A fragmented portfolio unified into a single coherent system","Measurably reduced operator decision fatigue through ML-surfaced next-best-actions","A UX research practice and design system that outlived any single release"],
 "tags":["Design Systems","ML / Next-Best-Action","UX Research","Information Design","Enterprise","IoT & Hardware"]},

{"file":"snhu.html","img":"snhu","title":"SNHU","category":"SNHU · Online Higher Education","role":"Director of Product Design · 2021–2023",
 "h1":"Building a <em>product design department</em> from zero","lead":"One of the largest nonprofit online universities in the U.S. had scattered designers but no product design function (no standards, no systems, no operating model) while needing to modernize learner-facing technology at scale.",
 "stats":[("0→1","Department built"),("7","Designers led"),("5×","Productivity"),("ML","Credit tool")],
 "ctx_h":"Scattered designers, no function","context":["SNHU needed a real product design organization: the team, the craft, and the systems, all at the same time, in an institution serving hundreds of thousands of learners.","I was hired to build it and to raise the bar on how design shows up across learner-facing products."],
 "did_h":"Team, craft, and systems, at once","did":["Built the Product Design department from zero: recruited the team, defined the function, and set the operating model","Led seven product designers directly within a broader org spanning graphic designers, researchers, and content creators, with a development partnership with Google","Boosted team productivity fivefold and significantly lifted satisfaction through career-ladder frameworks, mentorship, and design-operations maturity","Built multi-layered Figma design systems (architecture, motion, illustration) and the critique, design-review, and quality frameworks that held craft","Established a product-development lifecycle aligning design, product, and engineering","Led R&D for a next-generation skill-based learning platform through beta, plus an ML credit-for-prior-learning tool that halved a registrar's processing time"],
 "imp_h":"A function that scaled the craft","impact":["A mature design organization built from the ground up","Fivefold productivity gain and a stronger, better-supported team","Shipped learner-facing platforms and an ML tool that cut real processing time in half"],
 "tags":["Org Building","Design Systems","Design Operations","Team Leadership","EdTech","R&D"]},

{"file":"kalkomey.html","img":"kalkomey","title":"Kalkomey","category":"Kalkomey · Outdoor-Safety Education & E-commerce","role":"Director of Product / UX · 2020–2021",
 "h1":"<em>225%+ revenue growth</em> through a user-centered pivot","lead":"North America's leading outdoor-safety education and e-commerce company faced a pandemic-era demand surge and an acquisition to integrate, with product experiences that weren't yet user-centered.",
 "stats":[("225%+","Content sales"),("$300K+","Cost savings"),("5","Product launches"),("M&A","Integrated")],
 "ctx_h":"A demand surge and an acquisition, at once","context":["I walked into a demand surge and an acquisition at the same time: pandemic-era traffic climbing while an acquired platform needed folding in, on a product that wasn't yet built around its users.","I owned the strategy and roadmap, reported to the CEO, and led UX, product, and learning-development teams through the pivot without dropping the customers we already had."],
 "did_h":"Pivot, integrate, and launch","did":["Executed a rapid pivot to user-centered design that met surging demand and drove a 225%+ increase in content sales","Delivered $300K+ in cost savings by developing an adaptive LMS and integrating acquired platforms (including Campfire Collective) into a unified experience","Launched a full-service B2B events-and-campgrounds platform, broadening revenue streams and expanding the total addressable market","Delivered five high-impact product launches by aligning product vision, UX strategy, and executive stakeholder communication","Drove organizational transformation through the demand surge and M&A while maintaining product continuity and customer trust"],
 "imp_h":"Growth under pressure","impact":["225%+ content-sales growth during market disruption","$300K+ in savings and a unified product after an acquisition","New revenue streams and an expanded market through a B2B platform launch"],
 "tags":["Product Strategy","Growth","User-Centered Design","M&A Integration","E-commerce","Design Leadership"]},

{"file":"citi.html","img":"citi","title":"Citi","category":"Citi · Global Consumer Banking","role":"Lead UX Designer · 2014–2016",
 "h1":"A <em>bank-wide design system</em> and a first-of-its-kind wearable app","lead":"At one of the world's largest banks, digital properties lacked a shared system, and the first Apple Watch app was uncharted territory, in a domain where trust and precision are everything.",
 "stats":[("Bank-wide","Design system"),("+72%","VA usage"),("1st","Apple Watch app"),("Apple.com","Featured")],
 "ctx_h":"Consistency and trust, at bank scale","context":["Citi's digital products had drifted (every team solving the same problems a slightly different way) right as the bank stepped into brand-new territory with its first wearable.","In banking, trust and precision aren't nice-to-haves; they're the product. Everything I shipped had to be rigorous enough to bet money on and reusable enough to scale across the bank."],
 "did_h":"Systems and firsts","did":["Built a bank-wide design system and reusable pattern library adopted across Citi's digital properties","Served as design partner for Citi's first Apple Watch app, from concept through prototyping, featured on Apple.com","Redesigned a virtual-assistant experience that lifted usage 72%","Designed co-brand experiences for major partner programs, balancing brand and usability"],
 "imp_h":"Reusable systems, measurable lift","impact":["A design system adopted across a global financial institution","A wearable app that shipped and was featured on Apple.com","A virtual-assistant redesign that lifted usage by 72%"],
 "tags":["Design Systems","Financial Services","Wearable / Mobile","Interaction Design","Enterprise"]},

{"file":"capital-one.html","img":"capital-one","title":"Capital One","category":"Capital One · Consumer Banking","role":"Lead Art Director / Creative Director · 2012–2014",
 "h1":"Brand creative and UX for a <em>consumer auto-lending</em> product","lead":"A top U.S. consumer bank needed brand creative leadership and UX/UI for a new auto-lending digital product, and stronger performance from a mature direct-mail channel.",
 "stats":[("+40%","Direct-mail ROI"),("Auto Navigator","Built"),("Brand","Creative direction")],
 "ctx_h":"Brand, product, and a mature channel","context":["Capital One was standing up a new digital auto-lending product while leaning on a mature direct-mail channel that had plateaued: two very different problems on my desk at once.","I moved between them: brand creative and art direction on one side, hands-on UX/UI for the new product on the other."],
 "did_h":"Creative direction meets product","did":["Led brand creative and art direction across campaigns and channels for a top consumer bank","Drove UX/UI on the internal team that initially developed Capital One Auto Navigator","Drove a 40% increase in direct-mail ROI through brand and creative leadership"],
 "imp_h":"Response and product, together","impact":["A 40% lift in direct-mail ROI on a mature channel","Hands-on UX/UI for a new digital auto-lending product","Brand creative that carried across channels"],
 "tags":["Brand Strategy","Creative Direction","UX/UI","Financial Services","Direct Response"]},

{"file":"tpn.html","img":"tpn","title":"TPN (Omnicom)","category":"TPN (Omnicom) · Commerce & Brand Agency","role":"Director of Creative Technology · 2024–2025",
 "h1":"<em>AI-augmented</em> brand experiences for Fortune 500 retail","lead":"A commerce and brand agency serving Fortune 500 retail needed a forward-looking creative-technology vision: AI-augmented, data-driven brand experiences at enterprise scale.",
 "stats":[("AI-integrated","Commerce"),("F500","Clients"),("White-label","Platform"),("New biz","Caterpillar")],
 "ctx_h":"A creative-technology vision for AI-era commerce","context":["TPN wanted to be known as the agency that could actually deliver AI-integrated commerce for enterprise retail, not just talk about it in a pitch.","My job was to set that creative-technology vision and then make it real: reproducible, white-label brand experiences that held up at Fortune 500 scale."],
 "did_h":"Vision, AI, and repeatable delivery","did":["Set the creative-technology vision for AI-augmented, experiential brand experiences across enterprise clients including AT&T, ExxonMobil, Bank of America, Cricket, and Caterpillar","Won new business with Caterpillar by building a reproducible, white-label solution while deepening continued business with AT&T and Cricket","Conceived and championed AT&T's Immersive Product Experience (a lift-and-learn in-store concept) winning client buy-in with research and a working proof of concept","Built white-label platform architecture enabling rapid client deployment and composable brand experiences","Unified creative, development, and analytics teams under a shared delivery framework"],
 "imp_h":"A leader in AI-integrated commerce","impact":["New enterprise business won with a reproducible white-label solution","AI integrated into creative pipelines from ideation through production","Faster, higher-quality omnichannel execution under one delivery framework"],
 "tags":["Creative Technology","AI in Creative","Brand Experience","Enterprise / F500","Retail"]},

{"file":"phzme.html","img":"phzme","title":"PhzMe","category":"PhzMe · Early-Stage Marketplace Startup","role":"Chief Experience Officer · 2023–2025",
 "h1":"Brand, product, and an <em>investor-ready story</em> for an early-stage startup","lead":"PhzMe is an early-stage Los Angeles startup building a marketplace and community app for physical-media collectibles: VHS, vinyl, DVDs, and retro tech. I partnered directly with the CEO to shape brand, product, and the fundraising narrative.",
 "stats":[("CXO","Founding exec"),("Brand","0→1"),("Marketplace","Experience"),("Investor","Narrative")],
 "ctx_h":"Vision into an experience investors could feel","context":["An early-stage startup needed brand, product experience, and an investor-ready story, built quickly, working directly with the founder.","The challenge was to make the vision tangible across every touchpoint."],
 "did_h":"Define the vision, build the experience","did":["Partnered directly with the CEO to define vision, shape brand, and drive company-wide alignment","Owned brand identity, product experience, and motion, establishing a cohesive aesthetic across every touchpoint","Shaped the marketplace and community experience for buying, selling, and hunting rare and nostalgic physical formats","Led fundraising pitch development and investor storytelling, translating the vision into compelling narratives","Drove experience strategy across the full customer journey, building the brand promise into the product"],
 "imp_h":"A brand and a story that could raise","impact":["A cohesive brand and product experience across every touchpoint","A marketplace and community experience designed around a passionate niche","An investor-ready narrative that translated vision into traction"],
 "tags":["Brand Strategy","Product Experience","0→1","Fundraising Narrative","Marketplace","Advisory"]},

{"file":"cubby.html","img":"cubby","title":"Cubby","category":"Cubby · Caregiver-Curated Video for Autism & IDD","role":"Founder and Builder · 2026–Present · cubbyplaylist.com","live_url":"https://cubbyplaylist.com","appstore_url":"https://apps.apple.com/us/app/cubby-curated-video/id6762105730",
 "h1":"A caregiver-curated video app, <em>designed and built solo</em>",
 "lead":"Cubby is a caregiver-curated video app for teens and adults with autism and intellectual and developmental disabilities. A trusted adult builds a locked-down library of approved videos; the viewer watches only what's chosen: no search, no recommendations, no autoplay. I designed, built, and shipped it solo, end to end, using AI-native tools, live on the App Store.",
 "stats":[("Live","App Store · iOS"),("Solo","0→1, end to end"),("Autism & IDD","Underserved segment"),("AI-native","Built with AI agents")],
 "ctx_h":"An underserved community, a calmer way to watch","context":["I built Cubby for kids first, then the caregivers I interviewed redirected me. Teens and adults with autism and IDD had no calm, locked-down way to watch, and the people who support them were stuck stitching together workarounds.","So I pointed Cubby at them. Caregiver interviews confirmed the need, and the pivot walked me out of the COPPA minefield before I committed the real build."],
 "did_h":"Concept to App Store, owned end to end","did":["Designed, built, and shipped Cubby solo, 0 to 1 (concept through design, engineering, compliance, and launch) as a live iOS App Store release and production web app","Repositioned from a saturated kids-video market to the underserved autism and IDD segment after competitive and legal analysis, removing COPPA exposure and validating with caregiver interviews","Built an accessibility-first, sensory-adaptive design system: per-profile calm, balanced, and engage modes, with the Atkinson Hyperlegible typeface","Designed a three-role dignity model (Admin, Curator, Viewer) so a trusted adult curates and the viewer watches only what's chosen: no search, recommendations, or autoplay","Built on React and TypeScript (Capacitor for iOS, Supabase, Stripe, Anthropic API), using AI coding agents daily"],
 "gallery":{"label":"Selected Work","title":"The hard part, made real","items":[
   {"img":"cubby-the-hard-part","title":"Designer to solo founder-engineer","body":"AI coding agents let me build far past normal design scope. I owned the architecture, the interaction, the UI, and the code, and held the whole thing to a real accessibility and safety bar the entire way.","pills":["Solo 0→1","AI coding agents","Accessibility-first"],"link":"https://cubbyplaylist.com/landing","link_label":"See the Cubby landing page"}
 ]},
 "story":{"label":"The Turn","title":"Where it started, where it is now","note":"The strongest decision on Cubby was a pivot: away from a crowded kids-video market, toward a community that actually needed what I was building.","steps":[
   {"img":"cubby-story-1","eyebrow":"Where it started","title":"A kids-video concept in a crowded market","body":"Cubby began as a parent-controlled kids' viewing app: a Parent Hub, child profiles, and a curated feed of kid-safe videos. The space was saturated, COPPA-heavy, and hard to differentiate."},
   {"img":"cubby-story-2","eyebrow":"Where it is now","title":"A caregiver-curated app for autism and IDD","body":"After competitive and legal analysis and caregiver interviews, I repositioned to an underserved community: teens and adults with autism and IDD. The same curated-video core, rebuilt around a Viewer experience and accessibility controls (contrast, dim, and text size) that this audience actually needs."}
 ]},
 "imp_h":"Proof, not a prototype","impact":["A working, shippable iOS app, live on the App Store at cubbyplaylist.com","A repositioning that turned a crowded-market product into one an underserved community needs","Proof of an AI-fluent design leader who still ships, concept to product"],
 "tags":["AI-native Building","0→1 Product","Accessibility & Inclusive Design","iOS / Capacitor","Founder"]},
]
EXTRA={
"omnitracs.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"omnitracs-building-the-design-org","title":"Building the design org","body":"I joined a team that was scoped to one project at a time. I rebuilt it as a strategic function: product partnership, design systems, and a seat at the table for roadmap decisions. I founded the UX research practice as part of this and made it a discipline of shipping rather than presenting."},
   {"img":"omnitracs-unifying-a-fragmented-platform","title":"Unifying a fragmented platform","body":"Because Omnitracs grew by acquisition, customers were stuck navigating disconnected products with different logins, different language, and different mental models for the same tasks, while usability and technical debt piled up. I audited the legacy platforms, mapped where they overlapped and conflicted, and defined migration paths toward a single, coherent platform. I led the design integration of acquired products, including Blue Dot. I also built logic blocks, a modular, framework-agnostic design system spanning mobile, web, cloud, and IoT, and I architected an ML next-best-action framework that surfaced the right move at the right moment across the operator's day."},
   {"img":"omnitracs-in-the-field","title":"In the field","body":"Trucks are a hard research environment. I went into cabs, distribution yards, and dispatch centers to watch the work, then translated what I saw into design patterns the broader team could ship against. The product changed when the room had pictures of an actual driver leaning over an in-cab screen."},
   {"img":"omnitracs-command","eyebrow":"Operator console","title":"Command","body":"Command was the operator's home base: dispatch, telematics, exceptions, video. I designed the structure that made it possible to live in one product all day instead of switching between five."},
   {"img":"omnitracs-drive","eyebrow":"In-cab driver app","title":"Drive","body":"Drive was the in-cab driver application. I led the redesign to make it a calmer, more legible companion across a 12-hour shift, with workflows for HOS, inspections, messages, and stops."},
   {"img":"omnitracs-mobile-manager","eyebrow":"Mobile dispatch","title":"Mobile Manager","body":"Mobile Manager gave fleet managers a phone-sized version of the dispatcher console. I designed the patterns that let them act on exceptions away from the desk without losing context."},
   {"img":"omnitracs-hours-go","eyebrow":"Compliance","title":"HoursGo","body":"HoursGo brought hours-of-service compliance to the driver's phone in a way that respected federal rules and the realities of a long haul. I led the design with research alongside drivers and operators."},
   {"img":"omnitracs-tax-manager","eyebrow":"Fuel tax","title":"Tax Manager","body":"Tax Manager handles fuel-tax reporting that operators previously paid third parties to compile. I led the design so fleet managers could file in-house without becoming compliance experts."},
   {"img":"omnitracs-exact-fuel","eyebrow":"Fuel routing","title":"Exact Fuel","body":"Exact Fuel turned fuel telematics into a routing tool. I designed the surfaces that showed dispatchers which fuel stops actually reduced cost, factoring in IFTA, network discounts, and route deviation."},
   {"img":"omnitracs-logic","eyebrow":"No-code rules","title":"Logic","body":"Logic let dispatchers build routing rules without code. I set the design direction and my team and I built it together (the block-based editor and the rule library) so a non-technical user could automate dispatch decisions and see the results before publishing them. It's some of the work I'm proudest of, and it took the whole team to get there."},
 ]}},
"snhu.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"snhu-ai-credit","title":"Credit for Prior Learning","body":"An ML registrar tool I directed that cut credit-processing time in half. The registrar team adopted it fast, and it showed how far AI could move a core campus workflow."},
   {"img":"snhu-ai-guideme","title":"Guide Me","body":"An AI pathway system giving new students just-in-time guidance. The proof of concept showed AI and ML could turn a hard onboarding moment into a confident first step."},
   {"img":"snhu-levelup-adaptive","title":"Adaptive Learner Environment","body":"A flexible program pathway that adapts to each learner's interests and goals, presenting complex material in digestible steps so students learn at their own pace."},
   {"img":"snhu-levelup-support","title":"Empowering the Educational Support System","body":"Tools and training that let advisors give personalized support, with a streamlined registrar experience for managing records and registration."},
 ]},
 "vid_h":"See it in motion","vid_lead":"Three cuts from the Level Up pilot: the video that invited learners in, the one that onboarded them after they accepted, and a walkthrough of the platform and its AI-powered tools.",
 "videos":[
   {"id":"1218809924","title":"The pilot invitation","sub":"The video that recruited learners into the Level Up pilot, the pitch that earned the opt-in."},
   {"id":"1218810568","title":"Onboarding into the pilot","sub":"What accepted learners saw next: the welcome and first steps once they were in."},
   {"id":"1005725606","title":"Level Up and the AI learning tools","sub":"A walkthrough of the platform and the AI-powered learner experience."}
 ]},
"kalkomey.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"kalkomey-looking-for-a-campground","eyebrow":"Camper-facing search","title":"Looking for a campground","body":"Camper-facing search and reservations. I designed the patterns for finding sites by amenity, availability, and trip type, then booking and modifying without calling the ranger station."},
   {"img":"kalkomey-see-whats-happening-in-your-local-area","eyebrow":"Events and activities","title":"See what's happening in your local area","body":"Events and activities surfaced next to the campsite. Hikes, talks, festivals, and the things people actually go camping for, on the same screen they used to plan the trip."},
   {"img":"kalkomey-booking-an-experience","eyebrow":"Reservations and events","title":"Booking an experience","body":"Reservations and event booking in one flow. Real-time calendars, capacity rules, and a path through holds, payments, and confirmations that didn't break on edge cases."},
   {"img":"kalkomey-create-a-design-system","eyebrow":"Shared foundation","title":"Create a design system","body":"I led the design system that unified the AMS Camping surfaces. Tokens, components, and patterns that meant we shipped once and rolled to every persona."},
   {"img":"kalkomey-camping-mobile-experience","eyebrow":"On the go","title":"Camping mobile experience","body":"The camper's mobile experience: trip itinerary, navigation, notifications, mobile check-in, and digital permits. Built so it worked on a flaky cellular signal at the trailhead."},
   {"img":"kalkomey-campground-staff-interface","eyebrow":"On-site operations","title":"Campground staff interface","body":"The staff console for day-of operations: arrivals, occupancy, maintenance tickets, and incident logging. Built around the tasks a ranger actually does on shift, not the org chart of the back end."},
 ]}},
"citi.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"citi-01-apple-watch","title":"Apple Watch","body":"I shipped Citi's first Apple Watch app on the platform's launch day. Glance-level account info, send and receive, and the restraint that wrist-sized interactions demand. Apple featured the app on Apple.com when it went live."},
   {"img":"citi-02-standards-and-systems","title":"Standards and systems","body":"I led the bank-wide design system and the standards organization around it. Tokens, components, and patterns shipped from one source. The harder part was the org: governance, contribution workflow, and a way for product teams to ship without inventing a snowflake every time."},
   {"img":"citi-03-co-brand-design","title":"Co-brand design","body":"I led the design on the co-branded card partnerships: American Airlines AAdvantage and Hilton Honors. Two brands, two product experiences, one consistent quality bar. The cards live in physical and digital form, and the design had to land in both."},
 ]}},
"capital-one.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"capital-one-01-auto-navigator1","eyebrow":"Pre-qualified financing","title":"Get qualified before the lot","body":"A pre-qualification flow that gave shoppers their real terms without the dealer pressure cycle. Capital One sat behind the transaction, not in front of it."},
   {"img":"capital-one-01-auto-navigator2","eyebrow":"Dealer-direct shopping","title":"Inventory in your terms","body":"Search dealer inventory by what shoppers actually filtered on: monthly payment, total cost, and term. The interface translated between buyer language and lending language."},
 ]}},
"tpn.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"tpn-01","eyebrow":"Connected retail","title":"An in-store ecosystem","body":"I built an in-store ecosystem: a lift-and-learn experience with new products, interactive displays, and directed marketing on in-store digital screens, plus a takeaway experience on the phone. It all connected into one comprehensive journey that met customers where they wanted to be, instead of feeling sold to."},
   {"img":"tpn-02","eyebrow":"Prototype + white label","title":"Prototyping the white-label experience","body":"We prototyped the complete experience, including a physical interaction: when someone lifted a product, every screen surfaced that item's information and marketing, and we built a way to take that information with you on your phone. It was also a white-label ecosystem, one we could reuse in any physical establishment, for any content or product."},
   {"img":"tpn-cricket","eyebrow":"Shopper marketing","title":"Cricket Wireless","body":"In-store and shopper marketing across dealer locations. Built around the dealer reality, not a marketing-team fantasy of one."},
   {"img":"tpn-cat","eyebrow":"Global brand, local markets","title":"Caterpillar","body":"Heavy-equipment marketing across dealer and direct channels. The brief was global; the execution had to land in markets where the buyer doesn't browse, they specify."},
 ]}},
"phzme.html":{
 "gallery":{"label":"Selected Work","title":"Concepts and explorations","items":[
   {"img":"phzme-01","title":"Brand and product","body":"I owned the brand and the product experience. Identity, motion, the product surfaces that turned the marketplace into a community, and the visual language that reads as serious to investors and warm to collectors."},
   {"img":"phzme-02","title":"How the company runs","body":"I built the Now, Next, Later framework that the company runs on. It sequences product decisions against capital, mile-marker investor moments, and the launch path. It is the operating cadence of the team, not just a roadmap layout."},
 ]}},
}
PILLS={
 "spotio-customer-communication":["AI co-pilot","Onboarding","Customer comms"],
 "spotio-calendar-suggestions":["Just-in-time","Calendar UX","Contextual actions"],
 "spotio-testing-concept":["Usability testing","Rapid iteration","Validation"],
 "spotio-next-best-action":["Next best action","Decision support","AI ranking"],
 "omnitracs-building-the-design-org":["Org building","UX research 0→1","Design ops"],
 "omnitracs-unifying-a-fragmented-platform":["Design system","M&A integration","ML next-best-action"],
 "omnitracs-in-the-field":["Field research","Ride-alongs","Contextual inquiry"],
 "omnitracs-command":["Operator console","Dispatch","Information architecture"],
 "omnitracs-drive":["In-cab app","Driver UX","HOS & inspections"],
 "omnitracs-mobile-manager":["Mobile dispatch","Exceptions","On the go"],
 "omnitracs-hours-go":["Compliance","HOS / ELD","Mobile"],
 "omnitracs-tax-manager":["Fuel tax","Self-serve","Enterprise workflow"],
 "omnitracs-exact-fuel":["Fuel routing","Telematics","Cost optimization"],
 "omnitracs-logic":["No-code rules","Block editor","Automation"],
 "snhu-ai-credit":["ML tool","Registrar workflow","Time saved"],
 "snhu-ai-guideme":["AI guidance","Onboarding","Student pathways"],
 "snhu-levelup-adaptive":["Adaptive learning","Personalization","Self-paced"],
 "snhu-levelup-support":["Advisor tools","Support system","Registrar UX"],
 "kalkomey-looking-for-a-campground":["Search & reserve","Camper-facing","Booking flow"],
 "kalkomey-see-whats-happening-in-your-local-area":["Events","Discovery","Local activities"],
 "kalkomey-booking-an-experience":["Reservations","Payments","Real-time calendars"],
 "kalkomey-create-a-design-system":["Design system","Tokens & components","Shared foundation"],
 "kalkomey-camping-mobile-experience":["Mobile","Offline-ready","Digital permits"],
 "kalkomey-campground-staff-interface":["Ops console","Staff tools","Day-of operations"],
 "citi-01-apple-watch":["Apple Watch","Wearable UX","Launch-day ship"],
 "citi-02-standards-and-systems":["Design system","Governance","Bank-wide standards"],
 "citi-03-co-brand-design":["Co-brand","AAdvantage & Hilton","Physical + digital"],
 "capital-one-01-auto-navigator1":["Auto lending","Pre-qualification","Shopper-first"],
 "capital-one-01-auto-navigator2":["Inventory search","Payment-based filters","Buyer language"],
 "tpn-01":["In-store ecosystem","Lift-and-learn","Omnichannel"],
 "tpn-02":["Prototype","White-label","Physical + mobile"],
 "tpn-cricket":["Shopper marketing","Retail","Dealer network"],
 "tpn-cat":["Global brand","Dealer & direct","Heavy equipment"],
 "phzme-01":["Brand & identity","Product experience","Motion"],
 "phzme-02":["Operating cadence","Now / Next / Later","Roadmap strategy"],
}
for c in CASES:
    if c["file"] in EXTRA:
        c.update(EXTRA[c["file"]])
    g=c.get("gallery")
    if g:
        for it in g.get("items",[]):
            if "pills" not in it:
                it["pills"]=PILLS.get(it["img"],[])
    open(c["file"],"w").write(page(c))
    print("built",c["file"])

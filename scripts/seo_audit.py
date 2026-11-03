import re, json, glob, os, struct
def jpgsize(p):
    try:
        d=open(p,'rb').read()
        if d[:8]==b'\x89PNG\r\n\x1a\n': return struct.unpack('>II',d[16:24])
        i=2
        while i<len(d):
            if d[i]!=0xFF: i+=1; continue
            m=d[i+1]
            if m in (0xC0,0xC1,0xC2): h,w=struct.unpack('>HH',d[i+5:i+9]); return (w,h)
            i+=2+struct.unpack('>H',d[i+2:i+4])[0]
    except Exception as e: return str(e)
pages=sorted(glob.glob('*.html')+glob.glob('build/*.html')+glob.glob('blog/*.html'))
sm=open('sitemap.xml').read()
issues=[]
for p in pages:
    s=open(p,encoding='utf-8',errors='replace').read()
    g=lambda pat: (re.search(pat,s,re.I|re.S) or [None,None])[1]
    title=g(r'<title>(.*?)</title>')
    desc=g(r'<meta\s+name="description"\s+content="([^"]*)"')
    canon=g(r'<link\s+rel="canonical"\s+href="([^"]*)"')
    robots=g(r'<meta\s+name="robots"\s+content="([^"]*)"')
    ogt=g(r'property="og:title"\s+content="([^"]*)"'); ogd=g(r'property="og:description"\s+content="([^"]*)"')
    ogi=g(r'property="og:image"\s+content="([^"]*)"'); ogu=g(r'property="og:url"\s+content="([^"]*)"')
    tw=g(r'name="twitter:card"\s+content="([^"]*)"')
    lang=g(r'<html[^>]*lang="([^"]*)"')
    h1=len(re.findall(r'<h1[\s>]',s))
    lds=re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)
    types=[];bad=0
    for l in lds:
        try:
            j=json.loads(l); items=j.get('@graph',[j]) if isinstance(j,dict) else j
            types+= [i.get('@type') if isinstance(i,dict) else '?' for i in items]
        except Exception: bad+=1
    noalt=len(re.findall(r'<img(?![^>]*\balt=)[^>]*>',s))
    url='https://aneilrazvi.com/'+('' if p=='index.html' else p)
    insm = url in sm
    ogsz = jpgsize(ogi.replace('https://aneilrazvi.com/','')) if ogi else None
    flags=[]
    if not title: flags.append('NO TITLE')
    elif len(title)>65: flags.append(f'title {len(title)}ch')
    if not desc: flags.append('NO DESC')
    elif not (70<=len(desc)<=165): flags.append(f'desc {len(desc)}ch')
    if not canon: flags.append('NO CANON')
    elif canon!=url: flags.append(f'canon={canon}')
    if not ogi: flags.append('NO OG IMG')
    elif isinstance(ogsz,tuple) and ogsz[0]<1200: flags.append(f'og img {ogsz}')
    if ogu and ogu!=url: flags.append(f'og:url={ogu}')
    if not ogt: flags.append('no og:title')
    if not tw: flags.append('no twitter:card')
    if not lang: flags.append('no lang')
    if h1!=1: flags.append(f'h1={h1}')
    if not lds: flags.append('NO JSON-LD')
    if bad: flags.append(f'{bad} BAD JSON-LD')
    if noalt: flags.append(f'{noalt} img no alt')
    noindex = robots and 'noindex' in robots
    if not insm and not noindex: flags.append('not in sitemap')
    if insm and noindex: flags.append('NOINDEX but in sitemap')
    print(f"{p:52} {'noindex ' if noindex else ''}{','.join(filter(None,map(str,types)))[:70]} | {'; '.join(flags)}")
# broken internal links
targets=set(pages)|set(glob.glob('*.pdf'))|set(glob.glob('assets/**/*',recursive=True))
broken={}
for p in pages:
    s=open(p,encoding='utf-8',errors='replace').read()
    for h in re.findall(r'href="([^"#?]+)',s):
        if h.startswith(('http','mailto','tel','javascript','data:')): continue
        base=os.path.dirname(p)
        t=os.path.normpath(h.lstrip('/') if h.startswith('/') else os.path.join(base,h))
        if t in ('.',''): continue
        if t.endswith('/'): continue
        if not os.path.exists(t): broken.setdefault(t,set()).add(p)
print('BROKEN LINKS:', {k:sorted(v)[:3] for k,v in broken.items()})

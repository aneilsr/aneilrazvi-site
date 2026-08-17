import sys, re, base64, os
inp, out = sys.argv[1], sys.argv[2]
base=os.path.dirname(os.path.abspath(inp)) or "."
html=open(inp).read()
def inline_css(m):
    p=os.path.join(base,m.group(1))
    return "<style>"+open(p).read()+"</style>" if os.path.exists(p) else m.group(0)
html=re.sub(r'<link rel="stylesheet" href="([^"]+\.css)">', inline_css, html)
MIME={"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","svg":"image/svg+xml","webp":"image/webp","gif":"image/gif"}
def to_data(path):
    p=os.path.join(base,path)
    if not os.path.exists(p): return None
    e=path.lower().rsplit(".",1)[-1]
    return f"data:{MIME.get(e,'application/octet-stream')};base64,"+base64.b64encode(open(p,'rb').read()).decode()
def repl_url(m):
    d=to_data(m.group(2)); return f"url({m.group(1)}{d}{m.group(1)})" if d else m.group(0)
html=re.sub(r"url\((['\"]?)(assets/[^'\")]+)\1\)", repl_url, html)
def repl_src(m):
    d=to_data(m.group(1)); return f'src="{d}"' if d else m.group(0)
html=re.sub(r'src="(assets/[^"]+)"', repl_src, html)
open(out,"w").write(html); print("wrote",out,round(len(html)/1024),"KB")

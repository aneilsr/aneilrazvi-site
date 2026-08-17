# Publishing aneilrazvi.com

Static HTML — no build step. Two ways to ship it.

## A. Quick preview (test URL, live domain untouched)
From a normal Terminal:
    cd "/Users/aneilrazvi/Claude projects/aneilrazvi-site-v2"
    npx vercel
Log in, scope = cubby1, "Set up and deploy" = Y, link to existing = N,
name = aneilrazvi-portfolio. It prints a *.vercel.app preview URL.

Promote that same deploy to production later with:
    npx vercel --prod

## B. Auto-deploy on every edit (recommended endgame)
1. git init && git add -A && git commit -m "Portfolio site"
2. Create an empty GitHub repo (no README), then:
       git remote add origin <repo-url>
       git branch -M main
       git push -u origin main
3. vercel.com -> Add New -> Project -> import the repo -> Deploy.
   Framework preset: Other. Every `git push` now redeploys automatically.

## Point aneilrazvi.com here (after you've tested)
The domain is currently on the OLD `aneilrazvi-site` Vercel project.
In the Vercel dashboard: open the OLD project -> Settings -> Domains ->
remove aneilrazvi.com, then add it to the NEW project. DNS stays the same;
propagation is usually minutes. Reversible — move it back if needed.

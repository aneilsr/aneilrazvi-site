// Speakable short links, counted.  Repo path: api/go.js
// Live: /workshop /panel /podcast /check /map, rewritten here by vercel.json
//
// These used to be plain redirects in vercel.json. A redirect renders no HTML,
// so assets/analytics.js never loads and PostHog never fires: every click was
// invisible. This logs the hit, then sends the person on. Logging never blocks
// the redirect, and a dead database costs a few milliseconds, not the link.

function readUA(ua) {
  const u = String(ua || "");
  const bot = /bot|crawler|spider|preview|slurp|facebookexternalhit|whatsapp|slackbot|discordbot|telegram|linkedinbot|bingpreview|proofpoint|barracuda|mimecast|safelinks|urldefense|headless/i.test(u);

  // An in-app browser is a REAL PERSON in a cramped webview, not a bot.
  // Order matters. Instagram and Threads also carry the Facebook tokens.
  let inApp = null;
  if (/\[LinkedInApp\]/i.test(u))        inApp = "LinkedIn";
  else if (/Instagram/i.test(u))          inApp = "Instagram";
  else if (/Threads/i.test(u))            inApp = "Threads";
  else if (/FBAN|FBAV|FB_IAB/i.test(u))   inApp = "Facebook";
  else if (/Twitter/i.test(u))            inApp = "X";
  else if (/Slack_SSB/i.test(u))          inApp = "Slack";
  else if (/Teams\//i.test(u))            inApp = "Teams";

  let os = "unknown";
  if (/iPhone|iPod/i.test(u)) os = "iPhone";
  else if (/iPad/i.test(u)) os = "iPad";
  else if (/Android/i.test(u)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(u)) os = "Mac";
  else if (/Windows NT/i.test(u)) os = "Windows";
  else if (/CrOS/i.test(u)) os = "ChromeOS";
  else if (/Linux/i.test(u)) os = "Linux";

  let browser = "unknown";
  if (inApp) browser = inApp + " in-app";
  else if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Chrome\//i.test(u)) browser = "Chrome";
  else if (/Safari\//i.test(u)) browser = "Safari";

  const device = /iPhone|iPod|Android.*Mobile/i.test(u) ? "Phone"
               : /iPad|Tablet|Android/i.test(u) ? "Tablet" : "Desktop";
  return { os, browser, device, bot, inApp };
}

// Destinations live here, not in vercel.json, so a link that is already printed
// on a tear sheet or said out loud in a room can be repointed without a rebuild.
const DESTS = {
  workshop: { to: "https://luma.com/jmpah2p8", utm: { source: "aneilrazvi", medium: "poster",   campaign: "where-design-starts-paying" } },
  panel:    { to: "/maturity.html",             utm: { source: "utdallas",   medium: "event",    campaign: "minicon-oct10" } },
  podcast:  { to: "/maturity.html",             utm: { source: "roads",      medium: "podcast",  campaign: "terri" } },
  check:    { to: "/maturity.html",             utm: { source: "spoken",     medium: "inperson", campaign: "room" } },
  map:      { to: "/maturity.html",             utm: { source: "tearsheet",  medium: "handout",  campaign: "where-design-starts-paying" } }
};

const clip = (v, n) => (typeof v === "string" && v.length ? v.slice(0, n) : null);

export default async function handler(req, res) {
  const slug = String((req.query && req.query.s) || "").toLowerCase();
  const d = DESTS[slug];

  // An unknown slug is a typo or a probe. Send it somewhere real rather than 404.
  if (!d) return res.redirect(302, "/");

  const q = new URLSearchParams({
    utm_source: d.utm.source, utm_medium: d.utm.medium, utm_campaign: d.utm.campaign
  });
  // Anything the caller appended survives, so a one-off tag still works.
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k !== "s" && typeof v === "string" && !q.has(k)) q.set(k, v);
  }
  const target = d.to + (d.to.includes("?") ? "&" : "?") + q.toString();

  const SB = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (SB && KEY) {
    const ua = readUA(req.headers["user-agent"]);
    const row = {
      slug,
      destination: target.slice(0, 500),
      referrer:   clip(req.headers["referer"] || req.headers["referrer"], 500),
      user_agent: clip(req.headers["user-agent"], 400),
      device: ua.device, os: ua.os, browser: ua.browser,
      in_app: ua.inApp, is_bot: ua.bot,
      country: clip(req.headers["x-vercel-ip-country"], 8),
      city: clip(decodeURIComponent(req.headers["x-vercel-ip-city"] || ""), 80)
    };
    try {
      await fetch(`${SB}/rest/v1/link_clicks`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`,
                   "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row)
      });
    } catch (e) { console.error("link_clicks insert failed", e); }
  }

  res.setHeader("Cache-Control", "no-store");
  return res.redirect(302, target);
}

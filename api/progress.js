// Assessment funnel: how far a visitor got before they quit.
// POST /api/progress  -> { session_id, event, question, answered, questions_total, axis, ... }
//
// The completed assessment already posts to /api/lead. This endpoint is the other half:
// it records the people who never finish, so drop-off has a number instead of a guess.
// It writes one row per session and only ever moves that row forward, so events that
// arrive late or out of order cannot walk a visitor backwards.
//
// Nothing here identifies a person. No email, no IP. Coarse device and city only,
// the same shape /api/report already stores.

function readUA(ua) {
  const u = String(ua || "");
  const bot = /bot|crawler|spider|preview|slurp|facebookexternalhit|whatsapp|slackbot|discordbot|telegram|linkedinbot|bingpreview|proofpoint|barracuda|mimecast|safelinks|urldefense|headless/i.test(u);
  let os = "unknown";
  if (/iPhone|iPod/i.test(u)) os = "iPhone";
  else if (/iPad/i.test(u)) os = "iPad";
  else if (/Android/i.test(u)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(u)) os = "Mac";
  else if (/Windows NT/i.test(u)) os = "Windows";
  else if (/CrOS/i.test(u)) os = "ChromeOS";
  else if (/Linux/i.test(u)) os = "Linux";
  let browser = "unknown";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Chrome\//i.test(u)) browser = "Chrome";
  else if (/Safari\//i.test(u)) browser = "Safari";
  const device = /iPhone|iPod|Android.*Mobile/i.test(u) ? "Phone"
               : /iPad|Tablet|Android/i.test(u) ? "Tablet" : "Desktop";
  return { os, browser, device, bot };
}

const ALLOWED_EVENTS = ["land", "start", "q", "complete", "email"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const SB  = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB || !KEY) return res.status(500).json({ error: "not configured" });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const clip = (v, n) => (typeof v === "string" && v.length ? v.slice(0, n) : null);
  const num  = (v, lo, hi) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
  };

  const s  = clip(b.session_id, 120);
  const ev = String(b.event || "");
  if (!s) return res.status(400).json({ error: "bad session" });
  if (!ALLOWED_EVENTS.includes(ev)) return res.status(400).json({ error: "bad event" });

  const ua = readUA(req.headers["user-agent"]);

  const args = {
    p_session_id:      s,
    p_event:           ev,
    p_question:        num(b.question, 0, 200),
    p_answered:        num(b.answered, 0, 200),
    p_questions_total: num(b.questions_total, 0, 200),
    p_axis:            clip(b.axis, 40),
    p_utm_source:      clip(b.utm_source, 100),
    p_utm_medium:      clip(b.utm_medium, 100),
    p_utm_campaign:    clip(b.utm_campaign, 150),
    p_utm_content:     clip(b.utm_content, 150),
    p_referrer:        clip(b.referrer, 500),
    p_landing_path:    clip(b.landing_path, 300),
    p_user_agent:      clip(req.headers["user-agent"], 400),
    p_device:          ua.device,
    p_os:              ua.os,
    p_browser:         ua.browser,
    p_is_bot:          ua.bot,
    p_screen_w:        num(b.screen_w, 0, 20000),
    p_country:         clip(req.headers["x-vercel-ip-country"], 8),
    p_city:            clip(decodeURIComponent(req.headers["x-vercel-ip-city"] || ""), 80)
  };

  try {
    const r = await fetch(`${SB}/rest/v1/rpc/record_assessment_progress`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(args)
    });
    if (!r.ok) console.error("progress rpc failed", r.status, await r.text());
  } catch (e) {
    console.error("progress rpc threw", e);
  }

  // Always 204. This is fire and forget from a sendBeacon, and a visitor must never
  // see a slow or failing analytics call.
  return res.status(204).end();
}

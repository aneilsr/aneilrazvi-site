// Personal maturity report: read one lead by session id, and log what they do with it.
// GET  /api/report?s=<session_id>   -> the scores the page needs to render
// POST /api/report                  -> { session_id, event, ... } logs one interaction
//
// The session id is a capability URL, the same model as an unsubscribe link. It is random,
// it is never listed anywhere, and this endpoint deliberately does NOT return the email
// address, so a leaked link exposes scores and nothing that identifies a person by contact.

const ALLOWED_EVENTS = ["view", "print", "copy_link", "book_click", "revisit"];

export default async function handler(req, res) {
  const SB  = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB || !KEY) return res.status(500).json({ error: "not configured" });
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

  const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : null);

  // ---------- read ----------
  if (req.method === "GET") {
    const s = (req.query && req.query.s) || "";
    if (!s || s.length > 120) return res.status(400).json({ error: "bad session" });

    const cols = [
      "session_id","name","company","role","capability_level","capability_label",
      "ai_level","ai_label","answers","capability_breakdown","ai_breakdown",
      "recommended_package","completed_at","created_at"
    ].join(",");

    const r = await fetch(
      `${SB}/rest/v1/leads?session_id=eq.${encodeURIComponent(s)}&select=${cols}&limit=1`,
      { headers: H }
    );
    if (!r.ok) return res.status(502).json({ error: "upstream" });
    const rows = await r.json();
    if (!rows.length) return res.status(404).json({ error: "not found" });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(rows[0]);
  }

  // ---------- log ----------
  if (req.method === "POST") {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const s = clip(b.session_id, 120);
    const ev = String(b.event || "");
    if (!s) return res.status(400).json({ error: "bad session" });
    if (!ALLOWED_EVENTS.includes(ev)) return res.status(400).json({ error: "bad event" });

    // resolve lead_id so the view can join even if a session id is later recycled
    let lead_id = null;
    try {
      const lr = await fetch(
        `${SB}/rest/v1/leads?session_id=eq.${encodeURIComponent(s)}&select=id&limit=1`,
        { headers: H }
      );
      if (lr.ok) { const j = await lr.json(); if (j.length) lead_id = j[0].id; }
    } catch (_) {}

    const row = {
      session_id: s,
      lead_id,
      event: ev,
      referrer:     clip(b.referrer, 500),
      utm_source:   clip(b.utm_source, 100),
      utm_medium:   clip(b.utm_medium, 100),
      utm_campaign: clip(b.utm_campaign, 150),
      user_agent:   clip(req.headers["user-agent"], 400),
      screen_w:     Number.isFinite(+b.screen_w) ? Math.round(+b.screen_w) : null
    };

    const w = await fetch(`${SB}/rest/v1/report_events`, {
      method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(row)
    });
    if (!w.ok) console.error("report_events insert failed", w.status, await w.text());
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}

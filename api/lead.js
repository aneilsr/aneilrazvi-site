// Vercel serverless function for aneilrazvi-site.  Path in the repo: api/lead.js
// Live URL once pushed: https://aneilrazvi.com/api/lead
//
// Called twice per visitor:
//   1. the moment they finish the questions, anonymously, with session_id
//   2. again if they hand over an email, matched on the same session_id
// The second call updates the first row rather than creating a duplicate.

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).json({error:"Method not allowed"}); }

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (!b.session_id) return res.status(400).json({ error: "session_id required" });

  const SB = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const H = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };

  const row = {
    session_id: b.session_id,
    source: b.source || "maturity-assessment",
    capability_level: b.capability_level ?? null,
    capability_label: b.capability_label || null,
    ai_level: b.ai_level ?? null,
    ai_label: b.ai_label || null,
    quadrant: b.quadrant || null,
    team_size: b.team_size || null,
    company_stage: b.company_stage || null,
    capability_breakdown: b.capability_breakdown || null,
    ai_breakdown: b.ai_breakdown || null,
    answers: b.answers || null,
    recommended_package: b.recommended_package || null,
    completed_at: new Date().toISOString(),
    gated: !!b.gated
  };
  if (b.email)   row.email = b.email;
  if (b.name)    row.name = b.name;
  if (b.company) row.company = b.company;
  if (b.role)    row.role = b.role;
  if (b.blocker) row.notes = "Stated blocker: " + b.blocker;
  if (b.gated)   row.status = "New";

  // Upsert on session_id so the anonymous row gets enriched, not duplicated.
  try {
    const r = await fetch(`${SB}/rest/v1/leads?on_conflict=session_id`, {
      method: "POST",
      headers: { ...H, "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row)
    });
    if (!r.ok) console.error("supabase upsert failed", r.status, await r.text());
  } catch (e) { console.error("supabase upsert threw", e); }

  // Only email on the gated call, and never let a mail failure block the visitor.
  if (b.gated && b.email && process.env.RESEND_API_KEY) {
    const t = process.env.LEAD_NOTIFY_TO || "aneilsyed@gmail.com";
    const from = process.env.LEAD_FROM || "Aneil Razvi <hi@aneilrazvi.com>";
    const dims = (o) => o ? Object.keys(o).map(k => `${k}: ${o[k]}/5`).join(" &middot; ") : "";

    const toVisitor = `
      <div style="font-family:Georgia,serif;max-width:560px">
        <h2 style="font-weight:400;font-size:26px;color:#1E3A5F;margin:0 0 6px">${b.capability_label} capability, ${b.ai_label} on AI</h2>
        <p style="font-family:Inter,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#6B7280">
          Thanks for taking this. Your full read is below. If you want the tear sheet for the engagement that fits you, just reply and I will send it.
        </p>
        <table style="font-family:Inter,Helvetica,sans-serif;font-size:14px;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 12px 6px 0;color:#6B7280">Design capability</td><td style="padding:6px 0"><b>${b.capability_label}</b>, level ${b.capability_level} of 6</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6B7280">AI maturity</td><td style="padding:6px 0"><b>${b.ai_label}</b>, level ${b.ai_level} of 6</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6B7280">Best fit</td><td style="padding:6px 0"><b>${b.recommended_package}</b></td></tr>
        </table>
        <p style="font-family:Inter,Helvetica,sans-serif;font-size:14px;color:#6B7280">
          Capability dimensions: ${dims(b.capability_breakdown)}<br>
          AI dimensions: ${dims(b.ai_breakdown)}
        </p>
        <p style="font-family:Inter,Helvetica,sans-serif;font-size:15px;line-height:1.6">
          If it is useful, book thirty minutes and I will walk you through it:
          <a href="https://calendar.app.google/wDU2w51rzZCdDizh9" style="color:#0097A7">calendar.app.google</a>.
          Free either way, and I will tell you honestly if the answer is that you do not need me yet.
        </p>
        <p style="font-family:Inter,Helvetica,sans-serif;font-size:13px;color:#9AA5AD">
          Aneil Razvi &middot; aneilrazvi.com &middot; you are not on a list, this is the only email you get.
        </p>
      </div>`;

    const toAneil = `
      <div style="font-family:Inter,Helvetica,sans-serif;font-size:15px;max-width:560px">
        <h2 style="font-family:Georgia,serif;font-weight:400">${b.name || "Someone"} at ${b.company || "an unnamed company"}</h2>
        <p><b>Email:</b> ${b.email}<br><b>Role:</b> ${b.role || "not given"}<br>
        <b>Levels:</b> ${b.capability_label} / ${b.ai_label}<br>
        <b>Designers:</b> ${b.team_size || "not given"} &middot; <b>Stage:</b> ${b.company_stage || "not given"}<br>
        <b>Stated blocker:</b> ${b.blocker || "not given"}<br>
        <b>Best fit:</b> ${b.recommended_package}</p>
        <p style="color:#6B7280">Capability: ${dims(b.capability_breakdown)}</p>
        <p style="color:#6B7280">AI: ${dims(b.ai_breakdown)}</p>
        <p style="color:#6B7280">Pull the matching tear sheet before you reply.</p>
      </div>`;

    const send = (to, subject, html) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html })
    }).catch(e => console.error("resend failed", e));

    try {
      await Promise.all([
        send(b.email, `Your design maturity read: ${b.capability_label} / ${b.ai_label}`, toVisitor),
        send(t, `New lead: ${b.company || b.email} (${b.quadrant})`, toAneil)
      ]);
      await fetch(`${SB}/rest/v1/leads?session_id=eq.${encodeURIComponent(b.session_id)}`, {
        method: "PATCH", headers: { ...H, "Prefer": "return=minimal" },
        body: JSON.stringify({ report_sent_at: new Date().toISOString() })
      });
    } catch (e) { console.error("notify block threw", e); }
  }

  return res.status(200).json({ ok: true });
}

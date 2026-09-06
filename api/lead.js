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
    const BOOKING = "https://cal.com/aneil-razvi/maturity-read";
    const dims = (o) => o ? Object.keys(o).map(k => `${k}: ${o[k]}/5`).join(" &middot; ") : "";

    const bar = (n) => {
      const pct = Math.round((Number(n) || 0) / 5 * 100);
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:120px;border-collapse:collapse"><tr>
        <td style="height:6px;background:#E2E8EC;border-radius:3px;padding:0">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:${pct}%;border-collapse:collapse"><tr>
            <td style="height:6px;background:#00BCD4;border-radius:3px;font-size:0;line-height:0">&nbsp;</td></tr></table>
        </td></tr></table>`;
    };
    const dimRows = (o, accent) => !o ? "" : Object.keys(o).map(k => `
      <tr>
        <td style="padding:5px 14px 5px 0;font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;white-space:nowrap">${k}</td>
        <td style="padding:5px 10px 5px 0;width:120px">${bar(o[k]).replace("#00BCD4", accent)}</td>
        <td style="padding:5px 0;font:600 13px/1.4 Helvetica,Arial,sans-serif;color:#1A1A2E;white-space:nowrap">${o[k]}<span style="color:#9AA5AD;font-weight:400">/5</span></td>
      </tr>`).join("");

    // Population matrix, drawn as a table because Gmail strips inline SVG.
    // Column tints are the page's teal at (share/49)*0.20 opacity, pre-flattened onto white.
    const matrixTable = () => {
      const capN = ["Absent","Limited","Emergent","Structured","Integrated","User-Driven"];
      const aiN  = ["Symbiotic","Leading","Embedded","Developing","Reactive","Limited"];
      const share = [1, 17, 49, 28, 4, 0.04];
      const tint  = ["#FEFFFF","#EDFAFC","#CCF2F6","#E2F7FA","#FBFEFE","#FFFFFF"];
      const col = (Number(b.capability_level) || 1) - 1;          // 0..5, left to right
      const rowFromTop = 6 - (Number(b.ai_level) || 1);            // aiN is top-down
      let out = '<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">';
      for (let r = 0; r < 6; r++) {
        out += '<tr><td style="padding:0 8px 0 0;text-align:right;white-space:nowrap;font:400 11px/1 Helvetica,Arial,sans-serif;color:#9AA5AD">' + aiN[r] + '</td>';
        for (let c = 0; c < 6; c++) {
          const hit = (c === col && r === rowFromTop);
          out += '<td style="border:1px solid #E2E8EC;background:' + (hit ? "#FFF1E6" : tint[c]) +
                 ';height:26px;width:15%;text-align:center;font-size:0;line-height:0' +
                 (hit ? ';border:2px solid #F97316' : '') + '">' +
                 (hit ? '<span style="display:inline-block;width:10px;height:10px;background:#F97316;border-radius:50%;font-size:0;line-height:0">&nbsp;</span>' : '&nbsp;') +
                 '</td>';
        }
        out += '</tr>';
      }
      out += '<tr><td></td>';
      for (let c = 0; c < 6; c++) {
        out += '<td style="padding:6px 2px 0;text-align:center;font:400 10px/1.3 Helvetica,Arial,sans-serif;color:#9AA5AD">' +
               capN[c] + '<br><span style="font-weight:700;color:#0097A7">' + share[c] + '%</span></td>';
      }
      out += '</tr></table>';
      return out;
    };

    const toVisitor = `
<div style="background:#F4F6F8;padding:28px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 34px 8px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">Your read</div>
    <h1 style="margin:12px 0 6px;font:400 27px/1.2 Georgia,'Times New Roman',serif;color:#1E3A5F">${b.capability_label} capability, ${b.ai_label} on AI</h1>
    <p style="margin:10px 0 0;font:400 15px/1.65 Helvetica,Arial,sans-serif;color:#6B7280">
      Thanks for taking this. Your full read is below, and the scores are exactly what you saw on the page.
    </p>
  </td></tr>

  <tr><td style="padding:20px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0 8px">
      <tr><td style="background:#E4F8FB;border-left:4px solid #00BCD4;border-radius:8px;padding:14px 16px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0097A7">Design capability</div>
        <div style="font:400 22px/1.15 Georgia,serif;color:#1E3A5F;margin-top:5px">${b.capability_label}</div>
        <div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;margin-top:3px">Level ${b.capability_level} of 6</div>
      </td></tr>
      <tr><td style="background:#FFF1E6;border-left:4px solid #F97316;border-radius:8px;padding:14px 16px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C2410C">AI maturity</div>
        <div style="font:400 22px/1.15 Georgia,serif;color:#1E3A5F;margin-top:5px">${b.ai_label}</div>
        <div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;margin-top:3px">Level ${b.ai_level} of 6</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:10px">Where you sit</div>
    ${matrixTable()}
    <p style="margin:12px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">
      Design capability runs left to right with the share of organizations in each column. AI maturity runs bottom to top. The orange marker is you.
    </p>
  </td></tr>

  <tr><td style="padding:22px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:8px">Design capability, by dimension</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.capability_breakdown, "#00BCD4")}</table>
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding:18px 0 8px">AI maturity, by dimension</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.ai_breakdown, "#F97316")}</table>
    <p style="margin:14px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">The low bars are where the work is.</p>
  </td></tr>

  <tr><td style="padding:24px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0F1923;border-radius:12px;border-collapse:collapse">
      <tr><td style="padding:22px 24px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#00BCD4">Best fit for where you are</div>
        <div style="font:400 23px/1.2 Georgia,serif;color:#FFFFFF;margin:8px 0 10px">${b.recommended_package}</div>
        <p style="margin:0 0 16px;font:400 14px/1.6 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.7)">
          Ranked against your answers, not a generic order. Reply and I will send the tear sheet for this engagement, written for your maturity band rather than in general.
        </p>
        <a href="${BOOKING}" style="display:inline-block;background:#00BCD4;color:#0F1923;font:700 14px/1 Helvetica,Arial,sans-serif;padding:13px 24px;border-radius:99px;text-decoration:none">Book thirty minutes</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 34px 30px">
    <p style="margin:0 0 14px;font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#6B7280">
      Free either way, and I will tell you honestly if the answer is that you do not need me yet.
    </p>
    <div style="border-top:1px solid #E2E8EC;padding-top:14px">
      <div style="font:400 15px/1.3 Georgia,serif;color:#1E3A5F">Aneil Razvi</div>
      <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD;margin-top:3px">
        Fractional design and AI experience leadership ·
        <a href="https://aneilrazvi.com" style="color:#0097A7;text-decoration:none">aneilrazvi.com</a>
      </div>
      <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD;margin-top:9px">
        I do not run a mailing list. If you want me to follow up, say so and I will.
      </div>
    </div>
  </td></tr>
</table>
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

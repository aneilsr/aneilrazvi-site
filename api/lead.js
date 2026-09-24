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
    utm_source: b.utm_source || null,
    utm_medium: b.utm_medium || null,
    utm_campaign: b.utm_campaign || null,
    utm_content: b.utm_content || null,
    referrer: b.referrer || null,
    landing_path: b.landing_path || null,
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
    occupation_code: b.occupation_code || null,
    occupation_title: b.occupation_title || null,
    automation_share: b.automation_share ?? null,
    coverage_tier: b.coverage_tier ?? null,
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
    const t = process.env.LEAD_NOTIFY_TO || "hi@aneilrazvi.com";
    const from = process.env.LEAD_FROM || "Aneil Razvi <hi@aneilrazvi.com>";
    const BOOKING = "https://cal.com/aneil-razvi/maturity-read";
    const REPORT_URL = `https://aneilrazvi.com/report.html?s=${encodeURIComponent(b.session_id || "")}`;
    const dims = (o) => o ? Object.keys(o).map(k => `${k}: ${o[k]}/5`).join(" &middot; ") : "";

    const bar = (n, w) => {
      const pct = Math.round((Number(n) || 0) / 5 * 100);
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:${w||120}px;border-collapse:collapse"><tr>
        <td style="height:6px;background:#E2E8EC;border-radius:3px;padding:0">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:${pct}%;border-collapse:collapse"><tr>
            <td style="height:6px;background:#00BCD4;border-radius:3px;font-size:0;line-height:0">&nbsp;</td></tr></table>
        </td></tr></table>`;
    };
    const dimRows = (o, accent) => !o ? "" : Object.keys(o).map(k => `
      <tr>
        <td style="padding:4px 8px 4px 0;font:400 12px/1.35 Helvetica,Arial,sans-serif;color:#6B7280;white-space:nowrap">${k}</td>
        <td style="padding:4px 8px 4px 0;width:86px">${bar(o[k], 86).replace("#00BCD4", accent)}</td>
        <td style="padding:4px 0;font:600 12px/1.35 Helvetica,Arial,sans-serif;color:#1A1A2E;white-space:nowrap">${o[k]}<span style="color:#9AA5AD;font-weight:400">/5</span></td>
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
                 ';height:34px;width:15%;text-align:center;font-size:0;line-height:0' +
                 (hit ? ';border:2px solid #F97316' : '') + '">' +
                 (hit ? '<span style="display:inline-block;width:15px;height:15px;background:#F97316;border-radius:50%;font-size:0;line-height:0">&nbsp;</span>' : '&nbsp;') +
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

    const _cl = Number(b.capability_level) || 1, _al = Number(b.ai_level) || 1;
    const _gap = _cl - _al;
    const _read = _gap >= 2
      ? "Your design practice is meaningfully ahead of your AI adoption. That is the safer imbalance, but a team with your process discipline would compound AI faster than most, and is not."
      : _gap <= -2
      ? "Your AI adoption is running ahead of your design practice. That is the more dangerous imbalance, because AI accelerates whatever process you already have."
      : "Your two axes are roughly in step, which is less common than it sounds. The work now is moving both together rather than letting one sprint ahead.";

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
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#1E3A5F;border-radius:12px;border-collapse:collapse">
      <tr>
        <td valign="middle" style="padding:16px 8px 16px 22px;font:400 34px/1 Georgia,serif;color:#FFFFFF;white-space:nowrap">${_cl} &times; ${_al}</td>
        <td valign="middle" style="padding:16px 22px 16px 14px;font:400 14px/1.5 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.82)">
          <b style="color:#FFFFFF">Your square.</b> Capability ${_cl}, ${b.capability_label}. AI ${_al}, ${b.ai_label}. One of thirty-six.
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <tr>
        <td width="49%" valign="top" style="background:#E4F8FB;border-left:4px solid #00BCD4;border-radius:8px;padding:14px 16px">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0097A7">Design capability</div>
          <div style="font:400 22px/1.15 Georgia,serif;color:#1E3A5F;margin-top:5px">${b.capability_label}</div>
          <div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;margin-top:3px">Level ${b.capability_level} of 6</div>
        </td>
        <td width="2%" style="font-size:0;line-height:0">&nbsp;</td>
        <td width="49%" valign="top" style="background:#FFF1E6;border-left:4px solid #F97316;border-radius:8px;padding:14px 16px">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C2410C">AI maturity</div>
          <div style="font:400 22px/1.15 Georgia,serif;color:#1E3A5F;margin-top:5px">${b.ai_label}</div>
          <div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;margin-top:3px">Level ${b.ai_level} of 6</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:10px">Your square, on the thirty-six</div>
    ${matrixTable()}
    <p style="margin:12px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">
      Six levels of design capability run left to right, with the share of organizations in each column. Six levels of AI adoption run bottom to top. Thirty-six squares, and the orange marker is yours.
    </p>
    <p style="margin:12px 0 0;font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#3B4651">${_read}</p>
  </td></tr>

  <tr><td style="padding:22px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <tr>
        <td width="49%" valign="top">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#0097A7;padding-bottom:9px">Design capability</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.capability_breakdown, "#00BCD4")}</table>
        </td>
        <td width="2%" style="font-size:0;line-height:0">&nbsp;</td>
        <td width="49%" valign="top">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#C2410C;padding-bottom:9px">AI maturity</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.ai_breakdown, "#F97316")}</table>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">The low bars are where the work is.</p>
  </td></tr>

  <tr><td style="padding:24px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0F1923;border-radius:12px;border-collapse:collapse">
      <tr><td style="padding:22px 24px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#00BCD4">Best fit for where you are</div>
        <div style="font:400 23px/1.2 Georgia,serif;color:#FFFFFF;margin:8px 0 10px">${b.recommended_package}</div>
        <p style="margin:0 0 16px;font:400 14px/1.6 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.7)">
          Ranked against your answers, not a generic order. If that looks close to right, I would like to work with you on it. Twenty minutes, no pitch, and I will tell you honestly if the answer is that you do not need me yet.
        </p>
        <a href="${BOOKING}" style="display:inline-block;background:#00BCD4;color:#0F1923;font:700 14px/1 Helvetica,Arial,sans-serif;padding:13px 24px;border-radius:99px;text-decoration:none">Book a quick intro call</a>
        <a href="${REPORT_URL}" style="display:inline-block;margin-left:10px;color:#00BCD4;font:600 14px/1 Helvetica,Arial,sans-serif;padding:13px 4px;text-decoration:none;border-bottom:1px solid rgba(0,188,212,.45)">Or open your full read</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 34px 0">
    <p style="margin:0;font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#6B7280">
      Not ready for a call? Reply to this email with what you are building and I will send the tear sheet for your band, written for where you actually sit rather than in general. No list, no sequence.
    </p>
  </td></tr>

  <tr><td style="padding:22px 34px 30px">
    <p style="margin:0 0 14px;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">
      Your full read, with both charts and the engagement detail, lives at
      <a href="${REPORT_URL}" style="color:#0097A7;text-decoration:none">this link</a>. It is yours to keep and it prints to a PDF.
    </p>
    <div style="border-top:1px solid #E2E8EC;padding-top:14px">
      <div style="font:400 15px/1.3 Georgia,serif;color:#1E3A5F">Aneil Razvi</div>
      <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD;margin-top:3px">
        Fractional design and AI experience leadership ·
        <a href="https://aneilrazvi.com" style="color:#0097A7;text-decoration:none">aneilrazvi.com</a>
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

    const isReadiness = (b.source === "readiness");
    const occ   = b.occupation_title || "your occupation";
    const shareN = (b.automation_share === null || b.automation_share === undefined)
      ? null : Number(b.automation_share);
    const tierW = b.coverage_tier === 2 ? "full" : (b.coverage_tier === 1 ? "partial" : "thin");
    const tasks = Array.isArray(b.top_tasks) ? b.top_tasks.slice(0, 6) : [];

    const shareLine = shareN === null
      ? `The Anthropic Economic Index does not publish a figure for ${occ} yet, so there is no number to give you. That is coverage, not safety, and it is worth knowing which one you are looking at.`
      : `Of the AI conversations recorded against this kind of work, <b>${shareN}%</b> looked like automation, AI completing the task, rather than augmentation, a person working with AI alongside them.`;

    const taskRows = tasks.length ? tasks.map(t =>
      `<tr><td style="padding:9px 0;border-bottom:1px solid #E2E8EC;font:400 13.5px/1.45 Helvetica,Arial,sans-serif;color:#1A1A2E">${String(t.label || "").replace(/[<&]/g, "")}</td>` +
      `<td style="padding:9px 0 9px 14px;border-bottom:1px solid #E2E8EC;text-align:right;white-space:nowrap;font:700 13.5px/1.45 Helvetica,Arial,sans-serif;color:${(t.pct === null || t.pct === undefined) ? "#9AA5AD" : (Number(t.pct) >= 50 ? "#C2621B" : "#0097A7")}">${(t.pct === null || t.pct === undefined) ? "no data" : Number(t.pct) + "%"}</td></tr>`
    ).join("") : "";

    const toVisitorReadiness = `
<div style="background:#F4F6F8;padding:28px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 34px 8px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">The AI readiness read</div>
    <h1 style="margin:12px 0 6px;font:400 27px/1.25 Georgia,'Times New Roman',serif;color:#1E3A5F">${occ}</h1>
    <p style="margin:10px 0 0;font:400 15px/1.65 Helvetica,Arial,sans-serif;color:#3B4651">${shareLine}</p>
    <p style="margin:12px 0 0;font:400 14px/1.6 Helvetica,Arial,sans-serif;color:#6B7280">
      This is a description of how people use AI today. It is not a forecast, not a probability your job disappears, and not a measure of how much of the work AI can do. Coverage for this occupation is <b style="color:#1A1A2E">${tierW}</b>.
    </p>
  </td></tr>
  ${taskRows ? `<tr><td style="padding:22px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:6px">Your tasks, most automated first</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${taskRows}</table>
    <p style="margin:12px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">The full list, with every task and every source, is on the page you came from.</p>
  </td></tr>` : ""}
  <tr><td style="padding:24px 34px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0F1923;border-radius:12px;border-collapse:collapse">
      <tr><td style="padding:22px 24px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#00BCD4">The other half of this</div>
        <div style="font:400 22px/1.25 Georgia,serif;color:#FFFFFF;margin:8px 0 10px">Your company has a level too</div>
        <p style="margin:0 0 16px;font:400 14px/1.6 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.72)">
          This read is about your tasks. There is a companion read for the organization you work in, scoring how mature its design practice is against how far AI has actually moved into it. Fifteen questions, about four minutes.
        </p>
        <a href="https://aneilrazvi.com/maturity.html" style="display:inline-block;background:#00BCD4;color:#0F1923;font:700 14px/1 Helvetica,Arial,sans-serif;padding:13px 24px;border-radius:99px;text-decoration:none">Take the organizational read</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 34px 0">
    <p style="margin:0;font:400 14px/1.65 Helvetica,Arial,sans-serif;color:#6B7280">
      If any of this landed badly, reply and tell me what you do. I read every one, and I would rather talk it through than leave you with a percentage.
    </p>
  </td></tr>
  <tr><td style="padding:22px 34px 30px">
    <div style="border-top:1px solid #E2E8EC;padding-top:14px">
      <div style="font:400 15px/1.3 Georgia,serif;color:#1E3A5F">Aneil Razvi</div>
      <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD;margin-top:3px">
        Fractional design and AI experience leadership &middot;
        <a href="https://aneilrazvi.com" style="color:#0097A7;text-decoration:none">aneilrazvi.com</a>
      </div>
    </div>
  </td></tr>
</table>
</div>`;

    const toAneilReadiness = `
<div style="font:400 15px/1.6 Helvetica,Arial,sans-serif;color:#1A1A2E">
  <h2 style="font:400 22px/1.2 Georgia,serif;color:#1E3A5F;margin:0 0 12px">${b.name || "Someone"} looked up ${occ}</h2>
  <p style="margin:0 0 6px"><b>Email:</b> ${b.email}</p>
  <p style="margin:0 0 6px"><b>Occupation:</b> ${occ} (${b.occupation_code || "no SOC"})</p>
  <p style="margin:0 0 6px"><b>Automation share:</b> ${shareN === null ? "no figure published" : shareN + "%"} &middot; <b>Coverage:</b> ${tierW}</p>
  <p style="margin:0 0 6px"><b>Typed:</b> ${(b.typed || "not recorded").toString().replace(/[<&]/g, "")}</p>
  <p style="margin:14px 0 0;color:#6B7280">This is a readiness lookup, not the maturity assessment. They are a person, not a company. Do not pitch a retainer.</p>
</div>`;

    const send = (to, subject, html) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html })
    }).catch(e => console.error("resend failed", e));

    try {
      await Promise.all([
        isReadiness
          ? send(b.email, `Your AI readiness read: ${occ}`, toVisitorReadiness)
          : send(b.email, `Your design maturity read: ${b.capability_label} / ${b.ai_label}`, toVisitor),
        isReadiness
          ? send(t, `Readiness lookup: ${b.email} (${occ})`, toAneilReadiness)
          : send(t, `New lead: ${b.company || b.email} (${b.quadrant})`, toAneil)
      ]);
      await fetch(`${SB}/rest/v1/leads?session_id=eq.${encodeURIComponent(b.session_id)}`, {
        method: "PATCH", headers: { ...H, "Prefer": "return=minimal" },
        body: JSON.stringify({ report_sent_at: new Date().toISOString() })
      });
    } catch (e) { console.error("notify block threw", e); }
  }

  return res.status(200).json({ ok: true });
}

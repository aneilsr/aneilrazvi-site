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
    // The column is constrained to full / partial / thin. The readiness page sends
    // O*NET's numeric tier (2/1/0), which the constraint rejected silently for
    // every readiness submission ever made. Map it here, where the row is built.
    coverage_tier: (b.coverage_tier === null || b.coverage_tier === undefined)
      ? null
      : (typeof b.coverage_tier === "number"
          ? (b.coverage_tier === 2 ? "full" : b.coverage_tier === 1 ? "partial" : "thin")
          : b.coverage_tier),
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
  let mailed = null;
  if (b.gated && b.email && process.env.RESEND_API_KEY) {
    const t = process.env.LEAD_NOTIFY_TO || "hi@aneilrazvi.com";
    // Every email this site sends comes from hi@. Fixed here on purpose, with no
    // environment override, so a stray variable can never change the sender.
    const from = "Aneil Razvi <hi@aneilrazvi.com>";
    const escH = (s) => String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    // AI adoption is lettered A to F, capability is numbered 1 to 6. A square reads 3B.
    const AIX = ["A","B","C","D","E","F"];
    const clipS = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
    const BOOKING = "https://cal.com/aneil-razvi/maturity-read";
    // One footer for every email a visitor receives: wordmark, phone, email, site, LinkedIn,
    // and the booking link. Same block as the Gmail signature on hi@ (29 Sep 2026).
    const SIG_HTML = `<div style="border-top:1px solid #E2E8EC;padding-top:16px">
      <a href="https://aneilrazvi.com" style="text-decoration:none"><img src="https://aneilrazvi.com/assets/email/aneil-razvi-wordmark.png" width="188" height="28" alt="Aneil Razvi" style="display:block;border:0;width:188px;height:28px;font:700 18px Georgia,serif;color:#0C1622"></a>
      <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#6E7A85;margin-top:8px">Fractional design and AI experience leadership</div>
      <div style="font:400 13px/1.7 Helvetica,Arial,sans-serif;color:#3B4651;margin-top:4px">
        <a href="tel:+14692614282" style="color:#3B4651;text-decoration:none">469.261.4282</a> &nbsp;&middot;&nbsp;
        <a href="mailto:hi@aneilrazvi.com" style="color:#3B4651;text-decoration:none">hi@aneilrazvi.com</a><br>
        <a href="https://aneilrazvi.com" style="color:#0097A7;text-decoration:none">aneilrazvi.com</a> &nbsp;&middot;&nbsp;
        <a href="https://www.linkedin.com/in/aneilrazvi" style="color:#0097A7;text-decoration:none">linkedin.com/in/aneilrazvi</a><br>
        <a href="https://cal.com/aneil-razvi" style="color:#0097A7;font-weight:700;text-decoration:none">Book a time: cal.com/aneil-razvi</a>
      </div>
    </div>`;
    const SIG_TEXT = [
      "Aneil Razvi",
      "Fractional design and AI experience leadership",
      "469.261.4282 · hi@aneilrazvi.com",
      "aneilrazvi.com · linkedin.com/in/aneilrazvi",
      "Book a time: https://cal.com/aneil-razvi"
    ];
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

    // The thirty-six squares, drawn as a table because Gmail strips inline SVG.
    // Same grid as the talk, the tear sheet and the result page: capability rows 6 to 1,
    // AI columns A to F, each square names the form, the orange edge is capability 1-2 with AI D-F.
    const matrixTable = () => {
      const F = [["A","A","H","B","B","B"],["A","H","H","H","B","B"],["K","K","K","H","H","H"],
                 ["A","C","K","K","K","K"],["A","A","C","C","C","C"],["A","A","C","C","C","C"]];
      const FM = { A:["Advice","#E8EFF0","#2E7580"], C:["Check-up","#FDE8E1","#A83F1C"], K:["Contract","#C9DDE0","#22606A"],
                   H:["Hire","#3C8B94","#FFFFFF"], B:["Beyond buying","#16212B","#FFFFFF"] };
      const capN = ["User-Driven","Integrated","Structured","Emergent","Limited","Absent"];
      const aiN  = ["Limited","Reactive","Developing","Embedded","Leading","Symbiotic"];
      const cl = Number(b.capability_level) || 1, al = Number(b.ai_level) || 1;   // both 1-based
      let out = '<table role="presentation" cellpadding="0" cellspacing="3" style="border-collapse:separate;width:100%;table-layout:fixed">';
      out += '<tr><td style="width:21%"></td>';
      for (let c = 0; c < 6; c++) {
        out += '<td style="padding:0 0 3px;text-align:center;font:700 10px/1.25 Helvetica,Arial,sans-serif;color:#16212B">' +
               '<span style="color:#2E7580">' + AIX[c] + '</span><br>' + aiN[c] + '</td>';
      }
      out += '</tr>';
      for (let r = 0; r < 6; r++) {
        const lv = 6 - r;
        out += '<tr><td style="padding:0 6px 0 0;text-align:right;font:700 10px/1.2 Helvetica,Arial,sans-serif;color:#16212B">' +
               capN[r] + ' <span style="color:#2E7580">' + lv + '</span></td>';
        for (let c = 0; c < 6; c++) {
          const f = FM[F[r][c]], edge = (lv <= 2 && c >= 3), you = (lv === cl && c + 1 === al);
          const bd = you ? "3px solid #16212B" : (edge ? "2px solid #F15A27" : "2px solid " + f[1]);
          out += '<td style="border:' + bd + ';background:' + f[1] + ';height:32px;padding:0 2px;text-align:center;border-radius:5px;' +
                 'font:700 9.5px/1.2 Helvetica,Arial,sans-serif;color:' + f[2] + '">' + f[0] + '</td>';
        }
        out += '</tr>';
      }
      out += '</table>';
      return out;
    };
    const _BUY = (() => {
      const F = [["A","A","H","B","B","B"],["A","H","H","H","B","B"],["K","K","K","H","H","H"],
                 ["A","C","K","K","K","K"],["A","A","C","C","C","C"],["A","A","C","C","C","C"]];
      const k = F[6 - (Number(b.capability_level) || 1)][(Number(b.ai_level) || 1) - 1];
      return { A:"advice", C:"a check-up", K:"a contract", H:"a hire", B:"nothing external" }[k] || "advice";
    })();

    const _cl = Number(b.capability_level) || 1, _al = Number(b.ai_level) || 1;
    const _gap = _cl - _al;
    const _edge = (_cl <= 2 && _al >= 4);
    const _read = _edge
      ? "You are on the orange edge. AI is built into how you work, and there is no design practice checking what it makes. That is the more dangerous imbalance: you are shipping plausible and wrong, faster than anyone can catch it."
      : _gap <= -2
      ? "Your AI adoption is running ahead of your design practice. You are not on the orange edge, but you are heading toward it. AI accelerates whatever process you already have, so the standard has to keep pace with the output."
      : _gap >= 2
      ? "Your design practice is meaningfully ahead of your AI adoption. That is the safer imbalance, but a team with your process discipline would compound AI faster than most, and is not."
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
        <td valign="middle" style="padding:16px 8px 16px 22px;font:400 34px/1 Georgia,serif;color:#FFFFFF;white-space:nowrap">${_cl}${AIX[_al - 1] || "A"}</td>
        <td valign="middle" style="padding:16px 22px 16px 14px;font:400 14px/1.5 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.82)">
          <b style="color:#FFFFFF">Your square.</b> Capability ${_cl}, ${b.capability_label}. AI ${AIX[_al - 1] || "A"}, ${b.ai_label}. One of thirty-six.
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
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C2410C">AI adoption</div>
          <div style="font:400 22px/1.15 Georgia,serif;color:#1E3A5F;margin-top:5px">${b.ai_label}</div>
          <div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:#6B7280;margin-top:3px">Level ${AIX[_al - 1] || "A"} on the A to F scale</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:10px">Your square, on the thirty-six</div>
    ${matrixTable()}
    <p style="margin:12px 0 0;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#9AA5AD">
      Capability up the side, AI adoption across the top, and each square names what the next dollar buys. The dark outline is your square, and it says <b style="color:#16212B">${_BUY}</b>. The orange edge is where AI has run ahead of design.
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
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#C2410C;padding-bottom:9px">AI adoption</div>
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
    ${SIG_HTML}
  </td></tr>
</table>
</div>`;

    const toAneil = `<div style="background:#F4F6F8;padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:26px 30px 6px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">New lead &middot; maturity assessment</div>
    <h1 style="margin:11px 0 0;font:400 25px/1.25 Georgia,'Times New Roman',serif;color:#1E3A5F">${b.name || "Someone"}${b.company ? " at " + b.company : ""}</h1>
    <div style="margin:6px 0 0;font:400 14px/1.5 Helvetica,Arial,sans-serif"><a href="mailto:${b.email}" style="color:#0097A7;text-decoration:none">${b.email}</a></div>
  </td></tr>

  <tr><td style="padding:18px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#1E3A5F;border-radius:12px;border-collapse:collapse">
      <tr>
        <td valign="middle" style="padding:14px 6px 14px 20px;font:400 30px/1 Georgia,serif;color:#FFFFFF;white-space:nowrap">${_cl}${AIX[_al - 1] || "A"}</td>
        <td valign="middle" style="padding:14px 20px 14px 12px;font:400 13.5px/1.5 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.82)">
          <b style="color:#FFFFFF">${b.capability_label}</b> capability, <b style="color:#FFFFFF">${b.ai_label}</b> on AI
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font:400 14px/1.5 Helvetica,Arial,sans-serif">
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Role</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.role || "not given"}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">Designers</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.team_size || "not given"}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">Stage</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.company_stage || "not given"}</td></tr>
    </table>
  </td></tr>

  ${b.blocker ? `<tr><td style="padding:18px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FFF1E6;border-radius:10px;border-collapse:collapse">
      <tr><td style="padding:14px 18px;border-left:4px solid #F97316">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C2410C">What they said is in the way</div>
        <div style="margin-top:6px;font:400 15px/1.5 Georgia,serif;color:#1A1A2E">${b.blocker}</div>
      </td></tr>
    </table>
  </td></tr>` : ""}

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <tr>
        <td width="49%" valign="top">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#0097A7;padding-bottom:9px">Design capability</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.capability_breakdown, "#00BCD4")}</table>
        </td>
        <td width="2%" style="font-size:0;line-height:0">&nbsp;</td>
        <td width="49%" valign="top">
          <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#C2410C;padding-bottom:9px">AI adoption</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${dimRows(b.ai_breakdown, "#F97316")}</table>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0F1923;border-radius:12px;border-collapse:collapse">
      <tr><td style="padding:20px 22px">
        <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#00BCD4">Ranked best fit</div>
        <div style="font:400 22px/1.25 Georgia,serif;color:#FFFFFF;margin:7px 0 10px">${b.recommended_package}</div>
        <p style="margin:0;font:400 13.5px/1.6 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.72)">Pull the tear sheet for this band before you reply. They were told to expect the written read now and the tear sheet if they answer.</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 30px 26px">
    <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD">Session ${b.session_id || "unknown"}${b.utm_source ? " &middot; via " + b.utm_source : ""}</div>
  </td></tr>
</table>
</div>`;

    const isReadiness = (b.source === "readiness");
    const occ   = b.occupation_title || "your occupation";
    const shareN = (b.automation_share === null || b.automation_share === undefined)
      ? null : Number(b.automation_share);
    const tierW = b.coverage_tier === 2 ? "full" : (b.coverage_tier === 1 ? "partial" : "thin");
    const tasks = Array.isArray(b.top_tasks) ? b.top_tasks.slice(0, 6) : [];

    const shareLine = shareN === null
      ? `The Anthropic Economic Index does not publish a figure for ${escH(occ)} yet, so there is no number to give you. That is coverage, not safety, and it is worth knowing which one you are looking at.`
      : `Of the AI conversations recorded against this kind of work, <b>${shareN}%</b> looked like automation, AI completing the task, rather than augmentation, a person working with AI alongside them.`;

    const taskRows = tasks.length ? tasks.map(t =>
      `<tr><td style="padding:9px 0;border-bottom:1px solid #E2E8EC;font:400 13.5px/1.45 Helvetica,Arial,sans-serif;color:#1A1A2E">${String(t.label || "").replace(/[<&]/g, "")}</td>` +
      `<td style="padding:9px 0 9px 14px;border-bottom:1px solid #E2E8EC;text-align:right;white-space:nowrap;font:700 13.5px/1.45 Helvetica,Arial,sans-serif;color:${(t.pct === null || t.pct === undefined) ? "#9AA5AD" : (Number(t.pct) >= 50 ? "#C2621B" : "#0097A7")}">${(t.pct === null || t.pct === undefined) ? "no data" : Number(t.pct) + "%"}</td></tr>`
    ).join("") : "";

    // ---- readiness: the ninety days and the prompt ----
    // The page promises "the same read as an email you can keep", and the page's
    // read includes a ninety day plan and a prompt carrying the visitor's results.
    // Both are rebuilt here from the same structured fields the page used, so the
    // email carries what the page showed. Keep readinessMoves() and
    // readinessPrompt() in step with moves() and promptText() in readiness.html.
    // Built server side on purpose: this endpoint mails whatever address is typed
    // into the form, so it must never relay free text supplied by the browser.
    const rTier = typeof b.coverage_tier === "number"
      ? b.coverage_tier
      : ({ full: 2, partial: 1, thin: 0 }[b.coverage_tier] ?? 0);
    const rTasks = (Array.isArray(b.top_tasks) ? b.top_tasks : []).slice(0, 12).map(x => ({
      label: clipS(x && x.label, 300),
      pct: (x && x.pct !== null && x.pct !== undefined && isFinite(Number(x.pct))) ? Number(x.pct) : null
    })).filter(x => x.label);
    const rMatched = Number.isFinite(Number(b.matched)) ? Number(b.matched) : null;
    const rTotal   = Number.isFinite(Number(b.total))   ? Number(b.total)   : null;

    const readinessMoves = () => {
      const coverageNote = rTier === 2
        ? "Every task above carries its own measurement, so the ranking is real rather than inferred."
        : (rTier === 1
          ? "Only some of your tasks were measured individually, so treat the ranking as a sample, not a census."
          : "Almost none of your tasks were measured individually. Treat every number here as thin, and weight your own log far above it.");
      return [
        ["Days 1-30",  "Log what you actually spend time on, against the task list above. Then pick one repeatable task and run it twice, with AI and without, using the same standard for what counts as finished. Record time, mistakes, and how long review took. " + coverageNote],
        ["Days 31-60", "Take the one version that measurably won and make it routine, with a human checking the output. Spend only the time you actually measured, not the time you hoped for."],
        ["Days 61-90", "Write down the before and the after. Teach it to one other person. Then redo your own numbers from the hours you now have rather than the ones you assumed at the start."]
      ];
    };

    const SOURCE_LINE = "Source: O*NET 31.0 (US Department of Labor, CC BY 4.0) and the Anthropic Economic Index, "
      + "2026-06-26 release (CC BY). Occupation match, task ranking and framing by Aneil Razvi, aneilrazvi.com.";

    const readinessPrompt = () => {
      const L = [];
      L.push(`I am a ${clipS(b.occupation_title, 200) || "person in my occupation"}${b.occupation_code ? " (O*NET " + clipS(b.occupation_code, 20) + ")" : ""}.`);
      L.push("");
      L.push("Public data on my occupation:");
      L.push(shareN === null
        ? "- Automation share: no figure is published for this occupation yet. That is missing data, not safety."
        : `- Automation share: ${shareN} percent of recorded AI use on this kind of work looked like automation, meaning AI completing the task, rather than augmentation, meaning a person working with AI.`);
      if (rTotal !== null && rMatched !== null)
        L.push(`- Task coverage: ${rMatched} of ${rTotal} O*NET tasks for this occupation were measured individually.`);
      if (rTasks.length) {
        L.push("");
        L.push("My tasks, most automated first:");
        rTasks.forEach((x, i) => L.push(`${i + 1}. ${x.label}${x.pct === null ? " (no figure)" : " (" + x.pct + " percent)"}`));
      }
      L.push("");
      L.push("Framing you must not skip:");
      L.push("- These percentages describe how people use AI on this kind of work today. They are not a forecast, not a probability my job disappears, and not a measure of how much of my work AI is capable of doing.");
      L.push("- A task with no figure is unmeasured, not safe.");
      L.push("- You do not know my real hours, my employer, or my performance. Do not assume a forty hour week and do not allocate hours you have not asked me for.");
      L.push("- Do not tell me my job is safe and do not tell me it is doomed.");
      L.push("");
      L.push("What I want from you, in this order:");
      L.push("1. Ask me which of these tasks I actually spend time on and roughly how many hours a week each one takes. Stop and wait for my answer.");
      L.push("2. Then help me design a thirty day measurement. Pick one repeatable task with me. Define how I run it with and without AI against the same standard for finished, and exactly what I record: time, mistakes, review effort, and any confidentiality limit that applies.");
      L.push("3. I will come back in thirty days with real numbers. Then help me decide what becomes routine and what I drop.");
      L.push("");
      L.push(SOURCE_LINE);
      return L.join("\n");
    };

    const rMoves  = readinessMoves();
    const rPrompt = readinessPrompt();
    const movesRows = rMoves.map(m => `<tr>
        <td valign="top" style="padding:10px 14px 10px 0;border-bottom:1px solid #E2E8EC;white-space:nowrap;font:700 13px/1.5 Helvetica,Arial,sans-serif;color:#0097A7">${m[0]}</td>
        <td valign="top" style="padding:10px 0;border-bottom:1px solid #E2E8EC;font:400 13.5px/1.55 Helvetica,Arial,sans-serif;color:#1A1A2E">${escH(m[1])}</td></tr>`).join("");

    const textVisitorReadiness = [
      `THE AI READINESS READ: ${clipS(occ, 200)}`,
      "",
      shareN === null
        ? `The Anthropic Economic Index does not publish a figure for ${clipS(occ, 200)} yet. That is coverage, not safety.`
        : `Of the AI conversations recorded against this kind of work, ${shareN}% looked like automation, AI completing the task, rather than augmentation, a person working with AI alongside them.`,
      "",
      "This describes how people use AI today. It is not a forecast, not a probability your job disappears, and not a measure of how much of the work AI can do.",
      ...(rTasks.length ? ["", "YOUR TASKS, MOST AUTOMATED FIRST", ...rTasks.map(x => `- ${x.label} (${x.pct === null ? "no data" : x.pct + "%"})`)] : []),
      "",
      "YOUR NINETY DAYS",
      ...rMoves.map(m => `${m[0]}. ${m[1]}`),
      "",
      "YOUR PROMPT, READY TO PASTE",
      "Copy everything between the lines into Claude, ChatGPT or whichever assistant you use.",
      "----------------------------------------",
      rPrompt,
      "----------------------------------------",
      "",
      "Your company has a level too. Fifteen questions, about four minutes: https://aneilrazvi.com/maturity.html",
      "",
      "If any of this landed badly, reply and tell me what you do. I read every one.",
      "",
      ...SIG_TEXT
    ].join("\n");

    const toVisitorReadiness = `
<div style="background:#F4F6F8;padding:28px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 34px 8px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">The AI readiness read</div>
    <h1 style="margin:12px 0 6px;font:400 27px/1.25 Georgia,'Times New Roman',serif;color:#1E3A5F">${escH(occ)}</h1>
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
  <tr><td style="padding:26px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:4px">Your ninety days</div>
    <p style="margin:6px 0 4px;font:400 13.5px/1.6 Helvetica,Arial,sans-serif;color:#6B7280">A number is not a plan, and nobody knows your actual week except you. This is the ninety days that would tell you what is really true for your job.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${movesRows}</table>
  </td></tr>
  <tr><td style="padding:26px 34px 0">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:4px">Your prompt, ready to paste</div>
    <p style="margin:6px 0 10px;font:400 13.5px/1.6 Helvetica,Arial,sans-serif;color:#6B7280">Copy everything in the box into Claude, ChatGPT or whichever assistant you use. It carries your own results, so the assistant starts from your data rather than a guess.</p>
    <div style="background:#F4F6F8;border:1px solid #E2E8EC;border-radius:10px;padding:16px 18px;font:400 12.5px/1.6 Menlo,Consolas,'Courier New',monospace;color:#1A1A2E;word-break:break-word">${escH(rPrompt).replace(/\n/g, "<br>")}</div>
  </td></tr>
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
    ${SIG_HTML}
  </td></tr>
</table>
</div>`;

    const toAneilReadiness = `<div style="background:#F4F6F8;padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:26px 30px 6px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">Readiness lookup</div>
    <h1 style="margin:11px 0 0;font:400 25px/1.25 Georgia,'Times New Roman',serif;color:#1E3A5F">${escH(occ)}</h1>
    <div style="margin:6px 0 0;font:400 14px/1.5 Helvetica,Arial,sans-serif;color:#6B7280">${b.name ? b.name + " &middot; " : ""}<a href="mailto:${b.email}" style="color:#0097A7;text-decoration:none">${b.email}</a></div>
  </td></tr>

  <tr><td style="padding:18px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${shareN === null ? "#6B7280" : "#C2410C"};border-radius:12px;border-collapse:collapse">
      <tr>
        <td valign="middle" style="padding:14px 6px 14px 20px;font:400 30px/1 Georgia,serif;color:#FFFFFF;white-space:nowrap">${shareN === null ? "&mdash;" : shareN + "%"}</td>
        <td valign="middle" style="padding:14px 20px 14px 12px;font:400 13.5px/1.5 Helvetica,Arial,sans-serif;color:rgba(255,255,255,.85)">
          ${shareN === null ? "No figure published for this occupation" : "of recorded AI use on this work looked like automation"}
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font:400 14px/1.5 Helvetica,Arial,sans-serif">
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">They typed</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${(b.typed || "not recorded").toString().replace(/[<&]/g, "")}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">O*NET code</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.occupation_code || "none"}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">Coverage</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${tierW}</td></tr>
    </table>
  </td></tr>

  ${taskRows ? `<tr><td style="padding:20px 30px 0">
    <div style="font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;padding-bottom:6px">What they saw, most automated first</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${taskRows}</table>
  </td></tr>` : ""}

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#F4F6F8;border-radius:10px;border:1px dashed #CBD5DB;border-collapse:separate">
      <tr><td style="padding:14px 18px;font:400 13.5px/1.6 Helvetica,Arial,sans-serif;color:#3B4651">
        <b style="color:#1A1A2E">This is a person, not a company.</b> A readiness lookup is someone asking what AI is doing to their own job. Do not pitch a retainer. If you reply at all, reply about their work.
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 30px 26px">
    <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD">Session ${b.session_id || "unknown"}${b.utm_source ? " &middot; via " + b.utm_source : ""}</div>
  </td></tr>
</table>
</div>`;

    // ---- /build : course waiting list. No scores, no read, just a confirmation. ----
    const isBuild = (b.source === "build");

    const bAns = (b.answers && typeof b.answers === "object") ? b.answers : {};
    const bInt = Array.isArray(bAns.interest) ? bAns.interest : [];
    const bScope = (bAns.scope && typeof bAns.scope === "object") ? bAns.scope : null;
    const wantsCohort = bInt.includes("founding-cohort");
    const wantsSelf = bInt.includes("self-paced");
    const wantsRoom = bInt.includes("in-person");
    const bP = "margin:10px 0 0;font:400 15px/1.65 Helvetica,Arial,sans-serif;color:#3B4651";
    const bLab = "font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0097A7;margin:16px 0 6px";
    const bH2 = "margin:0 0 4px;font:400 19px/1.3 Georgia,'Times New Roman',serif;color:#1E3A5F";
    const bBtn = "display:inline-block;margin-top:12px;background:#00BCD4;color:#0F1923;font:700 14px/1 Helvetica,Arial,sans-serif;text-decoration:none;padding:12px 18px;border-radius:8px";
    const bWho = { me: "You", team: "Someone on your team", customers: "One of your customers", community: "Someone in your group" };
    const bSize = { small: "Small. A few weekends on paper and a first version you can click.",
                    medium: "Medium. A few weeks of evenings. Paper first will save you most of them.",
                    big: "Big. Very doable, but plan the hardest part on paper before anything gets built." };
    let bScopeHtml = "";
    if (bScope) {
      const who = bWho[bScope.who] || "Someone";
      const doneLine = bScope.done ? `${escH(who)} can ${escH(bScope.done)}, without asking you how.` : "Not written yet. That is the first thing to fix, and it is step 1 of the course.";
      const screens = Array.isArray(bScope.screens) ? bScope.screens.slice(0, 5).map(x => `<li style="margin:3px 0">${escH(x)}</li>`).join("") : "";
      bScopeHtml = `
  <tr><td style="padding:6px 34px 4px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:2px dashed #00BCD4;border-radius:12px;border-collapse:separate">
      <tr><td style="padding:16px 18px 18px;font:400 14.5px/1.6 Helvetica,Arial,sans-serif;color:#1A1A2E">
        <div style="${bH2}">Your paper scope</div>
        ${bScope.idea ? `<div style="color:#6B7280;font-size:13.5px">${escH(bScope.idea)}</div>` : ""}
        <div style="${bLab}">Done looks like</div><div>${doneLine}</div>
        ${screens ? `<div style="${bLab}">Sketch these first</div><ol style="margin:0;padding-left:20px">${screens}</ol>` : ""}
        ${bSize[bScope.size] ? `<div style="${bLab}">How big it is</div><div>${bSize[bScope.size]}</div>` : ""}
        ${bScope.today ? `<div style="${bLab}">What you're up against</div><div>Today they use ${escH(bScope.today)}. Your app has to be easier than that, or they won't switch.</div>` : ""}
      </td></tr>
    </table>
  </td></tr>`;
    }
    const bIdeaMap = (bScope || bInt.includes("scope")) ? `
  <tr><td style="padding:14px 34px 4px">
    <div style="${bH2}">Pressure-test it: the idea map</div>
    <p style="${bP}">Paste this prompt into Claude or ChatGPT and answer its questions honestly. It splits your idea into what you actually know, what you are assuming, and what nobody can know yet.</p>
    <a href="https://aneilrazvi.com/idea-map.html" style="${bBtn}">Get the idea map prompt</a>
  </td></tr>` : "";
    const bCohort = wantsCohort ? `
  <tr><td style="padding:14px 34px 4px">
    <div style="${bH2}">Your founding seat</div>
    <p style="${bP}">Seven live sessions on Saturdays, 10 to 11:30am Central, starting Sat 31 Oct. $897, or two payments of $459. Full refund until session 2, and it runs even with a small group. I will send your seat link in the next few days. Any question before then, just reply to this email.</p>
  </td></tr>` : "";
    const bSelf = wantsSelf ? `
  <tr><td style="padding:14px 34px 4px">
    <div style="${bH2}">The self-paced course</div>
    <p style="${bP}">It opens after the founding cohort finishes. You will get one email from me when it does, and nothing else in between.</p>
  </td></tr>` : "";
    const bRoom = wantsRoom ? `
  <tr><td style="padding:14px 34px 4px">
    <div style="${bH2}">A workshop for your school or team</div>
    <p style="${bP}">Reply with who it is for and a rough date, or grab 15 minutes at <a href="https://cal.com/aneil-razvi/intro" style="color:#0097A7">cal.com/aneil-razvi/intro</a>. Colleges and student groups are free this fall.</p>
  </td></tr>` : "";
    const bTitle = (bScope && !wantsCohort && !wantsSelf && !wantsRoom) ? "Your paper scope" : "You are on the list";

    const toVisitorBuild = `
<div style="background:#F4F6F8;padding:28px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 34px 8px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">AI, Built On Paper</div>
    <h1 style="margin:12px 0 6px;font:400 27px/1.25 Georgia,'Times New Roman',serif;color:#1E3A5F">${bTitle}</h1>
    <p style="${bP}">Thanks for your interest in the course. Here is what happens next.</p>
  </td></tr>
  ${bScopeHtml}${bCohort}${bSelf}${bRoom}${bIdeaMap}
  <tr><td style="padding:18px 34px 6px">
    <p style="${bP}">If you would rather talk it through first, 15 minutes is at
      <a href="https://cal.com/aneil-razvi/intro" style="color:#0097A7">cal.com/aneil-razvi/intro</a>. Replying to this email works too.</p>
  </td></tr>
  <tr><td style="padding:16px 34px 30px">
    ${SIG_HTML}
  </td></tr>
</table>
</div>`;
    const bSubject = bTitle === "Your paper scope" ? "Your paper scope" : (bScope ? "Your paper scope, and you are on the list" : "You are on the list for the course");

    const toAneilBuild = `<div style="background:#F4F6F8;padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:5px;background:#00BCD4;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:26px 30px 6px">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0097A7">Course waiting list</div>
    <h1 style="margin:11px 0 0;font:400 25px/1.3 Georgia,'Times New Roman',serif;color:#1E3A5F">
      <a href="mailto:${b.email}" style="color:#1E3A5F;text-decoration:none">${b.email}</a>
    </h1>
    <div style="margin:6px 0 0;font:400 14px/1.5 Helvetica,Arial,sans-serif;color:#6B7280">${b.name ? b.name : "No name given"}</div>
  </td></tr>

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font:400 14px/1.5 Helvetica,Arial,sans-serif">
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Interested in</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E;font-weight:700">${bInt.length ? escH(bInt.join(", ")) : "not stated"}</td></tr>
      ${bScope ? `<tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Their idea</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${escH(bScope.idea || "")}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Done when someone can</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${escH(bScope.done || "not written")}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Users, today, size</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${escH([bScope.who, bScope.today, bScope.size].filter(Boolean).join(" / "))}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Must have, experience</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${escH([(bScope.must || []).join(", "), bScope.experience].filter(Boolean).join(" / "))}</td></tr>` : ""}
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280;width:38%">Came in via</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.utm_source || "direct"}${b.utm_medium ? " / " + b.utm_medium : ""}${b.utm_campaign ? " / " + b.utm_campaign : ""}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">Landed on</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.landing_path || "unknown"}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#6B7280">Referrer</td><td style="padding:7px 0;border-bottom:1px solid #E2E8EC;color:#1A1A2E">${b.referrer || "none"}</td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 30px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#F4F6F8;border-radius:10px;border:1px dashed #CBD5DB;border-collapse:separate">
      <tr><td style="padding:14px 18px;font:400 13.5px/1.6 Helvetica,Arial,sans-serif;color:#3B4651">
        <b style="color:#1A1A2E">This is an idea, not a budget.</b> Someone on the build list is circling a project, often a not-for-profit one, and usually has no money to build it. Do not pitch a retainer. If you reply, ask what the idea is.
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 30px 26px">
    <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#9AA5AD">Session ${b.session_id || "unknown"}</div>
  </td></tr>
</table>
</div>`;

    // Resolves true only when Resend accepted the message. A rejection (bad sender,
    // bad address, rate limit) comes back as a normal HTTP response, not a thrown
    // error, so it has to be checked or it disappears without a trace.
    const send = (to, subject, html, text) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ from, to: [to], subject, html }, text ? { text } : {}))
    }).then(async r => {
      if (!r.ok) {
        console.error("resend rejected", r.status, subject, await r.text().catch(() => ""));
        return false;
      }
      return true;
    }).catch(e => { console.error("resend failed", e); return false; });

    try {
      const pair = isBuild
        ? [ send(b.email, bSubject, toVisitorBuild),
            send(t, `Build list: ${b.email}${bInt.length ? " (" + bInt.join(", ") + ")" : ""}`, toAneilBuild) ]
        : isReadiness
        ? [ send(b.email, `Your AI readiness read: ${clipS(occ, 150)}`, toVisitorReadiness, textVisitorReadiness),
            send(t, `Readiness lookup: ${b.email} (${clipS(occ, 150)})`, toAneilReadiness) ]
        : [ send(b.email, `Your design maturity read: ${b.capability_label} / ${b.ai_label}`, toVisitor),
            send(t, `New lead: ${b.company || b.email} (${b.quadrant})`, toAneil) ];
      const sent = await Promise.all(pair);
      mailed = sent[0] === true;            // [0] is always the visitor's copy
      if (mailed) {
        await fetch(`${SB}/rest/v1/leads?session_id=eq.${encodeURIComponent(b.session_id)}`, {
          method: "PATCH", headers: { ...H, "Prefer": "return=minimal" },
          body: JSON.stringify({ report_sent_at: new Date().toISOString() })
        });
      }
    } catch (e) { mailed = false; console.error("notify block threw", e); }
  } else if (b.gated && b.email) {
    mailed = false;
    console.error("gated lead with no RESEND_API_KEY set; nothing was emailed");
  }

  // mailed: true (visitor's email accepted), false (tried and failed), null (no email asked for).
  // The pages use it so they never say "on its way" about a message that was not sent.
  return res.status(200).json({ ok: true, mailed });
}

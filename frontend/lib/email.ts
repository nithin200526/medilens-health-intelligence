import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM || `"MediLens" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ── Email Templates ──────────────────────────────────────────────────────────

function html(body: string) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
  body{font-family:Inter,sans-serif;margin:0;background:#f8fafc;color:#1e293b}
  .card{max-width:560px;margin:40px auto;background:#fff;border-radius:20px;padding:36px;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
  .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px}
  .logo-name{font-size:18px;font-weight:700;color:#1e293b}
  h2{margin:0 0 10px;font-size:20px;font-weight:700}
  p{margin:0 0 16px;color:#475569;line-height:1.6}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
  .badge-danger{background:#fee2e2;color:#dc2626}
  .badge-warning{background:#fef3c7;color:#d97706}
  .badge-success{background:#dcfce7;color:#16a34a}
  .btn{display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;margin-top:8px}
  .footer{margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}
</style></head>
<body><div class="card">${body}</div></body>
</html>`;
}

// ─── Send: Analysis Complete ─────────────────────────────────────────────────
export async function sendAnalysisCompleteEmail(opts: {
    to: string; name: string; patientName: string; totalTests: number;
    abnormalTests: number; overallRisk: string; reportId: string;
}) {
    if (!process.env.SMTP_USER) return; // No email config, skip silently

    const riskClass =
        opts.overallRisk.toUpperCase().includes("CRITICAL") ? "badge-danger"
            : opts.overallRisk.toUpperCase().includes("HIGH") ? "badge-warning"
                : "badge-success";

    await transporter.sendMail({
        from: FROM, to: opts.to,
        subject: "✅ Your MediLens Report is Ready",
        html: html(`
      <div class="logo">
        <div class="logo-icon">M</div>
        <span class="logo-name">MediLens</span>
      </div>
      <h2>Hi ${opts.name || "there"}, your report is ready!</h2>
      <p>We've finished analyzing the report for <strong>${opts.patientName}</strong>.</p>
      <p><strong>${opts.totalTests}</strong> markers were checked.
         <strong>${opts.abnormalTests}</strong> need your attention.</p>
      <p>Overall status: <span class="badge ${riskClass}">${opts.overallRisk}</span></p>
      <a href="${APP_URL}/dashboard/results?id=${opts.reportId}" class="btn">View Full Report →</a>
      <div class="footer">You're receiving this because you enabled analysis notifications in MediLens. 
      <a href="${APP_URL}/dashboard/profile">Manage preferences</a></div>
    `),
    });
}

// ─── Send: Abnormal Markers Alert ───────────────────────────────────────────
export async function sendAbnormalMarkersEmail(opts: {
    to: string; name: string; patientName: string;
    criticalCount: number; abnormalTests: number; reportId: string;
}) {
    if (!process.env.SMTP_USER) return;

    await transporter.sendMail({
        from: FROM, to: opts.to,
        subject: "⚠️ Critical Markers Found — Action Required",
        html: html(`
      <div class="logo">
        <div class="logo-icon">M</div>
        <span class="logo-name">MediLens</span>
      </div>
      <h2>⚠️ Abnormal Markers Detected</h2>
      <p>The report for <strong>${opts.patientName}</strong> contains markers that need attention:</p>
      ${opts.criticalCount > 0 ? `<p><span class="badge badge-danger">⚡ ${opts.criticalCount} Critical</span> markers require immediate medical attention.</p>` : ""}
      <p><strong>${opts.abnormalTests}</strong> total markers are outside the normal range.</p>
      <p>Please review the full analysis and consult your doctor if needed.</p>
      <a href="${APP_URL}/dashboard/results?id=${opts.reportId}" class="btn">Review Report →</a>
      <div class="footer">
        <a href="${APP_URL}/dashboard/profile">Manage notification preferences</a>
      </div>
    `),
    });
}

// ─── Send: Weekly Summary ────────────────────────────────────────────────────
export async function sendWeeklySummaryEmail(opts: {
    to: string; name: string; reportCount: number; latestRisk: string;
}) {
    if (!process.env.SMTP_USER) return;

    await transporter.sendMail({
        from: FROM, to: opts.to,
        subject: "📊 Your Weekly MediLens Health Summary",
        html: html(`
      <div class="logo">
        <div class="logo-icon">M</div>
        <span class="logo-name">MediLens</span>
      </div>
      <h2>Weekly Health Summary</h2>
      <p>Hi ${opts.name || "there"},</p>
      <p>Here's your health snapshot for the past 7 days:</p>
      <p>📋 <strong>${opts.reportCount}</strong> report(s) on file this week.</p>
      ${opts.latestRisk ? `<p>Latest status: <span class="badge badge-success">${opts.latestRisk}</span></p>` : ""}
      <a href="${APP_URL}/dashboard" class="btn">Open Dashboard →</a>
      <div class="footer"><a href="${APP_URL}/dashboard/profile">Unsubscribe from weekly summaries</a></div>
    `),
    });
}

// ─── Send: Family Profile Activity ──────────────────────────────────────────
export async function sendFamilyActivityEmail(opts: {
    to: string; name: string; profileName: string; action: string;
}) {
    if (!process.env.SMTP_USER) return;

    await transporter.sendMail({
        from: FROM, to: opts.to,
        subject: `👨‍👩‍👧 Family Hub: ${opts.profileName} profile updated`,
        html: html(`
      <div class="logo">
        <div class="logo-icon">M</div>
        <span class="logo-name">MediLens</span>
      </div>
      <h2>Family Profile Activity</h2>
      <p>Hi ${opts.name || "there"}, a change was made to your family hub:</p>
      <p><strong>${opts.profileName}</strong> — ${opts.action}</p>
      <a href="${APP_URL}/dashboard/profiles" class="btn">View Family Hub →</a>
      <div class="footer"><a href="${APP_URL}/dashboard/profile">Manage notification preferences</a></div>
    `),
    });
}

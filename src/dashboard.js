import { getAllProjectsSummary } from "./github.js";
import { getOwner, listProjects } from "./projects.js";
import { getConfigStatus } from "./config-status.js";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ciBadge(workflow) {
  if (!workflow) return `<span class="badge muted">Sin CI reciente</span>`;
  const { conclusion, status, name } = workflow;
  if (status === "in_progress" || status === "queued") {
    return `<span class="badge warn">⏳ ${escapeHtml(name)}</span>`;
  }
  if (conclusion === "success") {
    return `<span class="badge ok">✅ ${escapeHtml(name)}</span>`;
  }
  if (conclusion === "failure") {
    return `<span class="badge err">❌ ${escapeHtml(name)}</span>`;
  }
  return `<span class="badge muted">${escapeHtml(conclusion ?? status)}</span>`;
}

export async function getDashboardData() {
  const [projects, config] = await Promise.all([
    getAllProjectsSummary(),
    Promise.resolve(getConfigStatus()),
  ]);
  return {
    owner: getOwner(),
    projectCount: listProjects().length,
    config,
    projects,
    generatedAt: new Date().toISOString(),
  };
}

export async function renderDashboardPage() {
  const data = await getDashboardData();
  const cards = data.projects
    .map(({ project, summary }) => {
      if (summary.error) {
        return `<article class="card err"><h2>${escapeHtml(project.label)}</h2><p>${escapeHtml(summary.error)}</p></article>`;
      }
      const prs =
        summary.prTitles?.length > 0
          ? `<ul>${summary.prTitles.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
          : `<p class="muted">Sin PRs abiertos</p>`;
      return `<article class="card">
        <h2>${escapeHtml(project.label)}</h2>
        <p class="repo">${escapeHtml(summary.fullName)}</p>
        <p>Rama <code>${escapeHtml(summary.defaultBranch)}</code> · ${formatDate(summary.updatedAt)}</p>
        ${
          summary.lastCommit
            ? `<p class="commit">"${escapeHtml(summary.lastCommit.message)}"<br><span class="muted">${escapeHtml(summary.lastCommit.author)}</span></p>`
            : ""
        }
        <p><strong>${summary.openPrs}</strong> PR(s) abierto(s)</p>
        ${prs}
        ${ciBadge(summary.lastWorkflow)}
      </article>`;
    })
    .join("");

  const cfg = data.config;
  const checklist = [
    { ok: cfg.githubToken, label: "GitHub token (repos privados / más cuota)" },
    { ok: cfg.twilio, label: "Twilio WhatsApp configurado" },
    { ok: cfg.whatsappNumbers > 0, label: "Número(s) autorizados en WhatsApp" },
    { ok: Boolean(cfg.publicUrl), label: "URL pública (webhooks)" },
    { ok: cfg.githubWebhookSecret, label: "Secret webhook GitHub (opcional)" },
  ]
    .map(
      (c) =>
        `<li class="${c.ok ? "ok" : "pending"}">${c.ok ? "✓" : "○"} ${escapeHtml(c.label)}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0f766e">
  <title>Agente de proyectos</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      margin: 0; padding: 1rem;
      background: #0b1220; color: #e2e8f0;
      line-height: 1.5;
    }
    header { margin-bottom: 1.25rem; }
    h1 { font-size: 1.35rem; margin: 0 0 .25rem; }
    .sub { color: #94a3b8; font-size: .9rem; }
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card {
      background: #111827; border: 1px solid #1e293b;
      border-radius: 12px; padding: 1rem;
    }
    .card h2 { margin: 0 0 .35rem; font-size: 1.1rem; }
    .repo { color: #5eead4; font-size: .85rem; margin: 0 0 .5rem; }
    .commit { font-size: .9rem; }
    .muted { color: #94a3b8; font-size: .85rem; }
    .badge {
      display: inline-block; margin-top: .75rem; padding: .25rem .5rem;
      border-radius: 6px; font-size: .8rem;
    }
    .badge.ok { background: #064e3b; color: #6ee7b7; }
    .badge.err { background: #450a0a; color: #fca5a5; }
    .badge.warn { background: #422006; color: #fcd34d; }
    .badge.muted { background: #1e293b; color: #94a3b8; }
    .card.err { border-color: #7f1d1d; }
    ul { margin: .5rem 0; padding-left: 1.1rem; }
    code { background: #1e293b; padding: .1rem .35rem; border-radius: 4px; }
    .panel { margin-top: 1rem; }
    .panel h3 { font-size: 1rem; margin: 0 0 .5rem; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist li { padding: .35rem 0; font-size: .9rem; }
    .checklist .ok { color: #6ee7b7; }
    .checklist .pending { color: #fcd34d; }
    .wa-hint {
      margin-top: 1rem; padding: .75rem; border-radius: 8px;
      background: #134e4a; font-size: .85rem;
    }
    button {
      margin-top: .75rem; padding: .5rem 1rem; border: 0; border-radius: 8px;
      background: #0d9488; color: white; font-weight: 600; cursor: pointer;
    }
    footer { margin-top: 1.5rem; color: #64748b; font-size: .75rem; }
  </style>
</head>
<body>
  <header>
    <h1>📱 Agente de proyectos</h1>
    <p class="sub">${data.projectCount} proyecto(s) · ${escapeHtml(data.owner)} · ${formatDate(data.generatedAt)}</p>
  </header>
  <div class="grid">${cards}</div>
  <section class="panel card">
    <h3>Configuración WhatsApp</h3>
    <ul class="checklist">${checklist}</ul>
    <div class="wa-hint">
      <strong>Desde el celular:</strong> escribe <code>estado</code>, <code>proyectos</code> o <code>ayuda</code> por WhatsApp cuando Twilio esté conectado.
    </div>
    <button type="button" onclick="location.reload()">Actualizar</button>
  </section>
  <footer>
    API: <code>/api/projects</code> · Salud: <code>/health</code>
  </footer>
  <script>setTimeout(() => location.reload(), 60000);</script>
</body>
</html>`;
}

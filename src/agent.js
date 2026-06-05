import { findProject, getOwner, listProjects } from "./projects.js";
import { getAllProjectsSummary, getRepoSummary, listOwnerRepos } from "./github.js";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function workflowEmoji(conclusion, status) {
  if (status === "in_progress" || status === "queued") return "⏳";
  if (conclusion === "success") return "✅";
  if (conclusion === "failure") return "❌";
  return "⚪";
}

function formatProjectStatus(summary, label) {
  if (summary.error) {
    return `*${label}*\n${summary.error}`;
  }

  const lines = [
    `*${label}* (${summary.fullName})`,
    summary.description ? `_${summary.description}_` : null,
    `Rama: \`${summary.defaultBranch}\` · Actualizado: ${formatDate(summary.updatedAt)}`,
  ].filter(Boolean);

  if (summary.lastCommit) {
    lines.push(
      `Último commit: "${summary.lastCommit.message}" — ${summary.lastCommit.author} (${formatDate(summary.lastCommit.date)})`
    );
  }

  lines.push(`PRs abiertos: ${summary.openPrs}`);
  if (summary.prTitles.length) {
    summary.prTitles.forEach((t) => lines.push(`  • ${t}`));
  }

  if (summary.lastWorkflow) {
    const w = summary.lastWorkflow;
    lines.push(
      `${workflowEmoji(w.conclusion, w.status)} CI: ${w.name} → ${w.conclusion ?? w.status}`
    );
  }

  return lines.join("\n");
}

const HELP_TEXT = `*Agente de proyectos* 🤖

Comandos desde WhatsApp:

• *proyectos* — lista tus proyectos configurados
• *estado* — resumen de todos los proyectos
• *estado asd* — detalle de un proyecto
• *repos* — repos recientes en GitHub
• *ayuda* — este mensaje

Recibirás avisos automáticos si conectas el webhook de GitHub (push, PR, CI).

_Gestiona todo desde el celular._`;

export async function handleIncomingMessage(body) {
  const text = (body ?? "").trim();
  const lower = text.toLowerCase();

  if (!text || lower === "hola" || lower === "hi" || lower === "ayuda" || lower === "help") {
    return HELP_TEXT;
  }

  if (lower === "proyectos" || lower === "projects") {
    const projects = listProjects();
    if (!projects.length) {
      return "No hay proyectos en config/projects.json.";
    }
    const lines = projects.map(
      (p) => `• *${p.id}* — ${p.label} (\`${getOwner()}/${p.repo}\`)`
    );
    return `*Proyectos monitoreados* (${projects.length})\n\n${lines.join("\n")}\n\n_Escribe_ \`estado ${projects[0].id}\` _para ver detalle._`;
  }

  if (lower === "estado" || lower === "status" || lower === "resumen") {
    const all = await getAllProjectsSummary();
    const blocks = all.map(({ project, summary }) =>
      formatProjectStatus(summary, project.label)
    );
    return `*Resumen de proyectos*\n\n${blocks.join("\n\n—\n\n")}`;
  }

  const estadoMatch = lower.match(/^estado(?:\s+(.+))?$/);
  if (estadoMatch) {
    const query = estadoMatch[1]?.trim();
    if (!query) {
      return await handleIncomingMessage("estado");
    }
    const project = findProject(query);
    if (!project) {
      return `No encontré el proyecto "${query}". Escribe *proyectos* para ver la lista.`;
    }
    const summary = await getRepoSummary(getOwner(), project.repo);
    return formatProjectStatus(summary, project.label);
  }

  if (lower === "repos") {
    const repos = await listOwnerRepos();
    if (!repos.length) {
      return "No pude listar repos (¿falta GITHUB_TOKEN?).";
    }
    const tracked = new Set(listProjects().map((p) => p.repo));
    const lines = repos.slice(0, 15).map((r) => {
      const mark = tracked.has(r.name) ? "📌" : "○";
      return `${mark} *${r.name}* — ${formatDate(r.updated_at)}`;
    });
    return `*Repos en ${getOwner()}*\n\n${lines.join("\n")}\n\n📌 = en config/projects.json`;
  }

  return `No entendí "${text}".\n\n${HELP_TEXT}`;
}

export async function formatGitHubEventNotification(event, payload) {
  const repo = payload.repository?.full_name ?? "repo";
  const action = payload.action;

  switch (event) {
    case "push": {
      const branch = payload.ref?.replace("refs/heads/", "") ?? "?";
      const who = payload.pusher?.name ?? "alguien";
      const count = payload.commits?.length ?? 0;
      return `📤 *Push* en \`${repo}\`\nRama: \`${branch}\`\n${count} commit(s) por ${who}`;
    }
    case "pull_request": {
      const pr = payload.pull_request;
      return `🔀 *PR ${action}* en \`${repo}\`\n#${pr.number} ${pr.title}\n${pr.user.login} → ${pr.base.ref}`;
    }
    case "workflow_run": {
      const run = payload.workflow_run;
      const icon = workflowEmoji(run.conclusion, run.status);
      return `${icon} *CI ${run.conclusion ?? run.status}* en \`${repo}\`\n${run.name}\n${run.html_url}`;
    }
    default:
      return `📣 Evento *${event}* en \`${repo}\``;
  }
}

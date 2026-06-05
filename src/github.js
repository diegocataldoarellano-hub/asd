import { getOwner, listProjects } from "./projects.js";

const GITHUB_API = "https://api.github.com";

function headers() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "proyecto-whatsapp-agent",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getRepoSummary(owner, repo) {
  const [repoData, pulls, runs, commits] = await Promise.all([
    ghFetch(`/repos/${owner}/${repo}`),
    ghFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=5`),
    ghFetch(`/repos/${owner}/${repo}/actions/runs?per_page=3`),
    ghFetch(`/repos/${owner}/${repo}/commits?per_page=1`),
  ]);

  if (!repoData) {
    return { error: `Repositorio ${owner}/${repo} no encontrado.` };
  }

  const lastCommit = commits?.[0];
  const lastRun = runs?.workflow_runs?.[0];

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    defaultBranch: repoData.default_branch,
    updatedAt: repoData.updated_at,
    openPrs: pulls?.length ?? 0,
    prTitles: (pulls ?? []).map((p) => `#${p.number} ${p.title}`),
    lastCommit: lastCommit
      ? {
          message: lastCommit.commit.message.split("\n")[0],
          author: lastCommit.commit.author.name,
          date: lastCommit.commit.author.date,
        }
      : null,
    lastWorkflow: lastRun
      ? {
          name: lastRun.name,
          status: lastRun.status,
          conclusion: lastRun.conclusion,
          url: lastRun.html_url,
        }
      : null,
  };
}

export async function getAllProjectsSummary() {
  const owner = getOwner();
  const projects = listProjects();
  const results = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      summary: await getRepoSummary(owner, p.repo),
    }))
  );
  return results;
}

export async function listOwnerRepos() {
  const owner = getOwner();
  const repos = await ghFetch(`/users/${owner}/repos?sort=updated&per_page=30`);
  return repos ?? [];
}

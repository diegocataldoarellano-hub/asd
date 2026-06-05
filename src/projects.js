import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const configPath = join(dirname(fileURLToPath(import.meta.url)), "../config/projects.json");

let cached;

export function loadProjectsConfig() {
  if (!cached) {
    cached = JSON.parse(readFileSync(configPath, "utf8"));
  }
  return cached;
}

export function listProjects() {
  return loadProjectsConfig().projects;
}

export function findProject(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return listProjects().find(
    (p) =>
      p.id.toLowerCase() === q ||
      p.repo.toLowerCase() === q ||
      p.label.toLowerCase().includes(q)
  );
}

export function getOwner() {
  return loadProjectsConfig().owner;
}

# AGENTS.md

## Cursor Cloud specific instructions

This repository is currently a **placeholder**: it contains only `README.md` (`# asd`) and no application source, dependency manifests, or service definitions.

### What works today

- Git operations against `origin` (`diegocataldoarellano-hub/asd`, branch `main`).
- Standard shell tooling in the Cloud Agent VM.

### When application code is added

After the repo includes real project files, future agents should:

1. **Discover stack** from lockfiles and docs (`package.json`, `pnpm-lock.yaml`, `requirements.txt`, `go.mod`, `docker-compose.yml`, `Makefile`, `README.md`, etc.).
2. **Install dependencies** using the repo’s package manager (match the lockfile; do not guess).
3. **Lint / test / run** using scripts documented in `README.md` or `package.json` `"scripts"` (or framework equivalents).
4. **Start services** only outside the VM update script (e.g. databases via Docker Compose, dev servers via tmux). Document non-obvious ports, env vars, and startup order here once known.

### Update script behavior

The VM startup update script is intentionally minimal (`true`) until dependency files exist. Extend it only with idempotent install commands that match committed lockfiles—never start dev servers or migrations in the update script.

### If setup still fails

If you expected a full application in this workspace, confirm the Cloud Agent is pointed at the correct GitHub repository and branch; this tree has no runnable product yet.

# AGENTS.md

## Cursor Cloud specific instructions

### Product

**Agente WhatsApp de proyectos** — servicio Node.js que informa por WhatsApp el estado de repos GitHub y envía alertas automáticas (push, PR, CI). Ver `README.md` para Twilio y webhooks.

### Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Dev server | `npm run dev` |
| Prod server | `npm start` |
| Simular WhatsApp (sin Twilio) | `npm run chat -- "estado"` |

### Services

| Service | Required | Port | Notes |
|---------|----------|------|-------|
| `npm start` | Yes | `PORT` (3000) | Panel web en `GET /` (móvil-friendly) |
| GitHub API | Optional | — | Rate limits without `GITHUB_TOKEN` |

### Environment

Copy `.env.example` → `.env`. For WhatsApp from a phone you need Twilio credentials and a public HTTPS URL pointing to `/webhook/whatsapp`.

### Non-obvious notes

- Incoming WhatsApp replies are sent via Twilio REST API, not TwiML `<Message>` — webhook returns empty `<Response>`.
- `ALLOWED_WHATSAPP_NUMBERS` empty = open mode (dev only).
- Add repos in `config/projects.json`; GitHub webhook only notifies tracked repos.
- Hot reload: `npm run dev` uses `node --watch`.

### Update script

Runs `npm install` on VM startup (see `.cursor/environment.json` or cloud update script).

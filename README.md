# Agente WhatsApp de proyectos

Bot de WhatsApp que te informa del estado de cada proyecto (GitHub: commits, PRs, CI) y envía avisos automáticos cuando algo cambia. Lo usas **desde el celular** sin abrir Cursor ni el navegador.

## Qué hace

| Canal | Función |
|--------|---------|
| **WhatsApp (Twilio)** | Respondes comandos y recibes resúmenes |
| **Webhook GitHub** | Te avisa en WhatsApp por push, PR y CI |

### Comandos

- `proyectos` — proyectos monitoreados
- `estado` — resumen de todos
- `estado asd` — detalle de un repo
- `repos` — repos recientes en GitHub
- `ayuda` — lista de comandos

## Inicio rápido (local)

```bash
npm install
npm run chat -- ayuda
npm run chat -- proyectos
npm run chat -- estado
npm test
npm run lint
npm start
```

## Conectar WhatsApp (Twilio)

1. Crea cuenta en [Twilio](https://www.twilio.com/) y activa el **WhatsApp Sandbox** (o un número de producción).
2. Copia `.env.example` → `.env` y completa:

   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM` (ej. `whatsapp:+14155238886` en sandbox)
   - `ALLOWED_WHATSAPP_NUMBERS` (tu celular, ej. `whatsapp:+5215512345678`)
   - `GITHUB_TOKEN` (lectura de repos)
   - `PUBLIC_URL` (URL pública con HTTPS, ej. Render o ngrok)

3. Expón el servidor y configura en Twilio la URL del webhook:

   ```
   POST https://TU-DOMINIO/webhook/whatsapp
   ```

4. En el sandbox de Twilio, envía el código de unión desde tu WhatsApp al número de Twilio.

5. Escribe `hola` o `estado` desde el celular.

## Avisos automáticos (GitHub)

En cada repo (o en la org), crea un webhook:

- **URL:** `https://TU-DOMINIO/webhook/github`
- **Content type:** `application/json`
- **Events:** Push, Pull requests, Workflow runs
- **Secret:** el mismo que `GITHUB_WEBHOOK_SECRET` en `.env`

Edita `config/projects.json` para agregar proyectos:

```json
{
  "owner": "tu-usuario-o-org",
  "projects": [
    {
      "id": "mi-app",
      "repo": "mi-app",
      "label": "Mi App",
      "notifyOn": ["push", "pull_request", "workflow_run"]
    }
  ]
}
```

## Despliegue (Render / Railway / VPS)

```bash
npm start
```

Variables de entorno: las de `.env.example`. El proceso debe escuchar en `PORT` (por defecto 3000).

## Arquitectura

```
Celular (WhatsApp)
       ↕ Twilio
  POST /webhook/whatsapp  →  agent.js  →  github.js
       ↕
GitHub webhooks
  POST /webhook/github    →  notificación a ALLOWED_WHATSAPP_NUMBERS
```

## Seguridad

- Solo números en `ALLOWED_WHATSAPP_NUMBERS` pueden consultar (si la lista está vacía, acepta cualquier número — solo para desarrollo).
- Valida firma Twilio cuando `TWILIO_AUTH_TOKEN` está definido.
- Valida firma HMAC del webhook de GitHub cuando `GITHUB_WEBHOOK_SECRET` está definido.

import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import { handleIncomingMessage, formatGitHubEventNotification } from "./agent.js";
import {
  isAllowedSender,
  sendWhatsApp,
  validateTwilioSignature,
  broadcastToAllowed,
} from "./whatsapp.js";
import { findProject, getOwner, listProjects } from "./projects.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "proyecto-whatsapp-agent",
    projects: listProjects().length,
  });
});

app.post("/webhook/whatsapp", async (req, res) => {
  try {
    if (!validateTwilioSignature(req)) {
      return res.status(403).send("Firma Twilio inválida");
    }

    const from = req.body.From;
    const incoming = req.body.Body ?? "";

    if (!isAllowedSender(from)) {
      await sendWhatsApp(from, "⛔ Número no autorizado. Contacta al administrador.");
      return res.type("text/xml").send(emptyTwiml());
    }

    const reply = await handleIncomingMessage(incoming);
    await sendWhatsApp(from, reply);
    res.type("text/xml").send(emptyTwiml());
  } catch (err) {
    console.error("[whatsapp webhook]", err);
    res.status(500).send("Error interno");
  }
});

app.post("/webhook/github", async (req, res) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers["x-hub-signature-256"];
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");
      if (sig !== expected) {
        return res.status(401).send("Webhook no autorizado");
      }
    }

    const event = req.headers["x-github-event"];
    const repoName = req.body.repository?.name;
    const owner = req.body.repository?.owner?.login ?? getOwner();

    const tracked = listProjects().find((p) => p.repo === repoName && getOwner() === owner);
    if (!tracked) {
      return res.status(200).send("ignored");
    }

    const notifyEvents = tracked.notifyOn ?? ["push", "pull_request", "workflow_run"];
    if (!notifyEvents.includes(event)) {
      return res.status(200).send("ignored");
    }

    const message = await formatGitHubEventNotification(event, req.body);
    await broadcastToAllowed(`📁 *${tracked.label}*\n\n${message}`);
    res.status(200).send("ok");
  } catch (err) {
    console.error("[github webhook]", err);
    res.status(500).send("error");
  }
});

function emptyTwiml() {
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

app.listen(PORT, () => {
  console.log(`Agente WhatsApp escuchando en http://0.0.0.0:${PORT}`);
  console.log(`  Webhook WhatsApp: POST /webhook/whatsapp`);
  console.log(`  Webhook GitHub:   POST /webhook/github`);
  console.log(`  Proyectos:        ${listProjects().map((p) => p.id).join(", ")}`);
});

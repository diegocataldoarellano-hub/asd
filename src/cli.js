#!/usr/bin/env node
/**
 * Simula una conversación WhatsApp sin Twilio (desarrollo / demo).
 * Uso: npm run chat -- "proyectos"
 *      npm run chat -- "estado asd"
 */
import "dotenv/config";
import { handleIncomingMessage } from "./agent.js";

const message = process.argv.slice(2).join(" ") || "ayuda";

console.log("📱 Usuario:", message);
console.log("—".repeat(40));
const reply = await handleIncomingMessage(message);
console.log(reply);

import twilio from "twilio";

let client;

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN son requeridos para enviar WhatsApp.");
    }
    client = twilio(sid, token);
  }
  return client;
}

export function getAllowedNumbers() {
  const raw = process.env.ALLOWED_WHATSAPP_NUMBERS ?? "";
  return raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
}

export function isAllowedSender(from) {
  const allowed = getAllowedNumbers();
  if (!allowed.length) {
    // Sin lista = modo desarrollo (acepta cualquiera; documentar en README)
    return true;
  }
  return allowed.some((n) => from === n || from.replace("whatsapp:", "") === n.replace("whatsapp:", ""));
}

export async function sendWhatsApp(to, body) {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error("TWILIO_WHATSAPP_FROM no configurado.");
  }
  const tw = getClient();
  const chunks = splitMessage(body, 1500);
  const results = [];
  for (const chunk of chunks) {
    results.push(
      await tw.messages.create({
        from,
        to,
        body: chunk,
      })
    );
  }
  return results;
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.5) cut = maxLen;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

export function validateTwilioSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true;
  const signature = req.headers["x-twilio-signature"];
  if (!signature) return false;
  const url = process.env.PUBLIC_URL
    ? `${process.env.PUBLIC_URL.replace(/\/$/, "")}${req.originalUrl}`
    : `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return twilio.validateRequest(authToken, signature, url, req.body);
}

export async function broadcastToAllowed(text) {
  const numbers = getAllowedNumbers();
  if (!numbers.length) {
    console.warn("[whatsapp] ALLOWED_WHATSAPP_NUMBERS vacío — no se envía broadcast.");
    return [];
  }
  return Promise.all(numbers.map((to) => sendWhatsApp(to, text)));
}

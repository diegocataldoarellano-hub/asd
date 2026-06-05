export function getConfigStatus() {
  const twilioOk =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_WHATSAPP_FROM);

  const phones = (process.env.ALLOWED_WHATSAPP_NUMBERS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  return {
    twilio: twilioOk,
    whatsappNumbers: phones.length,
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    publicUrl: process.env.PUBLIC_URL ?? null,
    githubWebhookSecret: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    readyForWhatsApp: twilioOk && phones.length > 0,
  };
}

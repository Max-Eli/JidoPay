import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM;

function getClient() {
  if (!apiKey) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY.");
  }
  return new Resend(apiKey);
}

export function isEmailConfigured() {
  return !!(apiKey && fromAddress);
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!fromAddress) {
    return { ok: false, error: "EMAIL_FROM is not set" };
  }
  try {
    const res = await getClient().emails.send({
      from: fromAddress,
      to,
      subject,
      text: text ?? "",
      html,
      replyTo,
    });
    if (res.error) {
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

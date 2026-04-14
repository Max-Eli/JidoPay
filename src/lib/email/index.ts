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
  fromName,
  headers,
  tags,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  /** Display name prepended to EMAIL_FROM. e.g. "Sarah's Cakes". */
  fromName?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!fromAddress) {
    return { ok: false, error: "EMAIL_FROM is not set" };
  }
  // Render From header as `"Display Name" <support@jidopay.com>` when we
  // have a merchant-chosen display name, so inbox clients surface the
  // merchant's brand instead of a generic support address.
  const from = fromName
    ? `${sanitizeFromName(fromName)} <${stripAngleAddress(fromAddress)}>`
    : fromAddress;
  try {
    const res = await getClient().emails.send({
      from,
      to,
      subject,
      text: text ?? "",
      html,
      replyTo,
      headers,
      tags,
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

/** Strip characters that would break a quoted display name in an RFC5322 header. */
function sanitizeFromName(name: string): string {
  const cleaned = name.replace(/[\r\n"<>]/g, "").trim();
  // Always quote so commas/parens in business names don't split the header.
  return `"${cleaned || "JidoPay"}"`;
}

/** EMAIL_FROM may already be in "Name <addr>" form; pull just the bare address. */
function stripAngleAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return match ? match[1] : value;
}

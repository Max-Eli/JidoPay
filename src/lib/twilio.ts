import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }
  return twilio(accountSid, authToken);
}

export function isTwilioConfigured() {
  return !!(accountSid && authToken && fromNumber);
}

export async function sendSms({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<{ ok: true; sid: string } | { ok: false; error: string }> {
  if (!fromNumber) {
    return { ok: false, error: "TWILIO_PHONE_NUMBER is not set" };
  }
  try {
    const msg = await getClient().messages.create({
      from: fromNumber,
      to,
      body,
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

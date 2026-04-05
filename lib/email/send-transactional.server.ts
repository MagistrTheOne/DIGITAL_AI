/**
 * Resend-backed transactional mail. Shared by auth OTP flows and marketing contact.
 */
export async function sendTransactionalEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "NULLXES <no-reply@nullxes.com>";

  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY required in production");
    }

    console.log(
      `[EMAIL:DEV] → ${recipients.join(", ")}\nReply-To: ${input.replyTo ?? "(none)"}\n${input.subject}\n${input.text}`,
    );
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const payload: Record<string, unknown> = {
      from,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    if (input.replyTo?.trim()) {
      payload.reply_to = input.replyTo.trim();
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

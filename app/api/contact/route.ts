import { NextResponse } from "next/server";
import { z } from "zod";

import { sendTransactionalEmail } from "@/lib/email/send-transactional.server";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  topic: z.enum([
    "general",
    "partnerships",
    "enterprise",
    "govtech",
    "other",
  ]),
  message: z.string().trim().min(10).max(8000),
  /** Honeypot — must stay empty */
  website: z.string().optional(),
});

function contactRecipients(): string[] {
  const raw = process.env.CONTACT_FORM_TO?.split(/[,;]/).map((s) => s.trim());
  if (raw?.length) {
    return raw.filter(Boolean);
  }
  return ["devpos@nullxes.com", "ceo@nullxes.com"];
}

const TOPIC_LABEL: Record<z.infer<typeof bodySchema>["topic"], string> = {
  general: "General",
  partnerships: "Partnerships",
  enterprise: "Enterprise",
  govtech: "GovTech",
  other: "Other",
};

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form fields and try again." },
      { status: 400 },
    );
  }

  const { name, email, topic, message, website } = parsed.data;
  if (website && website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const topicLabel = TOPIC_LABEL[topic];
  const subject = `NULLXES contact · ${topicLabel} · ${name}`;

  const text = [
    `Topic: ${topicLabel}`,
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ].join("\n");

  const html = `
<p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<hr />
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
`.trim();

  try {
    await sendTransactionalEmail({
      to: contactRecipients(),
      subject,
      html,
      text,
      replyTo: email,
    });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json(
      { error: "Could not send right now. Please email us directly." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}

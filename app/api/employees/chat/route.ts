import { NextResponse } from "next/server";

import {
  runEmployeeOpenAiChatTurn,
  validateImageDataUrls,
  type EmployeeChatWireMessage,
} from "@/lib/openai/employee-chat.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
} from "@/services/db/repositories/employees.repository";
import { recordChatTurnTelemetry } from "@/services/db/repositories/telemetry.repository";

const MAX_MESSAGES = 40;
const MAX_CONTENT_LEN = 12_000;

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    employeeId?: string;
    /** OpenAI transcript tab id (localStorage) — ties turns to one `ai_sessions` row. */
    clientChatSessionId?: string;
    messages?: {
      role?: string;
      content?: string;
      images?: unknown;
    }[];
  };

  const employeeId = body?.employeeId?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const raw = body?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages: EmployeeChatWireMessage[] = [];

  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (m?.role !== "user" && m?.role !== "assistant") continue;

    const content =
      typeof m.content === "string" ? m.content.slice(0, MAX_CONTENT_LEN) : "";

    let images: string[] | undefined;
    if (Array.isArray(m.images) && m.images.length > 0) {
      if (m.role !== "user") {
        return NextResponse.json(
          { error: "Images are only allowed on user messages" },
          { status: 400 },
        );
      }
      const urls = m.images.filter((x): x is string => typeof x === "string");
      const imgErr = validateImageDataUrls(urls);
      if (imgErr) {
        return NextResponse.json({ error: imgErr }, { status: 400 });
      }
      images = urls;
    }

    const hasText = content.trim().length > 0;
    if (!hasText && !images?.length) continue;

    messages.push({
      role: m.role,
      content: hasText ? content.trim() : "",
      ...(images?.length ? { images } : {}),
    });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "No valid messages" }, { status: 400 });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from user" },
      { status: 400 },
    );
  }

  const clientChatSessionId = body?.clientChatSessionId?.trim() ?? "";
  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const roleLabel =
    row.role === "Other" &&
    typeof cfg.roleCustomTitle === "string" &&
    cfg.roleCustomTitle.trim()
      ? cfg.roleCustomTitle.trim()
      : row.role;

  const started = Date.now();
  const result = await runEmployeeOpenAiChatTurn({
    name: row.name,
    role: roleLabel,
    config: cfg,
    messages,
    userId,
  });
  const latencyMs = Math.max(0, Date.now() - started);

  if (clientChatSessionId) {
    try {
      if (result.ok) {
        await recordChatTurnTelemetry({
          userId,
          employeeId,
          clientSessionId: clientChatSessionId,
          latencyMs,
          tokensDelta: result.totalTokens ?? 0,
          success: true,
        });
      } else {
        await recordChatTurnTelemetry({
          userId,
          employeeId,
          clientSessionId: clientChatSessionId,
          latencyMs,
          tokensDelta: 0,
          success: false,
        });
      }
    } catch {
      /* telemetry must not break chat */
    }
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    content: result.content,
    model: result.model,
  });
}

import OpenAI, { APIError } from "openai";
import type {
  FileSearchTool,
  FunctionTool,
  Response as OpenAiResponse,
  ResponseFunctionToolCall,
  ResponseIncludable,
  ResponseInputContent,
  ResponseInputItem,
  ResponseOutputItem,
  SkillReference,
  Tool,
} from "openai/resources/responses/responses";

import type { EmployeeConfigJson } from "@/services/db/repositories/employees.repository";
import { listEmployeesByUser } from "@/services/db/repositories/employees.repository";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 8;
const MAX_IMAGE_URL_CHARS = 6_000_000;

function getChatModel(): string {
  const m = process.env.OPENAI_CHAT_MODEL?.trim();
  return m || DEFAULT_MODEL;
}

function webSearchEnabled(): boolean {
  return process.env.OPENAI_CHAT_WEB_SEARCH === "1";
}

function parseReasoningEffortFromEnv():
  | "low"
  | "medium"
  | "high"
  | undefined {
  const r = process.env.OPENAI_CHAT_REASONING?.trim().toLowerCase();
  if (r === "low" || r === "medium" || r === "high") return r;
  return undefined;
}

/** `reasoning.effort` is only valid on certain Responses API models (not gpt-4o-mini / gpt-4.1, etc.). */
function modelSupportsReasoningEffort(model: string): boolean {
  const m = model.trim().toLowerCase();
  if (m.includes("gpt-5")) return true;
  if (/^o[1-9]/.test(m)) return true;
  if (m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4")) return true;
  return false;
}

function reasoningForModel(
  model: string,
): { effort: "low" | "medium" | "high" } | undefined {
  const effort = parseReasoningEffortFromEnv();
  if (!effort) return undefined;
  if (!modelSupportsReasoningEffort(model)) return undefined;
  return { effort };
}

function parseShellSkillReferences(): SkillReference[] | null {
  const raw = process.env.NULLXES_CHAT_SHELL_SKILLS?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const out: SkillReference[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && item.trim()) {
        out.push({ type: "skill_reference", skill_id: item.trim() });
        continue;
      }
      if (item && typeof item === "object" && "skill_id" in item) {
        const skill_id = String(
          (item as { skill_id: unknown }).skill_id,
        ).trim();
        if (!skill_id) continue;
        const ref: SkillReference = { type: "skill_reference", skill_id };
        const v = (item as { version?: unknown }).version;
        if (v !== undefined && v !== null) {
          ref.version =
            typeof v === "number" && Number.isFinite(v)
              ? String(v)
              : String(v);
        }
        out.push(ref);
      }
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

function parseVectorStoreIds(): string[] {
  const raw = process.env.NULLXES_CHAT_VECTOR_STORE_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFileSearchMaxResults(): number | undefined {
  const raw = process.env.NULLXES_CHAT_FILE_SEARCH_MAX_RESULTS?.trim();
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) return undefined;
  return n;
}

function fileSearchIncludeResultsEnabled(): boolean {
  return process.env.NULLXES_CHAT_FILE_SEARCH_INCLUDE_RESULTS === "1";
}

function buildResponseInclude(vectorStoreIds: string[]): ResponseIncludable[] | undefined {
  if (!vectorStoreIds.length || !fileSearchIncludeResultsEnabled()) return undefined;
  return ["file_search_call.results"];
}

function buildInstructions(
  name: string,
  role: string,
  cfg: EmployeeConfigJson,
): string {
  const extra =
    typeof cfg.prompt === "string" && cfg.prompt.trim()
      ? `\n\nCharacter and behavior (from workspace config):\n${cfg.prompt.trim()}`
      : "";
  return (
    `You are "${name}", a digital employee on the NULLXES AI workforce platform.\n` +
    `Your role category: ${role}.\n` +
    `Stay in character. Be concise, accurate, and professional.\n` +
    `You are an agent: you may call tools when they improve factual accuracy — ` +
    `use workspace/product tools for NULLXES and ARACHNE-X facts; ` +
    `use web search only when the user needs fresh public information (news, prices, dates).\n` +
    `When the user attaches images, describe and reason about them in character.${extra}`
  );
}

/** Shared persona text for transcript chat and Realtime voice sessions. */
export function buildEmployeeSystemPrompt(
  name: string,
  role: string,
  cfg: EmployeeConfigJson,
): string {
  return buildInstructions(name, role, cfg);
}

function isFunctionCall(o: ResponseOutputItem): o is ResponseFunctionToolCall {
  return (o as { type?: string }).type === "function_call";
}

function buildAgentTools(): Tool[] {
  const tools: Tool[] = [
    {
      type: "function",
      name: "nullxes_workspace_facts",
      description:
        "Returns vetted product facts about NULLXES, ARACHNE-X, and the digital workforce platform. Call when explaining what the company or stack does.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: ["overview", "realtime", "security"],
            description: "Which aspect to emphasize.",
          },
        },
        required: ["focus"],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function",
      name: "employee_profile_snapshot",
      description:
        "Returns the current session employee display name and role from the server. Use for self-introduction or when asked who you are in this session.",
      parameters: {
        type: "object",
        properties: {
          query_scope: {
            type: "string",
            enum: ["current_employee"],
            description: "Always pass current_employee.",
          },
        },
        required: ["query_scope"],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function",
      name: "list_team_employees",
      description:
        "Lists other digital employees in the signed-in user's workspace (names and roles). Use when the user asks who else is on the team or available.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Max rows to return (1–25 inclusive).",
            minimum: 1,
            maximum: 25,
          },
        },
        required: ["limit"],
        additionalProperties: false,
      },
      strict: true,
    },
  ];

  const shellSkills = parseShellSkillReferences();
  if (shellSkills?.length) {
    const model = getChatModel();
    if (!/^gpt-5/i.test(model)) {
      console.warn(
        "[employee-chat] NULLXES_CHAT_SHELL_SKILLS is set; hosted shell + skills usually needs a capable model (e.g. gpt-5.4). Current OPENAI_CHAT_MODEL:",
        model,
      );
    }
    tools.push({
      type: "shell",
      environment: {
        type: "container_auto",
        skills: shellSkills,
      },
    });
  }

  const vectorStoreIds = parseVectorStoreIds();
  if (vectorStoreIds.length) {
    const fileSearch: FileSearchTool = {
      type: "file_search",
      vector_store_ids: vectorStoreIds,
    };
    const maxNum = parseFileSearchMaxResults();
    if (maxNum !== undefined) fileSearch.max_num_results = maxNum;
    tools.push(fileSearch);
  }

  if (webSearchEnabled()) {
    tools.push({ type: "web_search" });
  }

  return tools;
}

type ToolContext = {
  employeeName: string;
  employeeRole: string;
  userId?: string;
};

async function executeToolCall(
  name: string,
  argsJson: string,
  ctx: ToolContext,
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    if (argsJson) args = JSON.parse(argsJson) as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: "invalid_json_arguments" });
  }

  switch (name) {
    case "nullxes_workspace_facts": {
      const focus = typeof args.focus === "string" ? args.focus : "overview";
      const base = {
        company: "NULLXES",
        product: "Unified digital workforce / AI employees platform",
        engine: "ARACHNE-X",
        engine_role:
          "Realtime orchestration: sessions, WebSocket transport, avatar and chat signals for dashboard experiences.",
        note: "Facts are static context; verify time-sensitive claims with web search if enabled.",
      };
      if (focus === "realtime") {
        return JSON.stringify({
          ...base,
          realtime:
            "Dashboard line B: mint token via HTTP, connect WebSocket, exchange chat.send / chat.message.received and session lifecycle events.",
        });
      }
      if (focus === "security") {
        return JSON.stringify({
          ...base,
          security:
            "API keys stay server-side; browser uses session cookies; employee chat is scoped per authenticated user in the workspace.",
        });
      }
      return JSON.stringify(base);
    }
    case "employee_profile_snapshot": {
      void args.query_scope;
      return JSON.stringify({
        displayName: ctx.employeeName,
        roleCategory: ctx.employeeRole,
      });
    }
    case "list_team_employees": {
      if (!ctx.userId) {
        return JSON.stringify({ error: "not_available", hint: "No user context." });
      }
      const rawLimit = args.limit;
      const limit =
        typeof rawLimit === "number" && rawLimit >= 1 && rawLimit <= 25
          ? Math.floor(rawLimit)
          : 12;
      const rows = await listEmployeesByUser(ctx.userId);
      const slice = rows.slice(0, limit).map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role_label,
      }));
      return JSON.stringify({ count: rows.length, employees: slice });
    }
    default:
      return JSON.stringify({ error: "unknown_tool", name });
  }
}

function userMessageToInputItem(
  content: string,
  images?: string[],
): ResponseInputItem {
  const text = content.trim() || "(attached image)";
  if (!images?.length) {
    return { role: "user", content: text };
  }

  const parts: ResponseInputContent[] = [
    { type: "input_text", text },
    ...images.map(
      (url) =>
        ({
          type: "input_image",
          image_url: url,
          detail: "auto",
        }) as ResponseInputContent,
    ),
  ];
  return { role: "user", content: parts };
}

function transcriptToInputItems(
  messages: EmployeeChatWireMessage[],
): ResponseInputItem[] {
  const out: ResponseInputItem[] = [];
  for (const m of messages) {
    if (m.role === "assistant") {
      out.push({ role: "assistant", content: m.content.trim() });
      continue;
    }
    out.push(userMessageToInputItem(m.content, m.images));
  }
  return out;
}

export type EmployeeChatWireMessage = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

export type EmployeeChatTurnInput = {
  name: string;
  role: string;
  config: EmployeeConfigJson;
  messages: EmployeeChatWireMessage[];
  userId?: string;
};

export type EmployeeChatTurnResult =
  | { ok: true; content: string; model: string; totalTokens?: number }
  | { ok: false; status: number; error: string };

export async function runEmployeeOpenAiChatTurn(
  input: EmployeeChatTurnInput,
): Promise<EmployeeChatTurnResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "Transcript assistant is not configured (missing API key).",
    };
  }

  const client = new OpenAI({ apiKey });
  const model = getChatModel();
  const instructions = buildInstructions(input.name, input.role, input.config);
  const tools = buildAgentTools();
  const reasoning = reasoningForModel(model);
  const vectorStoreIds = parseVectorStoreIds();
  const responseInclude = buildResponseInclude(vectorStoreIds);

  const toolCtx: ToolContext = {
    employeeName: input.name,
    employeeRole: input.role,
    userId: input.userId,
  };

  let previousResponseId: string | null = null;
  let followUpInput: ResponseInputItem[] | null = null;
  let totalTokensAcc = 0;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const body: Parameters<typeof client.responses.create>[0] = previousResponseId
        ? {
            model,
            previous_response_id: previousResponseId,
            input: followUpInput ?? [],
            tools,
            max_output_tokens: 4096,
            store: true,
            stream: false,
          }
        : {
            model,
            instructions,
            tools,
            input: transcriptToInputItems(input.messages),
            max_output_tokens: 4096,
            store: true,
            stream: false,
            ...(reasoning ? { reasoning } : {}),
          };

      const response = (await client.responses.create(
        body,
      )) as OpenAiResponse;

      const roundUsage = response.usage?.total_tokens;
      if (typeof roundUsage === "number" && Number.isFinite(roundUsage)) {
        totalTokensAcc += roundUsage;
      }

      if (response.error) {
        return {
          ok: false,
          status: 502,
          error:
            typeof response.error === "object" &&
            response.error &&
            "message" in response.error
              ? String((response.error as { message?: string }).message)
              : "Model returned an error.",
        };
      }

      previousResponseId = response.id;

      const calls = response.output.filter(isFunctionCall);
      if (calls.length === 0) {
        const content = (response.output_text ?? "").trim();
        if (!content) {
          return {
            ok: false,
            status: 502,
            error: "Empty model output.",
          };
        }
        return {
          ok: true,
          content,
          model,
          ...(totalTokensAcc > 0 ? { totalTokens: totalTokensAcc } : {}),
        };
      }

      const outputs: ResponseInputItem[] = [];
      for (const call of calls) {
        const out = await executeToolCall(call.name, call.arguments, toolCtx);
        outputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: out,
        });
      }
      followUpInput = outputs;
    }

    return {
      ok: false,
      status: 502,
      error: "Tool loop limit reached.",
    };
  } catch (e) {
    if (e instanceof APIError) {
      return {
        ok: false,
        status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502,
        error: e.message || "Transcript assistant request failed.",
      };
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, status: 502, error: msg };
  }
}

export function validateImageDataUrls(urls: string[] | undefined): string | null {
  if (!urls?.length) return null;
  if (urls.length > 4) return "At most 4 images per message.";
  const re = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
  for (const u of urls) {
    if (typeof u !== "string" || !re.test(u)) {
      return "Invalid image format (use PNG, JPEG, WebP, or GIF as data URLs).";
    }
    if (u.length > MAX_IMAGE_URL_CHARS) {
      return "Image payload too large.";
    }
  }
  return null;
}

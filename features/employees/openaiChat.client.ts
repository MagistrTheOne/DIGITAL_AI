export type OpenAiTranscriptMessage = {
  role: "user" | "assistant";
  content: string;
  /** data:image/...;base64,... — vision ([images and vision](https://developers.openai.com/api/docs/guides/images-vision)) */
  images?: string[];
};

export async function postEmployeeOpenAiChat(input: {
  employeeId: string;
  messages: OpenAiTranscriptMessage[];
}): Promise<{ content: string }> {
  const res = await fetch("/api/employees/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: input.employeeId,
      messages: input.messages,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    content?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Chat request failed (${res.status})`);
  }

  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (!content) {
    throw new Error("Empty assistant reply");
  }

  return { content };
}

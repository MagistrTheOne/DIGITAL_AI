export type InteractionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** data:image/...;base64,... для vision-туров (только user). */
  imageUrls?: string[];
  /** Сообщение только для UI (не уходит в OpenAI transcript API). */
  ephemeral?: boolean;
  /** Сворачиваемый trace рассуждения (ARACHNE-X / chain-of-thought). Только у assistant. */
  thinking?: string;
  /** Для будущего SSE: частичный ответ. */
  status?: "streaming" | "complete";
};

export type VoiceUiState = "idle" | "recording" | "processing";

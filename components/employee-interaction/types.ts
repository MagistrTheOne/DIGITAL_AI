export type InteractionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Сворачиваемый trace рассуждения (ARACHNE-X / chain-of-thought). Только у assistant. */
  thinking?: string;
  /** Для будущего SSE: частичный ответ. */
  status?: "streaming" | "complete";
};

export type VoiceUiState = "idle" | "recording" | "processing";

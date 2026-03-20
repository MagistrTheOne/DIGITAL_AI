export type InteractionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type VoiceUiState = "idle" | "recording" | "processing";

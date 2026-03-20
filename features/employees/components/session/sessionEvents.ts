export type EmployeeSessionEvent =
  | { type: "session.connecting"; at: number }
  | { type: "session.connected"; at: number }
  | { type: "session.disconnected"; at: number; reason?: string }
  | { type: "session.error"; at: number; message: string }
  | { type: "avatar.state.changed"; at: number; state: string }
  | { type: "chat.message.received"; at: number; message: string; from: string };


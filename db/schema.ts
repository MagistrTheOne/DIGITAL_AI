/**
 * Better Auth core schema (PostgreSQL / Drizzle).
 * Replaces the previous standalone `users` table — run migrations after pulling.
 * @see https://www.better-auth.com/docs/concepts/database
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** pgvector column; `toDriver` serializes for PostgreSQL `vector(1536)`. */
const vector1536 = customType<{ data: number[] }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** Optional company / team label collected at sign-up. */
  organization: text("organization"),
  /** Assignment only; limits/features live in `features/account/plan-config.ts`. */
  planType: text("plan_type").notNull().default("FREE"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * Subscription rows for billing providers (Polar, Stripe, …).
 * `plan_type` is assignment; behavior comes from plan-config.
 */
export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planType: text("plan_type").notNull(),
    status: text("status").notNull(),
    provider: text("provider"),
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscription_userId_idx").on(table.userId),
    index("subscription_provider_external_idx").on(
      table.provider,
      table.externalId,
    ),
  ],
);

/**
 * AI workforce sessions — telemetry source for analytics (event-sourced lifecycle).
 */
export const aiSession = pgTable(
  "ai_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: text("employee_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    latencyMs: integer("latency_ms"),
    success: boolean("success"),
    tokensUsed: integer("tokens_used").notNull().default(0),
    costSavedCents: integer("cost_saved_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_sessions_user_started_idx").on(table.userId, table.startedAt),
    index("ai_sessions_user_employee_idx").on(table.userId, table.employeeId),
    index("ai_sessions_user_ended_idx").on(table.userId, table.endedAt),
  ],
);

/**
 * Fine-grained usage / inference events for rates and future rollups.
 */
export const usageEvent = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => aiSession.id, {
      onDelete: "set null",
    }),
    /** Populated for chat telemetry; backfilled from `ai_sessions` for legacy rows. */
    employeeId: text("employee_id"),
    eventType: text("event_type").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_events_user_created_idx").on(table.userId, table.createdAt),
    index("usage_events_session_idx").on(table.sessionId),
    index("usage_events_user_employee_created_idx").on(
      table.userId,
      table.employeeId,
      table.createdAt,
    ),
  ],
);

/**
 * Optional daily rollups for fast dashboards / billing reconciliation.
 */
export const aiMetricsDaily = pgTable(
  "ai_metrics_daily",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day", { mode: "date" }).notNull(),
    sessionsCount: integer("sessions_count").notNull().default(0),
    tokensTotal: bigint("tokens_total", { mode: "number" }).notNull().default(0),
    costSavedCents: bigint("cost_saved_cents", { mode: "number" })
      .notNull()
      .default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_metrics_daily_user_day_uq").on(table.userId, table.day),
    index("ai_metrics_daily_user_day_idx").on(table.userId, table.day),
  ],
);

/**
 * AI employees (digital workforce) — scoped per user; behavior in `config` JSONB.
 */
export const employee = pgTable(
  "employees",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    config: jsonb("config")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("employees_user_idx").on(table.userId)],
);

/**
 * Per-employee integrations (e.g. client HTTP API with stored secret).
 * `config` holds non-secret JSON; `secret_ciphertext` is app-encrypted.
 */
export const employeeIntegration = pgTable(
  "employee_integration",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("client_api"),
    name: text("name").notNull(),
    config: jsonb("config")
      .notNull()
      .default(sql`'{}'::jsonb`),
    secretCiphertext: text("secret_ciphertext").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("employee_integration_user_employee_idx").on(
      table.userId,
      table.employeeId,
    ),
  ],
);

/** Uploaded knowledge source per employee (chunks + embeddings live in `knowledge_chunk`). */
export const knowledgeDocument = pgTable(
  "knowledge_document",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    sourceLabel: text("source_label").notNull(),
    mime: text("mime").notNull().default("text/plain"),
    byteLength: integer("byte_length").notNull().default(0),
    chunkCount: integer("chunk_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("knowledge_document_user_employee_idx").on(
      table.userId,
      table.employeeId,
    ),
  ],
);

export const knowledgeChunk = pgTable(
  "knowledge_chunk",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => knowledgeDocument.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    embedding: vector1536("embedding").notNull(),
  },
  (table) => [
    index("knowledge_chunk_user_employee_idx").on(
      table.userId,
      table.employeeId,
    ),
  ],
);

/** Per-user AI runtime preferences (Settings UI + workers). */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  tone: text("tone").notNull().default("formal"),
  language: text("language").notNull().default("en"),
  voiceEnabled: boolean("voice_enabled").notNull().default(true),
  latencyVsQuality: integer("latency_vs_quality").notNull().default(62),
  streaming: boolean("streaming").notNull().default(true),
  avatarQuality: text("avatar_quality").notNull().default("high"),
  ttsVoice: text("tts_voice").notNull().default("nova"),
  sttModel: text("stt_model").notNull().default("whisper-large"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** User-issued API keys for programmatic access (secret stored as SHA-256 only). */
export const userApiKey = pgTable(
  "user_api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("user_api_key_userId_idx").on(table.userId),
    index("user_api_key_keyHash_idx").on(table.keyHash),
  ],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  subscriptions: many(subscription),
  aiSessions: many(aiSession),
  usageEvents: many(usageEvent),
  aiMetricsDaily: many(aiMetricsDaily),
  employees: many(employee),
  employeeIntegrations: many(employeeIntegration),
  knowledgeDocuments: many(knowledgeDocument),
  knowledgeChunks: many(knowledgeChunk),
  userSettings: one(userSettings, {
    fields: [user.id],
    references: [userSettings.userId],
  }),
  apiKeys: many(userApiKey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const aiSessionRelations = relations(aiSession, ({ one, many }) => ({
  user: one(user, {
    fields: [aiSession.userId],
    references: [user.id],
  }),
  usageEvents: many(usageEvent),
}));

export const usageEventRelations = relations(usageEvent, ({ one }) => ({
  user: one(user, {
    fields: [usageEvent.userId],
    references: [user.id],
  }),
  session: one(aiSession, {
    fields: [usageEvent.sessionId],
    references: [aiSession.id],
  }),
  employee: one(employee, {
    fields: [usageEvent.employeeId],
    references: [employee.id],
  }),
}));

export const aiMetricsDailyRelations = relations(aiMetricsDaily, ({ one }) => ({
  user: one(user, {
    fields: [aiMetricsDaily.userId],
    references: [user.id],
  }),
}));

export const employeeRelations = relations(employee, ({ one, many }) => ({
  user: one(user, {
    fields: [employee.userId],
    references: [user.id],
  }),
  integrations: many(employeeIntegration),
  knowledgeDocuments: many(knowledgeDocument),
}));

export const employeeIntegrationRelations = relations(
  employeeIntegration,
  ({ one }) => ({
    user: one(user, {
      fields: [employeeIntegration.userId],
      references: [user.id],
    }),
    employee: one(employee, {
      fields: [employeeIntegration.employeeId],
      references: [employee.id],
    }),
  }),
);

export const knowledgeDocumentRelations = relations(
  knowledgeDocument,
  ({ one, many }) => ({
    user: one(user, {
      fields: [knowledgeDocument.userId],
      references: [user.id],
    }),
    employee: one(employee, {
      fields: [knowledgeDocument.employeeId],
      references: [employee.id],
    }),
    chunks: many(knowledgeChunk),
  }),
);

export const knowledgeChunkRelations = relations(knowledgeChunk, ({ one }) => ({
  user: one(user, {
    fields: [knowledgeChunk.userId],
    references: [user.id],
  }),
  employee: one(employee, {
    fields: [knowledgeChunk.employeeId],
    references: [employee.id],
  }),
  document: one(knowledgeDocument, {
    fields: [knowledgeChunk.documentId],
    references: [knowledgeDocument.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const userApiKeyRelations = relations(userApiKey, ({ one }) => ({
  user: one(user, {
    fields: [userApiKey.userId],
    references: [user.id],
  }),
}));

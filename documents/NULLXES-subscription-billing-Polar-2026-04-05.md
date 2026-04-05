# NULLXES — Subscription, limits, and Polar billing

**Document date:** 5 April 2026 (`05-04-26`).

This note describes how **plan types** (Free, Pro, Enterprise, GovTech), **usage** (sessions / tokens), and **Polar** connect in the `dai_saas` codebase. It reflects **production code paths** (SDK + webhooks + DB), not stubs.

---

## 1. “API summary” — what the Settings → Billing card shows

The dashboard **Billing** block is driven by the **Settings BFF** (`getSettingsDTO` in [`features/settings/service.server.ts`](../features/settings/service.server.ts)). The client reads it via settings context; the relevant shape is [`SettingsBillingDTO`](../features/settings/types.ts):

| Field | Meaning |
|--------|---------|
| `planType` | `FREE` \| `PRO` \| `ENTERPRISE` \| `GOVTECH` |
| `planLabel` | Human label from plan config (e.g. `"GovTech"`, `"Pro"`) |
| `sessionsUsed` | Count of AI sessions in the **rolling 30 days** |
| `sessionsLimit` | Cap from plan; **`-1`** means unlimited (UI shows **∞**) |
| `tokensUsed` | Sum of `tokens_used` on those sessions (30d window) |
| `tokensLimit` | Cap from plan; **`-1`** = unlimited (**∞** in UI) |
| `polarProCheckoutEnabled` | `true` if Polar token + at least one Pro product id is configured |
| `polarEnterpriseCheckoutEnabled` | `true` if Polar token + Enterprise product id |
| `polarPortalEnabled` | `true` if Polar access token is set (portal session creation) |

**Example display (matches product UI):**

- **Plan:** badge = `planLabel` (e.g. `GovTech`).
- **Sessions:** `{sessionsUsed} / {sessionsLimit === -1 ? "∞" : sessionsLimit}` — see [`BillingSection`](../components/settings/BillingSection.tsx) (`formatSessionLimit`).
- **Tokens:** formatted with [`formatTokens`](../lib/utils/format.ts); limit `∞` when `tokensLimit === -1`.

**Usage source:** [`getUsageForUser`](../services/db/repositories/usage.repository.ts) aggregates from `ai_sessions` where `started_at >= now - 30 days`.

---

## 2. Plan definitions (limits and features)

**Single source of truth:** [`features/account/plan-config.ts`](../features/account/plan-config.ts) → `PLANS` for each [`PlanType`](../features/account/types.ts).

| Plan | Label | Sessions | Tokens | Employees | Notes |
|------|-------|----------|--------|-----------|--------|
| `FREE` | Free | 10 | 500_000 | 2 | Default when no granting subscription |
| `PRO` | Pro | 100 | 5_000_000 | 15 | Sold via Polar Pro product(s) |
| `ENTERPRISE` | Enterprise | ∞ (`-1`) | ∞ | ∞ | Polar Enterprise product **or** manual assignment |
| `GOVTECH` | GovTech | ∞ | ∞ | ∞ | **Not** mapped from Polar product ids in code today |

**Tier merge:** If a user could have multiple rows, [`highestPlanType`](../features/account/plan-config.ts) ranks `FREE < PRO < ENTERPRISE < GOVTECH`.

---

## 3. How the effective plan is resolved (no abstraction layer over “what plan am I?”)

1. [`getUserPlanType`](../services/db/repositories/user-plan.repository.ts) / `resolveUserPlanType`:
   - Loads `subscription` rows for the user with status **`active`** or **`trialing`**.
   - For each row, reads `subscription.plan_type` (string) and parses via [`planTypeFromString`](../features/account/plan-config.ts) (`FREE`, `PRO`, `ENTERPRISE`, `GOVTECH`).
   - Picks the **highest** tier among those rows.
   - If none grant a plan, falls back to **`user.plan_type`** on the Better Auth user row, then default **`FREE`**.

2. [`getPlanForUser`](../services/db/repositories/billing.repository.ts) returns [`getPlanConfig(planType)`](../features/account/plan-config.ts) for limits/label/features.

Employee caps and other gates use the same `getPlanForUser` pattern (e.g. [`features/employees/service.server.ts`](../features/employees/service.server.ts)).

---

## 4. Polar integration — direct SDK + webhooks (not stubbed)

### 4.1 Environment and product mapping

**File:** [`lib/billing/polar-env.ts`](../lib/billing/polar-env.ts)

| Variable | Role |
|----------|------|
| `POLAR_ACCESS_TOKEN` | Organization access token (sandbox vs live per `POLAR_SERVER`) |
| `POLAR_SERVER` | `sandbox` (default) or `production` |
| `POLAR_WEBHOOK_SECRET` | Verifies `@polar-sh/nextjs` webhooks |
| `POLAR_PRODUCT_PRO` | Optional single Pro product id |
| `POLAR_PRODUCT_PRO_MONTHLY` / `POLAR_PRODUCT_PRO_YEARLY` | Pro price products |
| `POLAR_PRODUCT_ENTERPRISE` | Enterprise product id |

**Product id → app plan:** [`planTypeForPolarProductId`](../lib/billing/polar-env.ts) returns:

- `PRO` if `productId` matches any configured Pro id.
- `ENTERPRISE` if it matches `POLAR_PRODUCT_ENTERPRISE`.
- **`null`** otherwise (webhook logs a warning; row not upgraded).

There is **no** `POLAR_PRODUCT_GOVTECH` (or similar) in code: **GovTech is not purchasable through this Polar mapping**. Assign GovTech via DB (`user.plan_type` and/or a `subscription` row with `plan_type = 'GOVTECH'`) or extend `planTypeForPolarProductId` when a Polar product exists.

### 4.2 Checkout (self-serve Pro / Enterprise)

**Route:** [`GET /api/billing/polar/checkout`](../app/api/billing/polar/checkout/route.ts)

- Requires session.
- Query: `plan=enterprise` or default **Pro**; `period=monthly|yearly` for Pro.
- Uses **`@polar-sh/sdk`** `Polar.checkouts.create` with:
  - `externalCustomerId: session.user.id` (required for webhooks to attach the subscription to the right user).
  - `successUrl` → `/settings?checkout=success`, `returnUrl` → `/premium`.

### 4.3 Customer portal

**Route:** [`GET /api/billing/polar/portal`](../app/api/billing/polar/portal/route.ts)

- `polar.customerSessions.create({ externalCustomerId, returnUrl })` → redirect to `customerPortalUrl`.

### 4.4 Webhooks (subscription sync)

**Route:** [`POST /api/billing/polar/webhook`](../app/api/billing/polar/webhook/route.ts)

- Uses **`Webhooks` from `@polar-sh/nextjs`** when `POLAR_WEBHOOK_SECRET` is set.
- Handlers call [`upsertPolarSubscription`](../services/db/repositories/subscription.repository.ts) for create/update/active/canceled/uncanceled/revoked events.
- `upsertPolarSubscription`:
  - Resolves `userId` from **`data.customer.externalId`** (must match checkout `externalCustomerId`).
  - Maps **`data.productId`** → `PlanType` via `planTypeForPolarProductId` (only **PRO** / **ENTERPRISE** today).
  - Upserts [`subscription`](../db/schema.ts) (`id` = Polar subscription id, `provider: "polar"`, local `status` mapped from Polar).
  - Calls [`refreshUserPlanFromSubscriptions`](../services/db/repositories/subscription.repository.ts) to update **`user.plan_type`** to the best active/trialing subscription.

If `externalId` is missing or product id is unmapped, the handler **warns and skips** (no fake plan).

### 4.5 UI gating (who sees which buttons)

[`BillingSection`](../components/settings/BillingSection.tsx):

- **Upgrade to Pro:** FREE + Pro checkout configured.
- **Enterprise checkout:** FREE or PRO + Enterprise checkout configured.
- **Manage subscription:** PRO or ENTERPRISE + portal configured.

**GovTech** users do not get the Polar portal button from this logic (only PRO/ENTERPRISE). GovTech is treated as a **sales / compliance** tier in [`components/pricing/plans.ts`](../components/pricing/plans.ts) (mailto sales), not self-checkout.

---

## 5. Connecting GovTech (and Enterprise) “without abstraction”

- **Enterprise via Polar:** set `POLAR_PRODUCT_ENTERPRISE`, complete checkout; webhook writes `subscription` + refreshes `user.plan_type`.
- **GovTech today:** define limits in `PLANS.GOVTECH`; assign by persisting **`GOVTECH`** on `user.plan_type` and/or inserting a **`subscription`** row with `plan_type = 'GOVTECH'` and a granting status (e.g. `active`). No Polar product mapping required until you add one.
- **To sell GovTech on Polar later:** add env + branch in `planTypeForPolarProductId` and optionally a checkout route or separate product link.

---

## 6. File index

| Concern | Primary files |
|---------|----------------|
| Plan limits / labels | `features/account/plan-config.ts`, `features/account/types.ts` |
| Effective plan | `services/db/repositories/user-plan.repository.ts`, `billing.repository.ts` |
| Usage 30d | `services/db/repositories/usage.repository.ts` |
| Settings DTO | `features/settings/service.server.ts`, `features/settings/types.ts` |
| Billing UI | `components/settings/BillingSection.tsx` |
| Polar env + product map | `lib/billing/polar-env.ts` |
| Checkout / portal / webhook | `app/api/billing/polar/*/route.ts` |
| Subscription persistence | `services/db/repositories/subscription.repository.ts`, `db/schema.ts` → `subscription` |

---

## 7. Relation to GPU / avatar billing

Avatar preview and RunPod paths are **orthogonal** to Polar in this repo: they do not change `PlanType`. Plan limits (e.g. max employees) still come from `getPlanForUser` as documented above.

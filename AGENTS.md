# NULLXES FRONTEND ARCHITECTURE RULES (Next.js 16+)

## 🚨 Core Principle

This is NOT legacy Next.js.
Do NOT use outdated patterns from Next.js 13/14 tutorials.

Always follow latest docs from:
`node_modules/next/dist/docs/`

---

## 🧱 App Router ONLY

* Use `/app` directory (NO `/pages`)
* Use nested layouts
* Use route groups `(group)` when needed
* Use colocation (keep logic close to feature)

---

## ⚡ Server-first Architecture

Default = Server Components

Only use `"use client"` when:

* browser APIs required
* interactivity (onClick, video control, input state)
* animations / DOM manipulation

Everything else MUST stay server-side.

---

## 🧩 Component Strategy

Split into:

### 1. UI Components (pure)

* No business logic
* Reusable
* Example:

  * Button
  * Card
  * Badge

### 2. Feature Components

* Tied to business domain
* Example:

  * EmployeeCard
  * EmployeeGrid
  * EmployeeFilters

### 3. Smart / Container Components

* Handle data + orchestration
* Compose UI components

---

## 🧠 State Management

Avoid global state unless necessary.

Use:

* Server Actions (primary)
* React state (local UI only)
* URL state (filters/search)

Avoid:

* Redux (overkill)
* Context for large data

---

## 🗄️ Data Layer (NEON)

* Fetch data in Server Components
* Use async/await directly in components
* Cache with Next built-in caching

Use:

* `fetch()` with caching options
* Server Actions for mutations

---

## 🔐 Auth (Better Auth)

* Handle session on server
* Never expose sensitive logic to client
* Use middleware if needed

---

## 💳 Billing (Polar)

* All billing logic = server-side
* Webhooks handled in `/app/api/...`
* UI only reflects state

---

## 🎥 Video / Avatar System (CRITICAL)

* Video MUST be isolated

Create:

* `VideoPlayer` (client component)
* `useVideoController()` hook

Reason:
Future migration to ARACHNE-X real-time avatars

---

## 📁 Folder Structure

/app
/(dashboard)
/ai-digital
/analytics
/employees
/settings
/premium

/components
/ui
/shared

/features
/employees
/analytics
/billing
/auth

/lib
/db
/utils

/services
/external

---

## 🧼 Naming Rules

* PascalCase → Components
* camelCase → functions/hooks
* kebab-case → folders (optional consistency)

---

## ⚙️ Performance

* Avoid unnecessary client components
* Stream data where possible
* Lazy load heavy components (video, charts)

---

## 🧱 Scalability Mindset

Every feature must be:

* isolated
* replaceable
* extensible

Think:
"Can this be replaced by AI system later?"

---

## 🕷️ ARACHNE-X Compatibility (IMPORTANT)

Design everything so that:

* EmployeeCard → can switch from video → real-time avatar
* Interaction page → becomes AI session node
* No tight coupling to mp4/video logic

---

## ❌ Anti-Patterns (FORBIDDEN)

* Putting logic inside UI components
* Fetching data in client unnecessarily
* Massive global state
* Mixing concerns
* Old Next.js patterns

---

## ✅ Goal

Build a production-grade AI platform frontend
ready for:

* real-time avatars
* enterprise scaling
* modular evolution

Think like:
Stripe / Linear / Vercel-level architecture

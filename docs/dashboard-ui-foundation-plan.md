# NULLXES — Dashboard UI Foundation (Refined Plan)

## Goal

Build a clean, production-ready UI skeleton using **Next.js 16 + shadcn/ui**, with a dark neutral enterprise style.

This phase is strictly about **structure and visual consistency**, not data or business logic.

## Core Principles

- Use **shadcn/ui ONLY** for UI primitives (no custom buttons/cards/tabs).
- Follow **dark neutral palette** (Linear / Vercel style).
- Keep architecture **server-first**, client only for interaction.
- No backend/data fetching in this phase.
- Prepare UI to plug into real data later without refactor.

## Implementation (summary)

1. **Dark theme**: `html.dark`, `body.bg-neutral-950.text-neutral-200`; align `.dark` CSS variables with neutral-950/800/200.
2. **AppShell / SidebarNav / AppHeader**: neutral borders/backgrounds, minimal accents.
3. **SearchBar**: controlled `value` / `onChange`, shadcn `Input`, no router/searchParams in foundation.
4. **FilterTabs**: `Tabs`, `TabsList`, `TabsTrigger` from shadcn.
5. **static-employees.ts**: all agents `* Vantage`, no feature-layer imports.
6. **EmployeeCard**: `Card` + `Badge` + `Link`, placeholder preview, no VideoPlayer.
7. **EmployeeGrid** (client): local filter/search over static array.
8. **ai-digital/page.tsx**: Server: `AppHeader` + client `EmployeeGrid`; no `searchParams` fetch.
9. **/employees/[id]**: placeholder, no 404 for static ids.
10. **Cleanup**: do not remove `features/employees`; stop using server grid on AI Digital.

## Next phase

- BFF / `service.server.ts`, DTOs, ARACHNE runtime.

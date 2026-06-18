# AI Workplace Productivity Assistant — Build Plan

A modern SaaS-style dashboard with 5 AI tools, powered by Lovable AI Gateway. All chat history and tool outputs persist in `localStorage` (no login, no database).

## Scope

**In scope**
- Sidebar shell + 6 routes (Dashboard, Email, Notes, Planner, Research, Chat)
- 4 one-shot AI tools + 1 streaming chatbot (one conversation, browser-saved)
- Dashboard with KPI cards (derived from localStorage) and Recent Activity feed
- Lovable AI Gateway via TanStack server functions (one-shot) and `/api/chat` route (streaming)
- AI Elements for chat UI; responsible-AI footer disclaimer
- Responsive (mobile hamburger, desktop sidebar)

**Out of scope**
- Authentication, user accounts, Lovable Cloud database
- Cross-device sync, sharing, export/billing
- Real email sending, calendar integration

## Design System

Per the spec, applied via `src/styles.css` design tokens (oklch).
- Primary `#2563EB`, Secondary `#4F46E5`, Background `#F8FAFC`, Surface `#FFFFFF`, Text `#0F172A`, Border `#E2E8F0`
- Font: Inter (via `@fontsource-variable/inter`)
- Soft shadows, rounded-xl cards, generous spacing, clean SaaS aesthetic

## Routes (file → URL)

```
src/routes/
  __root.tsx                 layout: sidebar shell + <Outlet/>
  index.tsx                  /         Dashboard
  email.tsx                  /email    Smart Email Generator
  notes.tsx                  /notes    Meeting Notes Summarizer
  planner.tsx                /planner  AI Task Planner
  research.tsx               /research AI Research Assistant
  chat.tsx                   /chat     AI Chatbot
  api/chat.ts                streaming chat endpoint
```

Each route gets unique `head()` meta (title + description + og tags).

## AI Backend

- `src/lib/ai-gateway.server.ts` — Lovable AI Gateway provider helper (header `Lovable-API-Key`).
- `src/lib/ai.functions.ts` — `createServerFn` handlers:
  - `generateEmail({ purpose, recipient, tone, keyPoints })` → `{ subject, body }` via `Output.object`
  - `summarizeNotes({ notes })` → `{ summary, decisions[], actionItems[], deadlines[] }`
  - `planTasks({ tasks, hours, mode: 'daily'|'weekly' })` → `{ blocks: [{ time, label, priority }] }`
  - `researchTopic({ topic, context })` → `{ summary, insights[], recommendations[], challenges[], nextSteps[] }`
- `src/routes/api/chat.ts` — `streamText` + `toUIMessageStreamResponse` for the chatbot.
- Model: `google/gemini-3-flash-preview`. Each handler reads `process.env.LOVABLE_API_KEY` and surfaces 429/402/validation errors via toast.

## Persistence (localStorage)

`src/lib/storage.ts` — typed helpers + a `useLocalStorage<T>` hook.

Keys:
- `wpa.activity` — `Activity[]` (id, type, title, preview, createdAt) capped at 50
- `wpa.counters` — `{ emails, notes, planner, research }` for KPI cards
- `wpa.chat` — single `UIMessage[]` for the chatbot
- `wpa.drafts.<tool>` — last input/output per tool so users return to their work

Every successful tool run calls `recordActivity(...)` + increments the matching counter.

## UI Composition

- `src/components/app-sidebar.tsx` — shadcn `Sidebar` with `collapsible="icon"`, active route via `useRouterState`, items: Dashboard / Email / Notes / Planner / Research / Chatbot.
- `src/components/app-shell.tsx` — `SidebarProvider` + header (with `SidebarTrigger`) + `<Outlet/>` + footer disclaimer.
- Tool pages use a consistent two-column layout on desktop (inputs left, editable output right) and stack on mobile. Output uses `<Textarea>` so users can edit before copying. Copy-to-clipboard button on every output.
- Dashboard: 4 KPI cards (counters), Quick Actions grid (links to tools), Recent Activity list.
- Chat page: AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`) installed via `bunx ai-elements@latest add ...`. `useChat` with `id: "wpa-main"`, transport `/api/chat`, messages hydrated from `wpa.chat` and persisted on every change. "New conversation" button clears it.

## Responsible-AI Disclaimer

Persistent footer in `app-shell.tsx` + a small inline notice on each AI tool page:
> AI-generated content may contain inaccuracies. Always review before use. Do not share confidential information.

## Technical Notes

- Stack: TanStack Start (already configured), React 19, Tailwind v4, shadcn UI, Lucide.
- AI: `ai` + `@ai-sdk/react` + `@ai-sdk/openai-compatible` + AI Elements.
- Validation: `zod` for server-fn `inputValidator` and `Output.object` schemas.
- No `useEffect`+`fetch`; one-shot tools use `useMutation` (TanStack Query already in router context).
- All counters/activity reads happen client-side from localStorage (no SSR mismatch — guard with `typeof window !== "undefined"`).
- Ensure `LOVABLE_API_KEY` is provisioned before first AI call.

## Build Order

1. Install deps (`@fontsource-variable/inter`, `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod`) + AI Elements components.
2. Design tokens in `src/styles.css` + Inter font import.
3. App shell: sidebar, header, footer disclaimer, root layout.
4. `ai-gateway.server.ts` + `ai.functions.ts` + `api/chat.ts`.
5. Storage helpers + activity/counter tracking.
6. Dashboard page.
7. Email / Notes / Planner / Research pages.
8. Chat page with AI Elements.
9. Verify build, smoke-test each tool.

# Portfolio Life Planner (MVP)

A local-first planner that combines **tasks + journaling** on a single **day page**, tied to **Life Areas** (Health, Family, Finance, Learning, Community) and **Goals**. Starts as a **web app** (Next.js/React), later upgradable to PWA and native.

## Architecture (concise)
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind.
- **State:** React Query (server/cache), lightweight UI state via Zustand/Context.
- **Persistence (Phase 1):** IndexedDB via Dexie (local-first, offline by default).
- **Sync (Phase 2):** Supabase (Postgres + RLS) or Firebase. JSON export/import before sync.
- **Routing:** `/` Month Calendar → `/day/[date]` Day page.

## Core Objects
- **LifeArea** → **Goal** → **Project** → **Task**, plus **JournalEntry** and **DaySummary**.
- **Life Areas**: Health, Friends & Family, Community, Self-Development, Career, Play & Creativity
- Tasks belong to a LifeArea, may link to a Goal/Project, and can be **scheduled** to a date.

## MVP Scope
1. Month Calendar → click into Day page.
2. Day page shows **TaskList** (add/edit/complete) + **JournalEditor** (autosave).
3. Color by LifeArea; simple filters; data persists locally.

## Working with Cursor
Use **small, focused prompts** with acceptance criteria. Always specify:
- *Files allowed to change*, *acceptance checks* (typecheck passes, data persists), and a *file tree* summary.

See `/docs/spec.md` for details and stepwise build prompts.

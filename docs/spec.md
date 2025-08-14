# Product Spec (Pinned)

## Goal
Ship a web MVP that lets a user (1) plan and journal each day on one page, (2) link tasks to long-term goals and life areas, and (3) view weekly balance across life areas.

## Data Model (summary)
**LifeArea** { id, name, color, order }  
**Goal** { id, lifeAreaId, title, targetDate?, status }  
**Project** { id, goalId, title, status }  
**Task** { id, lifeAreaId, goalId?, projectId?, title, notes?, priority?, estimatedMinutes?, scheduledDate?, completedAt?, tags[] }  
**JournalEntry** { id, date, content, mood? }  
**DaySummary** { date, reflection?, energyLevel?, score? }

## Pages & Routes
- `/` → Month Calendar (dots by LifeArea; click day → `/day/[date]`).
- `/day/[date]` → TaskList (for scheduledDate==date) + JournalEditor (autosave).
- `/goals` (later) → Manage Goals; link tasks to goals.
- `/settings` (later) → JSON export/import.

## Components
- `CalendarMonth`, `TaskList`, `TaskItem`, `TaskQuickAdd`, `JournalEditor`, `GoalProgress`, `WeeklyBalance`, `FilterBar`.

## Stack
- Next.js + React + TypeScript + Tailwind  
- Dexie (IndexedDB) local-first; Supabase (later)  
- date-fns; lucide-react icons

## MVP Acceptance (definition of done)
- Create/edit/complete tasks and journal entries on a Day page; data persists across reloads.
- Calendar navigates to Day pages.
- LifeArea colors visible; minimal filters; `npm run typecheck` passes.

## Cursor Step Prompts (copy-paste)
**0) Scaffold**  
Create Next.js + TS + Tailwind; strict TS; scripts: dev/build/lint/typecheck.  
**Files allowed:** new project files.  
**Checks:** boots at `/`, Tailwind styles render.

**1) Dexie DB**  
Implement tables: lifeAreas, goals, projects, tasks, journalEntries, daySummaries with indexes; export CRUD/query helpers.  
**Files:** `src/lib/db.ts`, `src/types/*.ts`.  
**Checks:** typecheck passes; seed inserts 3 LifeAreas.

**2) Calendar → Day**  
Month grid at `/`; click cells → `/day/[date]`.  
**Files:** `src/app/page.tsx`, `src/components/CalendarMonth.tsx`.  
**Checks:** navigation works.

**3) Day Page Core**  
Two-pane layout: TaskList + JournalEditor with autosave and optimistic updates.  
**Files:** `src/app/day/[date]/page.tsx`, `src/components/TaskList.tsx`, `src/components/JournalEditor.tsx`.  
**Checks:** tasks/journal persist across reloads.

(Keep further steps—QuickAdd, Goals, WeeklyBalance, Export/Import—in issues.)

## Conventions
- UUID ids; `createdAt/updatedAt` timestamps.  
- Keep prompts small; list allowed files; require file-tree output.

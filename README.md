# Prompting Under Pressure Platform

This repository contains the experimental “Prompting Under Pressure” platform used to study prompt quality, Stroop task performance, and conversational AI behaviour. The stack is built on Next.js (App Router), Supabase, and OpenAI APIs, with a Postgres schema tailored for mixed Stroop/chat sessions.

## Documentation Map

- `sql/database-setup.md` — complete database provisioning and upgrade guide.
- `docs/pages/user-management.md` — user records, API endpoints, utilities, and React flows.
- `docs/pages/unified-session.md` — session lifecycle tying Stroop trials and chat interactions.
- `docs/pages/share-feature.md` — read-only share links for replaying conversations.
- `docs/pages/eval-feature.md` — evaluation dashboards, metrics, and data contracts.

Start here, then drill into the specific README that matches your task.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `env.example` → `.env.local`.
   - Fill required keys: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Optional toggles control Stroop timing, session timeouts, UI copy, and default models.

3. **Set up the database**
   - Follow `sql/database-setup.md` to apply `sql/database-setup.sql`.
   - Supabase-compatible; works with any PostgreSQL 14+ instance.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Core Architecture

- **App Routes**
  - `/task-1`, `/task-2`, `/task-3` — prompt-writing scenarios.
  - `/share/[session-id]` — public, read-only conversation viewer.
  - `/eval/[session-id]` — researcher dashboard with metrics and export options.

- **API Routes**
  - `/api/chat` — orchestrates OpenAI calls, stores chat interactions, updates sessions.
  - `/api/users` — basic-auth protected user CRUD for admin tooling.
  - `/api/classify-prompt-strategy` — runs prompt strategy classification pipeline.

- **Database**
  - `users`, `user_sessions`, `stroop_trials`, `chat_interactions`, extensive readability + structural quality metrics.
  - Indexed for analytics; all columns documented inside the SQL script.

Refer to `docs/pages/unified-session.md` for a deeper look at session orchestration, and `docs/pages/eval-feature.md` for the metrics exposed in eval views.

## Feature Guides

- **Prompt Quality Evaluation** (`docs/pages/eval-feature.md`)
  - CARE scores, readability indices, latency and cost breakdowns.
  - Copy/export support for transcripts and summary sections.

- **Conversation Sharing** (`docs/pages/share-feature.md`)
  - Read-only transcript viewer with error handling and responsive UI.
  - Leverages `/api/chat-history/[session-id]` for data access.

- **User Management** (`docs/pages/user-management.md`)
  - Utility functions for ID/username generation, validation helpers, and sample React components.
  - API examples for creating, updating, and querying users.

- **Unified Session Tracking** (`docs/pages/unified-session.md`)
  - Cookie-based session IDs, Stroop/chat logging, lifecycle hooks for page unload, and API integration details.

## Development Workflow

- **Testing**: Use the scenario pages to generate sessions, then verify output on `/share/[sid]` and `/eval/[sid]`.
- **Metric Extensions**: Update `src/utils/textAnalysis.ts` and ensure new fields are added to `sql/database-setup.sql`.
- **Prompt Strategy Logic**: `src/app/api/classify-prompt-strategy/route.ts` houses classifiers used by eval dashboards.
- **Stroop Config**: Adjust inter-trial intervals and timers via `NEXT_PUBLIC_STROOP_*` env vars; see `env.example`.

## Deployment Notes

- Supports Vercel, Supabase-hosted Postgres, or self-managed Postgres.
- Ensure cron/queue processors (if any) have access to the same environment variables.
- Re-run `sql/database-setup.sql` on schema changes—safe due to `IF NOT EXISTS`.

## Need More?

- Dive into the linked READMEs for component-level walkthroughs.
- Check `src/app/api/*` and `src/lib/*` for implementation specifics.
- For historical migrations, review git history prior to the consolidation into `sql/database-setup.sql`.

Questions or contributions? Open an issue or start a discussion in the repo so the research team can triage it. Happy experimenting! 

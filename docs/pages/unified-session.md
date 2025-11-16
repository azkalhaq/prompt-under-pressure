# Unified Session System

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

This guide explains how the platform links Stroop trials, chat interactions, and evaluation metadata under a single session record. It reflects the consolidated schema in `sql/database-setup.sql` and the runtime behaviour in `src/contexts/SessionContext.tsx`, `src/app/api/chat/route.ts`, and `src/components/StroopTest.tsx`.

## Database Overview

Three core tables work together:

1. `user_sessions` — per-participant session metadata (routes visited, Stroop/chat counters, submissions, aggregated scores).
2. `stroop_trials` — trial-by-trial Stroop responses captured during multi-task scenarios.
3. `chat_interactions` — every LLM prompt/response pair with readability, structural-quality, and cost metrics.

All three tables are created by `sql/database-setup.sql`; run that script to provision the latest schema.

### `user_sessions`

Key columns (subset):

| Column | Purpose |
| --- | --- |
| `session_id` | External identifier shared between browser and backend |
| `route_path`, `query_params` | Last route/task the user accessed (e.g. `/task-2?audio=1`) |
| `utm_source`, `audio` | Recruitment channel and scenario modifiers |
| `session_start_time`, `task_start_time`, `start_stroop_time`, `end_time`, `submit_time` | Lifecycle timestamps |
| `total_trials`, `total_prompts` | Counters updated by Stroop and chat APIs |
| `submitted_result`, `confidence`, `audio_code` | Collected during final submission |
| Fingerprinting columns (`user_agent`, `language`, `platform`, `screen_*`, `timezone`, `ip_address`) | De-duplication and analysis |
| Structural aggregates (`avg_task_intent_specification`, …, `session_prompt_strategy_classification`) | Session-level rollups produced by `/api/evaluate-structural-quality` and `/api/classify-prompt-strategy` |

Indexes exist on `user_id`, `session_id`, `utm_source`, and `audio`.

### `stroop_trials`

Each row captures one Stroop prompt:

- `instruction` (`word` or `color`), `text`, `text_color`, `condition`
- `iti` (inter-trial interval milliseconds), `reaction_time`, `correctness`, `user_answer`
- Foreign key to `user_sessions(session_id)` with cascade delete

Indexes on `user_id`, `session_id`, `trial_number` support analytics and replay.

### `chat_interactions`

A rich schema storing:

- Prompt context: `prompting_time_ms`, `scenario`, `task_code`, `prompt_index_no`, original `prompt`/`response`.
- Text analytics: word/char counts, readability indices (Flesch, SMOG, LIX, RIX, Dale-Chall), composite scores, etc.
- Structural-quality annotations: Likert scores, justification comments, prompt strategy classification.
- OpenAI telemetry: model, tokens, costs, latency (`first_response_time`, `latency`), raw request/response.
- User feedback: `reaction` column captures 👍/👎 recorded in the UI.

Check constraints guard `scenario` values, generated columns compute token totals and total cost, and numerous indexes accelerate evaluation queries.

Column-level documentation lives at the bottom of `sql/database-setup.sql` and can be viewed with `\d+ chat_interactions` in `psql`.

## Session Lifecycle in the App

1. **Session Bootstrapping**
   - `SessionContext` (see `src/contexts/SessionContext.tsx`) requests/creates a session via `/api/user-sessions`.
   - The API assigns/returns `session_id` and `user_id`, writing a record into `user_sessions` if new.
   - A cookie stores `sid` for subsequent page loads.

2. **Route & Query Tracking**
   - Each page load posts back the current `route_path` and `query_params`.
   - Scenario toggles (e.g., `?audio=1`) are persisted for later analysis.

3. **Chat Interactions**
   - Task pages call `/api/chat` with messages, session metadata, and prompting timers.
   - The API streams OpenAI responses, logs the exchange into `chat_interactions`, and increments `total_prompts`.
   - Structural quality and readability metrics are precomputed and stored server-side.

4. **Stroop Trials**
   - The `StroopTest` component posts trial data to `/api/stroop`.
   - Each trial increments `total_trials` and writes to `stroop_trials`.
   - Trials inherit `session_id`/`user_id` from `SessionContext`.

5. **Session Completion**
   - When a user submits final responses (see `ThankYou` flow), the API updates `submitted_result`, `confidence`, `audio_code`, and `submit_time`.
   - `end_time` is captured via unload beacons handled in `SessionContext`.

6. **Evaluations & Classifications**
   - Researchers trigger `/api/evaluate-structural-quality` and `/api/classify-prompt-strategy`, typically via the `/eval` index page.
   - Results populate the structural aggregate columns in `user_sessions` for dashboards.

## Related API Routes

| Route | Role |
| --- | --- |
| `/api/user-sessions` | Create/update session metadata |
| `/api/chat` | Send prompt to OpenAI, persist chat interaction, update counters |
| `/api/stroop` | Log Stroop trials |
| `/api/submission-status` | Capture final submission payloads |
| `/api/chat-history/[session-id]` | Fetch chat transcript (used by share page) |
| `/api/eval/[session-id]` | Provide evaluation payload | 
| `/api/eval/sessions` | List sessions with evaluation status |
| `/api/evaluate-structural-quality` | Batch compute structural scores |
| `/api/classify-prompt-strategy` | Assign per-interaction strategy classifications |

All APIs rely on valid `session_id` / `user_id` pairs and share the same Postgres client (`src/lib/supabase.ts`).

## Client Responsibilities

- **SessionContext** wraps the App Router layout, hydrating session data before page content renders.
- **StroopTest** consumes `userId`, `sessionId`, and environment-configured timing values (`NEXT_PUBLIC_STROOP_*`).
- **ChatInput / ChatItem** components handle timing, quoting, and reaction UI while delegating persistence to APIs.
- **Unload Handling** sends a background request to mark sessions as ended when tabs close.

## Operational Tips

- Re-run `sql/database-setup.sql` after schema changes—`IF NOT EXISTS` keeps it idempotent.
- Monitor `user_sessions.total_prompts` / `total_trials` to detect stuck sessions.
- Use the `/eval` index to batch evaluation/classification; it surfaces progress percentages based on stored metrics.
- For debugging session mismatches, inspect `user_sessions` alongside `chat_interactions` using the shared `session_id`.
   - Chat interactions increment `total_prompts`
   - Stroop trials increment `total_trials`
   - Stroop start time is recorded when Stroop test begins
3. **Session End**: Automatically detected when user closes browser, refreshes page, or navigates away

## Usage Examples

### Creating a Session
```typescript
await fetch('/api/chat-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_session',
    data: { userId: 'user123', sessionId: 'session456' }
  })
});
```

### Inserting a Chat Interaction
```typescript
await fetch('/api/chat-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'insert_interaction',
    data: {
      user_id: 'user123',
      session_id: 'session456',
      role: 'user',
      prompt: 'Hello, how are you?',
      response: 'I am doing well, thank you!',
      model: 'gpt-4',
      tokens_input: 10,
      tokens_output: 8,
      cost_usd: 0.002
    }
  })
});
```

### Inserting a Stroop Trial
```typescript
await fetch('/api/stroop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'insert_trial',
    data: {
      user_id: 'user123',
      session_id: 'session456',
      trial_number: 1,
      instruction: 'word',
      text: 'BLUE',
      text_color: 'red',
      condition: 'inconsistent',
      iti: 1000,
      reaction_time: 1500,
      correctness: true,
      user_answer: 'blue'
    }
  })
});
```

## Migration

If you have existing data, use the `migration-script.sql` file to migrate from the old structure to the new unified session system.

## Environment Variables

The system uses the same environment variables as before:
- `NEXT_PUBLIC_STROOP_ITI`: Inter-trial interval in milliseconds
- `NEXT_PUBLIC_STROOP_TRIAL_TIMER`: Trial timer in milliseconds (0 for no timer)
- `NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH`: Number of trials before switching instruction

## Benefits of Unified Sessions

1. **Consistent Session Tracking**: Both chat and Stroop data are linked to the same session
2. **Better Analytics**: Can analyze user behavior across both activities
3. **Simplified Management**: Single session ID for all interactions
4. **Data Integrity**: Foreign key constraints ensure data consistency
5. **Scalability**: Easy to add new activity types in the future

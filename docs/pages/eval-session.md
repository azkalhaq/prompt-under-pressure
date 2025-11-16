# Evaluation Session Page (`/eval/[session-id]`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Provides a comprehensive dashboard for a single session, combining transcript review with readability, structural quality, cost, and latency metrics. Designed for researchers to audit prompt quality and annotate findings.

## Key Features

- **Session summary**: scenario, task code, user ID, total prompts, Stroop counts, token + cost totals, average latency, reaction breakdown.
- **Structural aggregates**: displays `avg_*` scores and session-level prompt strategy classification pulled from `user_sessions`.
- **Transcript explorer**:
  - List of chat interactions with expandable metric panels.
  - Shows per-message readability, CARE scores, structural Likert ratings, comments, and strategy justifications.
  - Provides copy/export buttons mirroring the share page for quick sharing.
- **Metric groupings**:
  - Basic text analytics (word/char counts, averages).
  - Readability indices (Flesch, SMOG, LIX, RIX, Dale-Chall, etc.).
  - CARE rubric (Context, Ask, Rules, Examples, Specificity, Measurability, Verifiability, Ambiguity).
  - Structural quality scores (Likert 1–5) and reviewer comments.
  - OpenAI metadata (model, tokens, costs, finish reason, latency).
- **Action helpers**: Buttons to re-run structural evaluation or prompt classification for the current session if data appears stale.

## Data Flow

- Fetches via `GET /api/eval/[session-id]`.
- Response includes:
  - `session` summary object (counts, aggregated scores).
  - `messages` array with enriched metrics per interaction.
  - Flags indicating whether structural evaluation or classification are pending.

## Implementation Notes

- Component: `src/app/eval/[session-id]/page.tsx`.
- Client component using React hooks for state management and suspense for initial load.
- Employs utility formatters for currency, percentages, and readability labels.
- Handles missing data gracefully (e.g., displays “Not evaluated yet” badges).
- Integrates with evaluation APIs to allow one-click recomputation.

## When To Update

- Schema for `chat_interactions` or `user_sessions` evolves (new metrics or fields).
- UI adds new visualisations (charts, comparisons).
- Export format requirements change (e.g., CSV download).


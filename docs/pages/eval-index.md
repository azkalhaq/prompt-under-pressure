# Evaluation Index Page (`/eval`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Acts as the researcher control centre. Lists all recorded sessions, surfaces evaluation/classification status, and offers batch actions to compute structural-quality metrics or prompt-strategy labels.

## Key Features

- **Session directory**: Table of sessions returned by `/api/eval/sessions`, including scenario, task code, total prompts, and structural averages (`avg_*` fields).
- **Progress tracking**: Displays `needsEvaluation`, `evaluationProgress`, `needsClassification`, and `classificationProgress` per session.
- **Batch operations**:
  - “Evaluate Session” → triggers `/api/evaluate-structural-quality`.
  - “Classify Session” → triggers `/api/classify-prompt-strategy`.
  - “Evaluate All” / “Classify All” iterate sequentially with guard delays.
- **Status feedback**: Inline result text (e.g., “Evaluated 7 interactions”) and busy indicators.
- **Navigation**: Each session ID links to `/eval/[session-id]` for detailed review.

## Workflow

1. Component mounts and fetches session list (`fetch('/api/eval/sessions')`).
2. User can:
   - Inspect structural averages in the table.
   - Click through to a specific session.
   - Queue evaluation or classification jobs individually or in bulk.
3. Completion of a job triggers a delayed refresh to show updated progress.

## Implementation Notes

- Component: `src/app/eval/page.tsx`.
- Client component using React hooks (`useState`, `useEffect`).
- Maintains tracking sets to prevent double-submitting jobs while in progress.
- Displays error banners if fetch fails.
- Uses Next.js `Link` for client-side navigation to detail pages.

## When To Update

- API response shape from `/api/eval/sessions` changes.
- New batch operations are added (e.g., export, verification).
- Additional columns or filters added to the index table.


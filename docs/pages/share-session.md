# Share Session Page (`/share/[session-id]`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Shows a read-only transcript for a specific session. Intended for observers or participants to review their conversation without altering data.

## Key Features

- **Read-only transcript** rendered by `ChatItem` with reactions disabled.
- **Clipboard helpers**:
  - Copy full transcript (speaker-labelled).
  - Copy user prompts only.
  - Copy AI responses only (label uses `NEXT_PUBLIC_AI_NAME`).
- **State handling**: loading spinner, error message (404/500), and empty-session notice.
- **Environment integration**: respects `NEXT_PUBLIC_AI_NAME` when labelling responses.

## Data Flow

- Fetches transcript via `GET /api/chat-history/${sessionId}`.
- Expects `{ messages: UiMessage[] }` with roles `user`/`assistant`.
- Orders messages by `prompt_index_no` on the server to preserve chronology.

## Implementation Notes

- Component file: `src/app/share/[session-id]/page.tsx`.
- Uses `useParams` to read the dynamic segment.
- Clipboard writes triggered by button click; success feedback resets after 2 seconds.
- Suspense fallback mirrors the loading state used elsewhere in the app.

## When To Update

- API contract changes (different payload shape or additional metadata).
- Need to introduce password-protected links or expiring tokens.
- Want to add export formats beyond clipboard (PDF/CSV).


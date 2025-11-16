# Share Feature — Read-Only Chat History

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

Public, read-only transcripts let researchers and observers review a session without granting edit access. This feature mirrors the in-app chat UI but removes all interactive controls.

## Overview

- Fetches stored prompt/response pairs by `session_id`.
- Presents a single-column layout that matches the task interface.
- Provides dedicated copy buttons for analysts (full transcript, user-only, AI-only).
- Requires no authentication; suitable for quick sharing.

## URL Structure

```
/share/{session-id}
```

Replace `{session-id}` with the identifier stored alongside `chat_interactions`.

## Key Features

- **Read-only transcript** — `ChatItem` renders messages with `canReact={false}`.
- **Session-based routing** — dynamic App Router segment `[session-id]`.
- **Copy helpers** — three buttons write different slices of the transcript to the clipboard:
  - `📋 Copy Chat History` — speaker-labelled prompt + response transcript.
  - `👤 Copy User Chat` — user prompts only, indexed.
  - `🤖 Copy Response` — AI responses only, labelled with `NEXT_PUBLIC_AI_NAME`.
- **Feedback states** — success toast (button text flips to “✓ Copied!” for two seconds).
- **Robust states** — loading indicator, “no messages” placeholder, and error messaging.

## Implementation Details

### Data Source

- API route: `/api/chat-history/[session-id]`.
- Returns `{ messages: UiMessage[] }` sorted by `prompt_index_no`.
- Uses Supabase/Postgres via `sql/database-setup.sql`’s `chat_interactions` table.

**Sample query:**

```sql
SELECT prompt, response, prompt_index_no, created_at
FROM chat_interactions
WHERE session_id = $1
ORDER BY prompt_index_no ASC;
```

### Page Component (`src/app/share/[session-id]/page.tsx`)

1. Reads `session-id` via `useParams`.
2. Fetches messages on mount and stores in local state.
3. Derives copy payloads (full transcript, user prompts, AI replies).
4. Renders `ChatItem` with reactions disabled and no input field.
5. Handles loading, error, and empty states gracefully.

### Layout Integration

- Share routes bypass the sidebar/navigation chrome (see `src/app/layout.tsx`).
- Content is centered with consistent padding to match task screens.

## Message Format

```typescript
type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
```

Messages are the same structure returned by `/api/chat` and reused by the evaluation UI.

## Error Handling

- `404` → “No chat history found” messaging.
- `500` → generic failure notice with console logging.
- Network failures → fallback message encouraging retry.

## Usage Guide

1. Run `npm run dev`.
2. Visit `/share/{session-id}` with a known session.
3. Confirm transcript renders.
4. Test copy buttons — clipboard should contain the expected format.
5. Try invalid IDs to confirm appropriate handling.

## Security Notes

- Public endpoint; any knowledge of `session_id` exposes the transcript.
- Consider adding password tokens or expiring links if sharing sensitive data.
- Rate limiting can be layered on the API route if abuse is a concern.

## Future Enhancements

- Time-limited or password-protected links.
- Download options (CSV/PDF).
- Segment sharing (specific message ranges).
- Access analytics (view counts, timestamps).

# Task 2 Page (`/task-2`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Combines chat prompting with a concurrent Stroop task to simulate cognitive load. Participants craft prompts while reacting to Stroop stimuli, enabling comparison against the baseline condition.

## Key Features

- **Split layout**: two-column grid (chat on the left, Stroop test on the right).
- **Default audio cues**: query string defaults `audio=1` unless explicitly disabled; passed into `useAudio`.
- **Chat mechanics**: identical streaming behaviour to Task 1 (prompt timing, quote-to-input, scroll tracking).
- **Stroop integration**: `StroopTest` component logs trials via `/api/stroop` (ITI, correctness, reaction time).
- **Session awareness**: both columns receive `sessionId` / `userId` from `SessionContext`.
- **Responsive behaviour**: collapses to a single column on narrow viewports.

## Layout

- `grid-cols-1 md:grid-cols-2` with gap.
- Left column scrolls chat history; right column centers the Stroop widget.
- Chat input anchored to bottom of left column when messages exist.

## API Touchpoints

- `POST /api/chat` with `page_path` set to `/task-2`.
- `POST /api/stroop` (inside `StroopTest` component).
- Session updates handled automatically via `SessionContext`.

## Implementation Notes

- Component: `src/app/task-2/page.tsx`.
- Makes `URLSearchParams` copy to enforce default `audio=1`.
- Uses `messagesScrollRef` to control the chat scroll container explicitly.
- Shares UI components with Task 1 (`ChatItem`, `ChatInput`).
- Suspense fallback shows twin spinners for chat and Stroop panes.

## When To Update

- Stroop timing logic changes (`NEXT_PUBLIC_STROOP_*` environment defaults).
- Additional multitasking stimuli are introduced.
- New analytics required (e.g., additional telemetry for trial-to-prompt linkage).


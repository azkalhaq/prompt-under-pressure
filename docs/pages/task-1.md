# Task 1 Page (`/task-1`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Baseline chat scenario where participants compose prompts without additional cognitive load. Serves as the control condition for comparing prompt quality across tasks.

## Key Features

- **Chat workspace** with streaming OpenAI responses.
- **Session integration**: pulls `sessionId` and `userId` from `SessionContext`.
- **Prompt timing**: `ChatInput` reports `prompting_time_ms`, stored with each interaction.
- **Quote-to-input**: users can highlight assistant text to append into the input field.
- **Streaming UI**: Server-sent events update the assistant message in real time.
- **Scroll management**: IntersectionObserver toggles “scroll to bottom” affordance.
- **Audio hook**: `useAudio` attaches optional cues based on query params.

## Layout

- Centered column (`max-w-4xl`).
- Chat history takes the available height when messages exist; otherwise the input is centered.
- `ChatInput` sticks to the bottom when there is history.

## API Touchpoints

- `POST /api/chat`
  - Body includes `model`, `user_id`, `session_id`, `messages`, `prompting_time_ms`, `page_path`.
  - Response is streamed; tokens appended live to the last assistant message.

## Implementation Notes

- Components: `src/app/task-1/page.tsx`, `ChatItem`, `ChatInput`.
- Client component with hooks for state, refs, and effects.
- Abort controller cancels outstanding requests when a new prompt is sent.
- Handles fetch errors by appending “[Error fetching response]” to the message.

## When To Update

- Chat API contract changes (fields renamed/added).
- Additional telemetry needed (e.g., reaction logging, prompt categorisation).
- UI tweaks for new scenarios or instruction overlays.


# Task 3 Page (`/task-3`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Stress or time-pressure scenario variant. Participants interact with the chat interface under additional constraints (e.g., timers, audio cues) to observe prompt quality shifts compared to baseline.

## Key Features

- **Chat-only interface** mirroring Task 1 with scenario-specific framing.
- **Session-aware**: requires `sessionId` and `userId` from `SessionContext`.
- **Audio hooks**: `useAudio` responds to query parameters (`?audio=1` etc.).
- **Prompt timing**: `ChatInput` records drafting duration (`prompting_time_ms`).
- **Streaming response UI** with SSE token updates and error fallback.
- **Scroll-to-bottom affordance** controlled by `IntersectionObserver`.

## Layout

- Single-column layout identical to Task 1.
- Input sticky at bottom when history exists.
- Title of the input switches to “Scenario 3” when empty to clarify context.

## API Touchpoints

- `POST /api/chat` with `page_path` defaulting to `/task-3`.
- Session updates and counters handled by the chat route.

## Implementation Notes

- Component: `src/app/task-3/page.tsx`.
- Uses `useRouter` for potential future navigation (currently imported but unused beyond initial design).
- Maintains refs for abort controller, input component, and scroll anchor.
- Error handling appends “[Error fetching response]” to unfinished assistant messages.

## When To Update

- Scenario-specific behaviour changes (e.g., timers, guidance text).
- Additional instrumentation required (stress indicators, biometric hooks).
- API contract for chat route evolves.


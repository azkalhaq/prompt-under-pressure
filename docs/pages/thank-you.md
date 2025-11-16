# Thank You Page (`/thank-you`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Final checkpoint after participants submit their work. Displays completion messaging, optional follow-up instructions, and ensures submission metadata is recorded.

## Key Features

- **Thank-you messaging** rendered by `components/ThankYou`.
- **Session context**: receives `sessionId` and `userId` from `SessionContext` to finalise submissions or trigger follow-up analytics.
- **Scroll reset**: ensures page loads at the top (`window.scrollTo({ top: 0 })`).
- **Dynamic content**: `ThankYou` component can conditionally show submission summary, next steps, or links to surveys.

## Data Flow

- `ThankYou` component (see `src/components/ThankYou.tsx`) handles any server interactions (e.g., final `submitted_result` updates).
- Page itself is a thin wrapper to provide context values.

## Implementation Notes

- Component file: `src/app/thank-you/page.tsx`.
- Client component; uses `useEffect` only to reset scroll position.
- Renders nothing until `SessionContext` hydrates, but `ThankYou` can display loading states if necessary.

## When To Update

- Submission UX changes (e.g., new survey links, compensation details).
- Need to capture extra analytics before participants leave.
- Layout/branding refresh for final messaging.


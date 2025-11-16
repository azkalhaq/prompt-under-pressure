# Login Page (`/login`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Verifies participant IDs before they enter a task. The page is typically used by facilitators to help participants resume the correct scenario with their assigned `user_id`.

## Key Features

- Single-field form requesting a `user_id`.
- Optional redirect support via `?redirect=/task-1` (validated against `/task-\d+/`).
- Prefills the input when `?u=` is present in the URL (useful for emailed links).
- Debounced loading state and inline error messaging for invalid IDs.

## Workflow

1. Participant enters their assigned ID and submits the form.
2. Page performs `GET /api/users?user_id=<value>` to validate.
3. On success, browser navigates to the redirect path with the user ID appended (`?u=<value>`).
4. On failure, the page displays “Invalid ID. Please try again.”

## Implementation Notes

- Component: `src/app/login/page.tsx`.
- Client component using React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- Uses Next.js App Router’s `useRouter` and `useSearchParams`.
- Styling via Tailwind (gradient background, glassmorphism card).
- Button disabled + spinner text while request is in flight.

## When To Update

- API contract for `/api/users` changes (e.g., different lookup keys).
- Want to support alternative identifiers (passcode login).
- Need additional telemetry or logging for failed attempts.


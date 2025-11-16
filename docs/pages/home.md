# Home Page (`/`)

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

## Purpose

Introduces the “Prompting Under Pressure” study — a static overview of the research motivation, questions, methodology, and expected contributions. It sets context for participants and stakeholders landing on the root route.

## Key Features

- Research summary with headings for focus, questions, motivation, methodology, and contributions.
- Markdown-like layout rendered with Tailwind classes (`text-xl`, `list-disc`, etc.).
- Dark-mode aware typography (uses `dark:text-gray-*` classes).
- Fully static — no data fetching or client-side hooks beyond React rendering.

## Implementation Notes

- Component: `src/app/page.tsx`.
- Uses the App Router default layout; sidebar logic is applied higher up in `src/app/layout.tsx`.
- Content is wrapped in a centered container with responsive padding (`max-w-3xl`, `px-6`).

## When To Update

- Study framing changes (new research questions, methodology tweaks).
- Branding / design refresh requiring different copy layout.
- Want to add navigation or CTAs leading to task pages.


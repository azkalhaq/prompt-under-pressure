# Evaluation Feature

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

This guide documents the evaluation tooling surfaced under `/eval`. It reflects the latest UI in `src/app/eval/page.tsx`, `src/app/eval/[session-id]/page.tsx`, and supporting APIs under `src/app/api/eval`.

## Overview

Researchers use the evaluation area to:

- Review a session’s prompt/response transcript with full readability, structural, and cost metrics.
- Trigger batch structural-quality evaluations and prompt-strategy classification.
- Monitor completeness across all recorded sessions.

Two pages make up the experience:

1. **Evaluation Index (`/eval`)** — lists sessions, shows progress, and exposes “Evaluate” / “Classify” actions.
2. **Session Detail (`/eval/[session-id]`)** — deep dive into a single session with expandable metric cards and exports.

## `/eval` (Index) Features

- **Session Directory**: Table of all sessions returned by `/api/eval/sessions`, including scenario, task code, total prompts, and structural averages.
- **Progress Indicators**:
  - `needsEvaluation` / `evaluationProgress` — uses stored structural metrics to show completion.
  - `needsClassification` / `classificationProgress` — monitors prompt strategy coverage.
- **Batch Actions**:
  - “Evaluate Session” calls `/api/evaluate-structural-quality` with `{ sessionId, evaluateAll: true }`.
  - “Classify Session” calls `/api/classify-prompt-strategy` with `{ sessionId, classifyAll: true }`.
  - “Evaluate All” and “Classify All” iterate sequentially over pending sessions with throttling.
- **Session Drill-down**: Each row links to `/eval/[session-id]` for transcript-level inspection.

## `/eval/[session-id]` Features

### 1. Session Summary
- Scenario, task code, and prompt counts.
- Totals for token usage, OpenAI costs, reaction distribution.
- Average latency and first-response timing.
- Aggregated structural scores from `user_sessions` (`avg_*` fields, `session_prompt_strategy_*`).

### 2. Prompt Quality Metrics

**Basic Text Analysis**
- Word/char/sentence counts.
- Syllable counts, vocabulary diversity.
- Average sentence/word metrics (length, syllables, characters, letters, sentences).

**Readability Scores**
- Flesch Reading Ease + grade.
- Flesch-Kincaid Grade Level.
- SMOG, Coleman-Liau, Automated Readability Index.
- Dale-Chall score + grade, Gunning Fog, Linsear Write.
- LIX and RIX metrics.
- Text Standard (consensus score + grade) and median score.
- Difficult word and poly-syllable counts.

**Structural Quality (Likert 1–5 unless noted)**
- Task intent, goal articulation, persona definition, step decomposition.
- Chain-of-thought prompting, context provisioning, reference/example usage.
- Tonality/style, output format specification, information hierarchy.
- Optional comments/justifications for each dimension.

**Prompt Strategy Classification**
- Automatically inferred label (e.g., Zero Shot, Few Shot, CoT).
- Justification text capturing classification rationale.

**CARE Metrics (0–2 scale + booleans)**
- Context, Ask, Rules, Examples.
- Specificity, Measurability, Verifiability.
- Ambiguity count (lower is better).
- Flags for output format, role, quantity, citations requirements.

### 3. Response Metrics

- Model name, role used, finish reason.
- Token input/output totals with computed cost per interaction.
- Latency breakdown (prompting time, first response timestamp, completion time).
- Reaction summary (👍/👎).

### 4. Transcript Tools

- Tabular display with expand/collapse detail per interaction.
- Copy/export buttons for entire conversation, user prompts, or AI responses (mirrors share page logic).
- Quick filters for scenario and task context.

## Supporting APIs & Data Flow

| Endpoint | Purpose |
|---|---|
| `/api/eval/sessions` | Aggregates session metadata, structural averages, and evaluation/classification progress. |
| `/api/eval/[session-id]` | Returns full transcript, metrics, and session summary for a single session. |
| `/api/evaluate-structural-quality` | Computes structural Likert scores + comments for each `chat_interaction`. |
| `/api/classify-prompt-strategy` | Assigns prompt-strategy labels and justifications. |

Both evaluation and classification APIs update `chat_interactions` rows and roll up results into `user_sessions`.

## Usage Tips

- Run `Evaluate Session` before viewing `/eval/[session-id]` if scores are missing or outdated.
- Follow with `Classify Session` to populate the prompt-strategy column and session-level aggregate.
- Use the index page’s progress bars to identify incomplete sessions at a glance.
- Export transcripts from the detail page for offline analysis or annotations.

## Future Enhancements

Ideas under consideration:

1. Comparative analytics — side-by-side session comparisons or cohort averages.
2. Time-series dashboards — track prompt quality evolution across the study timeline.
3. CSV/JSON bulk export — download metrics for external statistical packages.
4. Rich visualisations — scatter plots for readability vs. structural scores.
5. Filtering and tagging — segment sessions by scenario, task code, or user attributes.

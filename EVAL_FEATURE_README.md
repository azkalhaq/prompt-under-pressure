# Evaluation Feature

This document describes the new evaluation page feature that provides comprehensive metrics for analyzing prompt quality and conversation performance.

## Overview

The evaluation page (`/eval/[session-id]`) extends the sharing functionality by adding detailed metrics for evaluating prompt quality, readability, and conversation performance. It's designed for researchers and analysts who need to assess the quality of user prompts and AI responses.

## Features

### 1. Session Summary
- **Scenario Information**: Shows the experimental scenario (baseline, dual_task, under_stress, etc.)
- **Task Code**: Displays the specific task being performed
- **Interaction Statistics**: Total interactions, prompts, and responses
- **Cost Analysis**: Total API costs and token usage
- **Performance Metrics**: Average latency and response times

### 2. Prompt Quality Metrics

#### Basic Text Analysis
- Word count, character count, sentence count
- Syllable count and vocabulary diversity
- Average sentence length and complexity

#### Readability Scores
- **Flesch Reading Ease**: 0-100 scale (higher = easier to read)
- **Flesch-Kincaid Grade Level**: U.S. grade level equivalent
- **SMOG Index**: Simple Measure of Gobbledygook
- **Coleman-Liau Index**: Grade level based on characters and sentences
- **Automated Readability Index**: Grade level based on characters per word
- **Dale-Chall Grade**: Grade level based on difficult words
- **Gunning Fog Index**: Grade level based on sentence length and complex words
- **LIX Score**: Readability measure for non-English texts
- **RIX Score**: Simplified LIX measure

#### CARE Quality Scores (0-2 scale)
- **Context**: Presence and quality of contextual information
- **Ask**: Clarity and specificity of the request
- **Rules**: Explicit rules and constraints provided
- **Examples**: Quality and relevance of examples given
- **Specificity**: Level of detail in constraints
- **Measurability**: Whether criteria are measurable
- **Verifiability**: Whether output can be verified
- **Ambiguity Count**: Number of vague terms (lower is better)

#### CARE Boolean Flags
- **Output Format Specified**: Whether output format is explicitly defined
- **Role Specified**: Whether a specific role/persona is assigned
- **Quantity Specified**: Whether number of outputs is specified
- **Has Citations**: Whether citations or URLs are required

### 3. Response Metrics

#### API Usage
- **Model**: AI model used for the response
- **Token Usage**: Input and output token counts
- **Latency**: Response time in milliseconds

#### Cost Analysis
- **Input Cost**: Cost for input tokens
- **Output Cost**: Cost for output tokens
- **Total Cost**: Combined cost per interaction
- **Cost per Token**: Average cost efficiency

## Usage

### Accessing the Evaluation Page
Navigate to `/eval/[session-id]` where `[session-id]` is the session identifier you want to evaluate.

### Interacting with Metrics
- Click on any metrics section to expand/collapse detailed information
- Use the copy buttons to export chat history, user prompts, or AI responses
- Review the session summary for overall performance insights

### Key Metrics to Focus On

#### For Prompt Quality Assessment:
1. **Flesch Reading Ease**: Aim for 60-70 for general audiences
2. **CARE Scores**: Higher scores (1.5-2.0) indicate better prompt quality
3. **Ambiguity Count**: Lower numbers indicate clearer prompts
4. **Boolean Flags**: More "Yes" values indicate more complete prompts

#### For Performance Analysis:
1. **Total Cost**: Monitor API usage costs
2. **Average Latency**: Track response times
3. **Token Efficiency**: Cost per token ratios
4. **Model Performance**: Compare different models if applicable

## Technical Implementation

### API Endpoint
- **Route**: `/api/eval/[session-id]`
- **Method**: GET
- **Returns**: Chat messages with metrics and session summary

### Components
- **MetricsDisplay**: Reusable component for displaying metrics
- **EvalPage**: Main evaluation page component
- **Session Summary**: Overview of session-level metrics

### Database Integration
The evaluation feature leverages the existing `chat_interactions` table with all text readability and CARE metrics that are automatically calculated and stored when prompts are submitted.

## Future Enhancements

Potential improvements for the evaluation feature:
1. **Comparative Analysis**: Compare metrics across different sessions
2. **Trend Analysis**: Track metrics over time
3. **Export Functionality**: Export metrics to CSV/JSON
4. **Visualization**: Charts and graphs for metric trends
5. **Filtering**: Filter by specific metrics or date ranges
6. **Benchmarking**: Compare against baseline metrics

// Standard pricing per 1M tokens (USD), input/output only
const STANDARD_PRICES: Record<string, { input: number; output: number }> = {
    "gpt-5": { input: 1.25, output: 10.0 },
    "gpt-5-mini": { input: 0.25, output: 2.0 },
    "gpt-5-nano": { input: 0.05, output: 0.4 },
    "gpt-5-chat-latest": { input: 1.25, output: 10.0 },
    "gpt-4.1": { input: 2.0, output: 8.0 },
    "gpt-4.1-mini": { input: 0.4, output: 1.6 },
    "gpt-4.1-nano": { input: 0.1, output: 0.4 },
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-05-13": { input: 5.0, output: 15.0 },
    "gpt-4o-audio-preview": { input: 2.5, output: 10.0 },
    "gpt-4o-realtime-preview": { input: 5.0, output: 20.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-audio-preview": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-realtime-preview": { input: 0.6, output: 2.4 },
    "o1": { input: 15.0, output: 60.0 },
    "o1-pro": { input: 150.0, output: 600.0 },
    "o3-pro": { input: 20.0, output: 80.0 },
    "o3": { input: 2.0, output: 8.0 },
    "o3-deep-research": { input: 10.0, output: 40.0 },
    "o4-mini": { input: 1.1, output: 4.4 },
    "o4-mini-deep-research": { input: 2.0, output: 8.0 },
    "o3-mini": { input: 1.1, output: 4.4 },
    "o1-mini": { input: 1.1, output: 4.4 },
    "codex-mini-latest": { input: 1.5, output: 6.0 },
    "gpt-4o-mini-search-preview": { input: 0.15, output: 0.6 },
    "gpt-4o-search-preview": { input: 2.5, output: 10.0 },
    "computer-use-preview": { input: 3.0, output: 12.0 },
    // For image model, output text tokens aren't priced in table; treat as 0.
    "gpt-image-1": { input: 5.0, output: 0.0 },
  };
  
  export function calculateStandardTokenCost(
    model: string,
    tokenInput: number,
    tokenOutput: number
  ): number {
    const pricing = STANDARD_PRICES[model];
    if (!pricing) throw new Error(`Unsupported model: ${model}`);
  
    const inputCost = (tokenInput / 1_000_000) * pricing.input;
    const outputCost = (tokenOutput / 1_000_000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  }
  
  /* Example:
  const cost = calculateStandardTokenCost("gpt-4o-mini", 12000, 3500); // -> number
  */
  
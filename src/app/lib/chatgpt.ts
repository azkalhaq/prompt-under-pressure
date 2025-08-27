import OpenAI from "openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MinimalChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
};

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export async function streamChatCompletion({
  client,
  model,
  messages,
  onMetrics,
}: {
  client: OpenAI;
  model: string;
  messages: ChatMessage[];
  onMetrics?: (m: { responseText: string; tokensInput: number; tokensOutput: number; apiCallId?: string }) => void;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages,
          stream: true,
        });

        let responseText = "";
        let metricsSent = false;
        for await (const chunk of (response as AsyncIterable<MinimalChunk>)) {
          const choice = chunk?.choices?.[0];
          const delta = choice?.delta?.content || "";
          if (choice?.finish_reason === "stop") {
            if (!metricsSent) {
              onMetrics?.({ responseText, tokensInput: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0), tokensOutput: Math.ceil(responseText.length / 4) });
              metricsSent = true;
            }
            controller.enqueue(encoder.encode("event: done\n\n"));
            controller.close();
            break;
          }
          if (delta) {
            responseText += delta;
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify(delta)}\n\n`)
            );
          }
        }
        // Fallback: ensure metrics sent even if finish_reason was not 'stop'
        if (!metricsSent) {
          onMetrics?.({ responseText, tokensInput: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0), tokensOutput: Math.ceil(responseText.length / 4) });
          metricsSent = true;
          try { controller.enqueue(encoder.encode("event: done\n\n")); } catch {}
          try { controller.close(); } catch {}
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return stream;
}



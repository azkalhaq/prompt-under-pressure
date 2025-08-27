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
}: {
  client: OpenAI;
  model: string;
  messages: ChatMessage[];
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

        for await (const chunk of (response as AsyncIterable<MinimalChunk>)) {
          const choice = chunk?.choices?.[0];
          const delta = choice?.delta?.content || "";
          if (choice?.finish_reason === "stop") {
            controller.enqueue(encoder.encode("event: done\n\n"));
            controller.close();
            break;
          }
          if (delta) {
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify(delta)}\n\n`)
            );
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return stream;
}



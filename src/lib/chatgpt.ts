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
  onMetrics?: (m: { responseText: string; tokensInput: number; tokensOutput: number; apiCallId?: string; rawRequest?: object; rawResponse?: object; finishReason?: string | null; firstResponseTime?: Date; latency?: number }) => void;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const requestPayload = {
          model,
          messages,
          stream: true,
        };
        
        // Record the start time for latency calculation
        const requestStartTime = new Date();
        
        const response = await client.chat.completions.create(requestPayload);

        let responseText = "";
        let lastFinishReason: string | null = null;
        let metricsSent = false;
        let firstResponseTime: Date | null = null;
        
        for await (const chunk of (response as AsyncIterable<MinimalChunk>)) {
          const choice = chunk?.choices?.[0];
          const delta = choice?.delta?.content || "";
          
          // Capture first response time when we get the first chunk with content
          if (delta && !firstResponseTime) {
            firstResponseTime = new Date();
          }
          
          if (typeof choice?.finish_reason !== "undefined") {
            lastFinishReason = choice.finish_reason ?? null;
          }
          
          if (choice?.finish_reason === "stop") {
            // Construct the complete response object
            const completeResponse = {
              model: model,
              choices: [{
                index: 0,
                message: {
                  role: "assistant",
                  content: responseText
                },
                finish_reason: "stop"
              }],
              usage: {
                prompt_tokens: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0),
                completion_tokens: Math.ceil(responseText.length / 4),
                total_tokens: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0) + Math.ceil(responseText.length / 4)
              }
            };
            
            if (!metricsSent) {
              // Calculate latency in milliseconds
              const latency = firstResponseTime ? 
                firstResponseTime.getTime() - requestStartTime.getTime() : 
                undefined;
              
              onMetrics?.({ 
                responseText, 
                tokensInput: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0), 
                tokensOutput: Math.ceil(responseText.length / 4),
                rawRequest: requestPayload,
                rawResponse: completeResponse,
                finishReason: lastFinishReason ?? "stop",
                firstResponseTime: firstResponseTime || undefined,
                latency: latency
              });
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
          const completeResponse = {
            model: model,
            choices: [{
              index: 0,
              message: {
                role: "assistant",
                content: responseText
              },
              finish_reason: "stop"
            }],
            usage: {
              prompt_tokens: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0),
              completion_tokens: Math.ceil(responseText.length / 4),
              total_tokens: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0) + Math.ceil(responseText.length / 4)
            }
          };
          
          // Calculate latency in milliseconds
          const latency = firstResponseTime ? 
            firstResponseTime.getTime() - requestStartTime.getTime() : 
            undefined;
          
          onMetrics?.({ 
            responseText, 
            tokensInput: messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0), 
            tokensOutput: Math.ceil(responseText.length / 4),
            rawRequest: requestPayload,
            rawResponse: completeResponse,
            finishReason: lastFinishReason ?? "stop",
            firstResponseTime: firstResponseTime || undefined,
            latency: latency
          });
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



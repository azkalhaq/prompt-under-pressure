import { NextRequest } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { getOpenAIClient, streamChatCompletion, type ChatMessage } from "@/app/lib/chatgpt";
import { getSupabaseServerClientOrNull } from "@/app/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();
    const supabase = getSupabaseServerClientOrNull();

    const body = await req.json();
    const messages: ChatMessage[] = body?.messages ?? [];
    const model: string = (typeof body?.model === 'string' && body.model.trim().length > 0)
      ? body.model.trim()
      : process.env.OPENAI_MODEL;
    const userId: string = body?.user_id || "anonymous";
    const sessionId: string | undefined = body?.session_id;

    const apiCallId = crypto.randomUUID();

    const stream = await streamChatCompletion({
      client,
      model,
      messages,
      onMetrics: async ({ responseText, tokensInput, tokensOutput }) => {
        if (!supabase) return;
        try {
          const prompt = messages[messages.length - 1]?.content || "";
          const role = messages[messages.length - 1]?.role || 'user';
          await supabase
            .schema('public')
            .from('chat_interactions')
            .insert({
              user_id: (userId ?? 'anonymous').slice(0, 100),
              session_id: sessionId ?? null,
              role,
              prompt,
              response: responseText,
              model: (model ?? '').slice(0, 50),
              tokens_input: tokensInput,
              tokens_output: tokensOutput,
              api_call_id: apiCallId.slice(0, 255),
            });
        } catch (e) {
          console.error('Supabase insert exception', e);
        }
      },
    });

    // console.log(messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    return new Response(error instanceof Error ? error.message : "Unexpected error", { status: 500 });
  }
}



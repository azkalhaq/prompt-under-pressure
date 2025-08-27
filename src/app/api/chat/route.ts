import { NextRequest } from "next/server";
import { getOpenAIClient, streamChatCompletion, type ChatMessage } from "@/app/lib/chatgpt";
import { getSupabaseServerClientOrNull } from "@/app/lib/supabase";
import { calculateStandardTokenCost } from "@/app/utils/CostCalculator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();
    const supabase = getSupabaseServerClientOrNull();

    const body = await req.json();
    const qpUser = req.nextUrl.searchParams.get('u') || undefined;
    const messages: ChatMessage[] = body?.messages ?? [];
    const model: string = (typeof body?.model === 'string' && body.model.trim().length > 0)
      ? body.model.trim()
      : process.env.OPENAI_MODEL;
    const userId: string = body?.user_id || qpUser || "anonymous";
    const cookieName = 'sid';
    let sessionId: string | undefined = body?.session_id || req.cookies.get(cookieName)?.value;
    let shouldSetSessionCookie = false;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      shouldSetSessionCookie = true;
    }

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
          console.log("messages", messages);
          await supabase
            .schema('public')
            .from('chat_interactions')
            .insert({
              user_id: (userId ?? 'anonymous').slice(0, 100),
              session_id: sessionId ?? null,
              role,
              prompt,
              cost_usd: calculateStandardTokenCost(model, tokensInput, tokensOutput),
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

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    };
    if (shouldSetSessionCookie && sessionId) {
      headers['Set-Cookie'] = `${cookieName}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000`;
    }
    return new Response(stream, { headers });
  } catch (error: unknown) {
    return new Response(error instanceof Error ? error.message : "Unexpected error", { status: 500 });
  }
}



import { NextRequest } from "next/server";
import { getOpenAIClient, streamChatCompletion, type ChatMessage } from "@/lib/chatgpt";
import { getSupabaseServerClientOrNull } from "@/lib/supabase";
import { calculateStandardTokenCost } from "@/app/utils/CostCalculator";
import { insertChatInteraction, createUserSession, getUserSession, incrementSessionPrompts } from "@/lib/chat-db";

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
    
    console.log(`Chat API called with sessionId: ${sessionId}, userId: ${userId}`);

    // Ensure session exists in user_sessions table
    if (sessionId) {
      try {
        const existingSession = await getUserSession(sessionId);
        if (!existingSession) {
          // Create session if it doesn't exist
          await createUserSession(userId, sessionId);
          console.log(`Created new session: ${sessionId} for user: ${userId}`);
        } else {
          console.log(`Using existing session: ${sessionId} for user: ${userId}`);
        }
      } catch (error) {
        // If session creation fails, continue with the request
        console.error('Error ensuring session exists:', error);
      }
    }

    const stream = await streamChatCompletion({
      client,
      model,
      messages,
      onMetrics: async ({ responseText, tokensInput, tokensOutput, rawRequest, rawResponse }) => {
        try {
          const prompt = messages[messages.length - 1]?.content || "";
          const role = messages[messages.length - 1]?.role || 'user';
          
          await insertChatInteraction({
            user_id: (userId ?? 'anonymous').slice(0, 100),
            session_id: sessionId ?? 'no-session',
            role,
            prompt,
            cost_usd: calculateStandardTokenCost(model, tokensInput, tokensOutput),
            response: responseText,
            model: (model ?? '').slice(0, 50),
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            api_call_id: apiCallId.slice(0, 255),
            raw_request: rawRequest,
            raw_respond: rawResponse,
          });
          
          // Increment total_prompts counter in user_sessions
          if (sessionId) {
            try {
              await incrementSessionPrompts(sessionId);
              console.log(`Incremented total_prompts for session: ${sessionId}`);
            } catch (error) {
              console.error('Error incrementing session prompts:', error);
            }
          }
        } catch (e) {
          console.error('Chat interaction insert exception', e);
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



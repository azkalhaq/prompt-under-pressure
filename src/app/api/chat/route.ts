import { NextRequest } from "next/server";
import { getOpenAIClient, streamChatCompletion, type ChatMessage } from "@/lib/chatgpt";
import { getSupabaseServerClientOrNull } from "@/lib/supabase";
import { calculateStandardTokenCost } from "@/utils/CostCalculator";
import { insertChatInteraction } from "@/lib/chat-interactions";
import { createUserSession, getUserSession, incrementSessionPrompts } from "@/lib/user-sessions";
import { calculateTextMetrics, calculateCareMetrics } from "@/utils/textAnalysis";
import { collectServerSideFingerprint } from "@/utils/browserFingerprint";

export const runtime = "nodejs";

/**
 * Determine scenario based on the request path
 */
function determineScenario(pathname: string): 'baseline' | 'dual_task' {
  if (pathname.includes('/task-2')) {
    return 'dual_task';
  }
  return 'baseline';
}

/**
 * Get task code from query parameters
 */
function getTaskCode(req: NextRequest): string | undefined {
  return req.nextUrl.searchParams.get('task') || undefined;
}

/**
 * Get prompt index number for the session
 */
async function getPromptIndexNo(sessionId: string): Promise<number> {
  try {
    const supabase = getSupabaseServerClientOrNull();
    if (!supabase) return 1;
    
    const { count } = await supabase
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    
    return (count || 0) + 1;
  } catch (error) {
    console.error('Error getting prompt index:', error);
    return 1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();

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
          const currentPath = (typeof body?.page_path === 'string' && body.page_path.trim().length > 0)
            ? body.page_path
            : (req.nextUrl.pathname || '/');
          
          // Collect browser fingerprinting data
          const browserData = collectServerSideFingerprint(req);
          
          await createUserSession(userId, sessionId, currentPath, browserData);
          console.log(`Created new session: ${sessionId} for user: ${userId}`);
        } else {
          console.log(`Using existing session: ${sessionId} for user: ${userId}`);
        }
      } catch (error) {
        // If session creation fails, continue with the request
        console.error('Error ensuring session exists:', error);
      }
    }

    // Record the prompt immediately so it appears in the database right away
    const prompt = messages[messages.length - 1]?.content || "";
    const role_used = messages[messages.length - 1]?.role || 'user';
    const scenario = determineScenario(req.nextUrl.pathname);
    const taskCode = getTaskCode(req);
    const promptIndexNo = await getPromptIndexNo(sessionId ?? 'no-session');
    const textMetrics = calculateTextMetrics(prompt);
    const careMetrics = calculateCareMetrics(prompt);
    const promptingTimeMs: number | undefined = typeof body?.prompting_time_ms === 'number' ? body.prompting_time_ms : undefined;
    
    console.log(`[Chat API] Recording prompt immediately for api_call_id: ${apiCallId}`);
    console.log(`[Chat API] Prompt: ${prompt.slice(0, 100)}...`);
    
    // Insert initial record with prompt data immediately
    await insertChatInteraction({
      user_id: (userId ?? 'anonymous').slice(0, 100),
      session_id: sessionId ?? 'no-session',
      prompting_time_ms: promptingTimeMs,
      scenario,
      task_code: taskCode,
      prompt_index_no: promptIndexNo,
      prompt,
      response: null, // Will be updated when response is complete
      role_used,
      model: (model ?? '').slice(0, 50),
      token_input: null, // Will be updated when response is complete
      token_output: null, // Will be updated when response is complete
      cost_input: null, // Will be updated when response is complete
      cost_output: null, // Will be updated when response is complete
      api_call_id: apiCallId.slice(0, 100),
      raw_request: null, // Will be updated when response is complete
      raw_response: null, // Will be updated when response is complete
      finish_reason: null, // Will be updated when response is complete
      ...textMetrics,
      ...careMetrics
    });
    
    console.log(`[Chat API] Successfully recorded prompt immediately`);
    
    // Increment total_prompts counter in user_sessions
    if (sessionId) {
      try {
        await incrementSessionPrompts(sessionId);
        console.log(`Incremented total_prompts for session: ${sessionId}`);
      } catch (error) {
        console.error('Error incrementing session prompts:', error);
      }
    }

    const stream = await streamChatCompletion({
      client,
      model,
      messages,
      onMetrics: async ({ responseText, tokensInput, tokensOutput, rawRequest, rawResponse, finishReason }) => {
        try {
          const totalCost = calculateStandardTokenCost(model, tokensInput, tokensOutput);
          
          console.log(`[Chat API] Updating response for api_call_id: ${apiCallId}`);
          console.log(`[Chat API] Response text length: ${responseText?.length || 0}`);
          console.log(`[Chat API] Tokens input: ${tokensInput}, output: ${tokensOutput}`);
          
          // Update the existing record with response data
          const supabase = getSupabaseServerClientOrNull();
          if (supabase) {
            const { error } = await supabase
              .from('chat_interactions')
              .update({
                response: responseText,
                token_input: tokensInput,
                token_output: tokensOutput,
                cost_input: totalCost * (tokensInput / (tokensInput + tokensOutput)),
                cost_output: totalCost * (tokensOutput / (tokensInput + tokensOutput)),
                raw_request: rawRequest as Record<string, unknown> | undefined,
                raw_response: rawResponse as Record<string, unknown> | undefined,
                finish_reason: typeof finishReason === 'string' ? finishReason : undefined,
              })
              .eq('api_call_id', apiCallId);
              
            if (error) {
              console.error('[Chat API] Update error:', error);
            } else {
              console.log('[Chat API] Successfully updated response data');
            }
          } else {
            console.error('[Chat API] Supabase client is null');
          }
        } catch (e) {
          console.error('Chat interaction update exception', e);
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



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
 * Available scenario types
 * Add new scenarios here as needed
 */
export type ScenarioType = 'baseline' | 'dual_task' | 'under_stress' | 'time_pressure' | 'cognitive_load';

/**
 * Configuration for path-to-scenario mapping
 * Easy to modify for future changes
 */
const SCENARIO_CONFIG: Record<string, ScenarioType> = {
  '/task-1': 'baseline',
  '/task-2': 'dual_task', 
  '/task-3': 'baseline',  // Change this to any scenario type as needed
  '/task-4': 'under_stress',  // Example: new task with stress scenario
  '/task-5': 'time_pressure', // Example: new task with time pressure
  '/': 'baseline',
};

/**
 * Determine scenario based on the request path
 */
function determineScenario(pathname: string): ScenarioType {
  // Check for exact matches first
  if (pathname in SCENARIO_CONFIG) {
    return SCENARIO_CONFIG[pathname];
  }
  
  // Fallback: check if pathname includes any configured paths
  for (const [path, scenario] of Object.entries(SCENARIO_CONFIG)) {
    if (pathname.includes(path)) {
      return scenario;
    }
  }
  
  // Default fallback
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
    // Use page_path from request body, fallback to nextUrl.pathname
    const currentPath = (typeof body?.page_path === 'string' && body.page_path.trim().length > 0)
      ? body.page_path
      : req.nextUrl.pathname;
    const scenario = determineScenario(currentPath);
    console.log(`[Chat API] Pathname: ${currentPath}, Scenario: ${scenario}`);
    const taskCode = getTaskCode(req);
    const promptIndexNo = await getPromptIndexNo(sessionId ?? 'no-session');
    const promptingTimeMs: number | undefined = typeof body?.prompting_time_ms === 'number' ? body.prompting_time_ms : undefined;
    
    console.log(`[Chat API] Recording prompt immediately for api_call_id: ${apiCallId}`);
    console.log(`[Chat API] Prompt: ${prompt.slice(0, 100)}...`);
    
    // Insert initial record with prompt data immediately (without text analysis)
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
      // Text analysis metrics will be added asynchronously
    });

    // Perform text analysis asynchronously in the background
    // This won't block the response streaming
    setImmediate(async () => {
      const updateTextAnalysis = async (retryCount = 0): Promise<void> => {
        try {
          console.log(`[Chat API] Starting async text analysis for api_call_id: ${apiCallId} (attempt ${retryCount + 1})`);
          const textMetrics = calculateTextMetrics(prompt);
          const careMetrics = calculateCareMetrics(prompt);
          
          // Update the record with text analysis results
          const supabase = getSupabaseServerClientOrNull();
          if (supabase) {
            const { error } = await supabase
              .from('chat_interactions')
              .update({
                ...textMetrics,
                ...careMetrics
              })
              .eq('api_call_id', apiCallId);
              
            if (error) {
              console.error(`[Chat API] Error updating text analysis metrics (attempt ${retryCount + 1}):`, error);
              
              // Retry up to 3 times with exponential backoff
              if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.log(`[Chat API] Retrying text analysis in ${delay}ms...`);
                setTimeout(() => updateTextAnalysis(retryCount + 1), delay);
              } else {
                console.error('[Chat API] Failed to update text analysis metrics after 3 attempts');
              }
            } else {
              console.log('[Chat API] Successfully updated text analysis metrics');
            }
          } else {
            console.error('[Chat API] Supabase client is null for text analysis');
            // Retry if client is null
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`[Chat API] Retrying text analysis in ${delay}ms due to null client...`);
              setTimeout(() => updateTextAnalysis(retryCount + 1), delay);
            }
          }
        } catch (error) {
          console.error(`[Chat API] Error in async text analysis (attempt ${retryCount + 1}):`, error);
          
          // Retry on exception
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`[Chat API] Retrying text analysis in ${delay}ms due to exception...`);
            setTimeout(() => updateTextAnalysis(retryCount + 1), delay);
          } else {
            console.error('[Chat API] Failed to update text analysis metrics after 3 attempts due to exceptions');
          }
        }
      };

      // Start the text analysis update process
      await updateTextAnalysis();
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
      onMetrics: async ({ responseText, tokensInput, tokensOutput, rawRequest, rawResponse, finishReason, firstResponseTime, latency }) => {
        const updateResponseData = async (retryCount = 0): Promise<void> => {
          try {
            const totalCost = calculateStandardTokenCost(model, tokensInput, tokensOutput);
            
            console.log(`[Chat API] Updating response for api_call_id: ${apiCallId} (attempt ${retryCount + 1})`);
            console.log(`[Chat API] Response text length: ${responseText?.length || 0}`);
            console.log(`[Chat API] Tokens input: ${tokensInput}, output: ${tokensOutput}`);
            console.log(`[Chat API] First response time: ${firstResponseTime}, Latency: ${latency}ms`);
            
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
                  first_response_time: firstResponseTime,
                  latency: latency,
                })
                .eq('api_call_id', apiCallId);
                
              if (error) {
                console.error(`[Chat API] Update error (attempt ${retryCount + 1}):`, error);
                
                // Retry up to 3 times with exponential backoff
                if (retryCount < 3) {
                  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                  console.log(`[Chat API] Retrying in ${delay}ms...`);
                  setTimeout(() => updateResponseData(retryCount + 1), delay);
                } else {
                  console.error('[Chat API] Failed to update response data after 3 attempts');
                }
              } else {
                console.log('[Chat API] Successfully updated response data');
              }
            } else {
              console.error('[Chat API] Supabase client is null');
              // Retry if client is null
              if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`[Chat API] Retrying in ${delay}ms due to null client...`);
                setTimeout(() => updateResponseData(retryCount + 1), delay);
              }
            }
          } catch (e) {
            console.error(`[Chat API] Chat interaction update exception (attempt ${retryCount + 1}):`, e);
            
            // Retry on exception
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`[Chat API] Retrying in ${delay}ms due to exception...`);
              setTimeout(() => updateResponseData(retryCount + 1), delay);
            } else {
              console.error('[Chat API] Failed to update response data after 3 attempts due to exceptions');
            }
          }
        };

        // Start the update process
        await updateResponseData();
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



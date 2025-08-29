import { getSupabaseServerClient } from './supabase';

export interface ChatInteractionData {
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  prompt: string;
  response?: string;
  model?: string;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
  api_call_id?: string;
  raw_request?: any;
  raw_respond?: any;
}

export interface UserSession {
  user_id: string;
  session_id: string;
  session_start_time: string;
  start_stroop_time?: string;
  end_time?: string;
  total_trials: number;
  total_prompts: number;
}

export async function insertChatInteraction(data: ChatInteractionData): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('chat_interactions')
    .insert({
      user_id: data.user_id,
      session_id: data.session_id,
      role: data.role,
      prompt: data.prompt,
      response: data.response,
      model: data.model,
      tokens_input: data.tokens_input,
      tokens_output: data.tokens_output,
      cost_usd: data.cost_usd,
      api_call_id: data.api_call_id,
      raw_request: data.raw_request,
      raw_respond: data.raw_respond,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error inserting chat interaction:', error);
    throw new Error(`Failed to insert chat interaction: ${error.message}`);
  }
}

export async function createUserSession(userId: string, sessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      session_start_time: new Date().toISOString(),
      total_trials: 0,
      total_prompts: 0
    });

  if (error) {
    // If it's a unique constraint violation, the session already exists
    if (error.code === '23505') {
      console.log(`Session ${sessionId} already exists, skipping creation`);
      return;
    }
    console.error('Error creating user session:', error);
    throw new Error(`Failed to create user session: ${error.message}`);
  }
}

export async function updateUserSession(
  sessionId: string, 
  updates: {
    start_stroop_time?: string;
    end_time?: string;
    total_trials?: number;
    total_prompts?: number;
  }
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .update(updates)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error updating user session:', error);
    throw new Error(`Failed to update user session: ${error.message}`);
  }
}

export async function getUserSession(sessionId: string): Promise<UserSession | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('Error getting user session:', error);
    return null;
  }

  return data;
}

export async function incrementSessionPrompts(sessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  // First get the current session
  const session = await getUserSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Update with incremented total_prompts
  await updateUserSession(sessionId, {
    total_prompts: session.total_prompts + 1
  });
}

export async function incrementSessionTrials(sessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  // First get the current session
  const session = await getUserSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Update with incremented total_trials
  await updateUserSession(sessionId, {
    total_trials: session.total_trials + 1
  });
}

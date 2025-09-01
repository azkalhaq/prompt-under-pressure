import { getSupabaseServerClient } from './supabase';

export interface ChatInteractionData {
  // user related data
  user_id: string;
  session_id: string;
  
  // interaction specified data
  prompting_time_ms?: number;
  scenario: 'baseline' | 'dual_task';
  task_code?: string;
  prompt_index_no: number;
  prompt: string;
  response?: string;
  
  // prompt metrics / quality
  word_count?: number;
  char_count?: number;
  vocab_count?: number;
  readability_fk?: number;
  
  // OpenAI related
  api_call_id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  model?: string;
  token_input?: number;
  token_output?: number;
  cost_input?: number;
  cost_output?: number;
  finish_reason?: string;
  raw_response?: Record<string, unknown>;
  raw_request?: Record<string, unknown>;
}

export interface UserSession {
  user_id: string;
  session_id: string;
  session_start_time: string;
  start_stroop_time?: string;
  end_time?: string;
  total_trials: number;
  total_prompts: number;
  route_path?: string;
  submitted_result?: string;
  confidence?: number;
  submit_time?: string;
}

export async function insertChatInteraction(data: ChatInteractionData): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('chat_interactions')
    .insert({
      user_id: data.user_id,
      session_id: data.session_id,
      prompting_time_ms: data.prompting_time_ms,
      scenario: data.scenario,
      task_code: data.task_code,
      prompt_index_no: data.prompt_index_no,
      prompt: data.prompt,
      response: data.response,
      word_count: data.word_count,
      char_count: data.char_count,
      vocab_count: data.vocab_count,
      readability_fk: data.readability_fk,
      api_call_id: data.api_call_id,
      role: data.role,
      model: data.model,
      token_input: data.token_input,
      token_output: data.token_output,
      cost_input: data.cost_input,
      cost_output: data.cost_output,
      finish_reason: data.finish_reason,
      raw_response: data.raw_response,
      raw_request: data.raw_request
    });

  if (error) {
    console.error('Error inserting chat interaction:', error);
    throw new Error(`Failed to insert chat interaction: ${error.message}`);
  }
}

export async function createUserSession(userId: string, sessionId: string, routePath?: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      session_start_time: new Date().toISOString(),
      total_trials: 0,
      total_prompts: 0,
      route_path: routePath
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
    route_path?: string;
    submitted_result?: string;
    confidence?: number;
    submit_time?: string;
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

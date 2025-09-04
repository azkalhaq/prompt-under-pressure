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
  flesch_reading_ease?: number;
  flesch_kincaid_grade?: number;
  coleman_liau_index?: number;
  automated_readability_index?: number;
  dale_chall_readability_score?: number;
  difficult_words?: number;
  linsear_write_formula?: number;
  gunning_fog?: number;
  
  // OpenAI related
  api_call_id?: string;
  role_used: 'system' | 'user' | 'assistant' | 'tool';
  model?: string;
  token_input?: number;
  token_output?: number;
  cost_input?: number;
  cost_output?: number;
  finish_reason?: string;
  raw_response?: Record<string, unknown>;
  raw_request?: Record<string, unknown>;
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
      flesch_reading_ease: data.flesch_reading_ease,
      flesch_kincaid_grade: data.flesch_kincaid_grade,
      coleman_liau_index: data.coleman_liau_index,
      automated_readability_index: data.automated_readability_index,
      dale_chall_readability_score: data.dale_chall_readability_score,
      difficult_words: data.difficult_words,
      linsear_write_formula: data.linsear_write_formula,
      gunning_fog: data.gunning_fog,
      api_call_id: data.api_call_id,
      role_used: data.role_used,
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



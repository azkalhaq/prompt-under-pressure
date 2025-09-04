import { getSupabaseServerClient } from './supabase';

export interface StroopTrialData {
  user_id: string;
  session_id: string;
  trial_number: number;
  instruction: 'word' | 'color';
  text: string;
  text_color: string;
  condition: 'consistent' | 'inconsistent';
  iti: number;
  reaction_time: number | null;
  correctness: boolean | null;
  user_answer: string | null;
}

export interface StroopSession {
  user_id: string;
  session_id: string;
  start_stroop_time: string;
  end_time?: string;
  total_trials: number;
}

export async function insertStroopTrial(data: StroopTrialData): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('stroop_trials')
    .insert({
      user_id: data.user_id,
      session_id: data.session_id,
      trial_number: data.trial_number,
      instruction: data.instruction,
      text: data.text,
      text_color: data.text_color,
      condition: data.condition,
      iti: data.iti,
      reaction_time: data.reaction_time,
      correctness: data.correctness,
      user_answer: data.user_answer,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error inserting Stroop trial:', error);
    throw new Error(`Failed to insert trial data: ${error.message}`);
  }
}

export async function markLastTrialInactive(userId: string, sessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  // Update the most recent trial for this session to flag inactivity via user_answer='inactive'
  const { data: latest, error: selErr } = await supabase
    .from('stroop_trials')
    .select('id')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr) {
    console.error('Error selecting last trial for inactivity:', selErr);
    throw new Error(`Failed to select last trial: ${selErr.message}`);
  }
  if (!latest?.id) return;
  const { error: updErr } = await supabase
    .from('stroop_trials')
    .update({ user_answer: 'inactive' })
    .eq('id', latest.id);
  if (updErr) {
    console.error('Error marking last trial inactive:', updErr);
    throw new Error(`Failed to mark trial inactive: ${updErr.message}`);
  }
}

export async function createStroopSession(
  userId: string, 
  sessionId: string,
  browserData?: {
    user_agent?: string;
    language?: string;
    platform?: string;
    screen_width?: number;
    screen_height?: number;
    timezone?: string;
    query_params?: string;
  }
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      start_stroop_time: new Date().toISOString(),
      total_trials: 0,
      total_prompts: 0,
      user_agent: browserData?.user_agent,
      language: browserData?.language,
      platform: browserData?.platform,
      screen_width: browserData?.screen_width,
      screen_height: browserData?.screen_height,
      timezone: browserData?.timezone,
      query_params: browserData?.query_params
    });

  if (error) {
    console.error('Error creating Stroop session:', error);
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

export async function updateStroopSession(sessionId: string, totalTrials: number, endTime?: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const updateData: { total_trials: number; end_time?: string } = { total_trials: totalTrials };
  if (endTime) {
    updateData.end_time = endTime;
  }

  const { error } = await supabase
    .from('user_sessions')
    .update(updateData)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error updating Stroop session:', error);
    throw new Error(`Failed to update session: ${error.message}`);
  }
}

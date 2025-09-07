import { getSupabaseServerClient } from './supabase';

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
  user_agent?: string;
  language?: string;
  platform?: string;
  screen_width?: number;
  screen_height?: number;
  timezone?: string;
  query_params?: string;
  utm_source?: string;
  audio?: boolean;
}

export async function createUserSession(
  userId: string, 
  sessionId: string, 
  routePath?: string,
  browserData?: {
    user_agent?: string;
    language?: string;
    platform?: string;
    screen_width?: number;
    screen_height?: number;
    timezone?: string;
    query_params?: string;
  },
  queryParams?: {
    utm_source?: string;
    audio?: boolean;
    query_params?: string;
  }
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .upsert({
      user_id: userId,
      session_id: sessionId,
      session_start_time: new Date().toISOString(),
      total_trials: 0,
      total_prompts: 0,
      route_path: routePath,
      user_agent: browserData?.user_agent,
      language: browserData?.language,
      platform: browserData?.platform,
      screen_width: browserData?.screen_width,
      screen_height: browserData?.screen_height,
      timezone: browserData?.timezone,
      query_params: queryParams?.query_params || browserData?.query_params,
      utm_source: queryParams?.utm_source,
      audio: queryParams?.audio || false
    }, { onConflict: 'session_id' });

  if (error) {
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
    .maybeSingle();

  if (error) {
    console.error('Error getting user session:', error);
    return null;
  }

  return data;
}

export async function incrementSessionPrompts(sessionId: string): Promise<void> {
  const session = await getUserSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  await updateUserSession(sessionId, {
    total_prompts: session.total_prompts + 1
  });
}

export async function incrementSessionTrials(sessionId: string): Promise<void> {
  const session = await getUserSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  await updateUserSession(sessionId, {
    total_trials: session.total_trials + 1
  });
}

export async function getCompletedUserSessions(userId: string): Promise<UserSession[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .not('submitted_result', 'is', null)
    .not('submit_time', 'is', null)
    .order('submit_time', { ascending: false });

  if (error) {
    console.error('Error getting completed user sessions:', error);
    return [];
  }

  return data || [];
}



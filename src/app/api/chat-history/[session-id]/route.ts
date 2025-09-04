import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ 'session-id': string }> }
) {
  try {
    const { 'session-id': sessionId } = await params;
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    
    // Fetch chat interactions for the given session, ordered by prompt_index_no
    const { data: interactions, error } = await supabase
      .from('chat_interactions')
      .select('prompt, response, prompt_index_no, created_at')
      .eq('session_id', sessionId)
      .order('prompt_index_no', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return Response.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    if (!interactions || interactions.length === 0) {
      return Response.json({ error: 'No chat history found for this session' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const messages = interactions.flatMap(interaction => [
      {
        id: `user-${interaction.prompt_index_no}`,
        role: 'user' as const,
        content: interaction.prompt
      },
      ...(interaction.response ? [{
        id: `assistant-${interaction.prompt_index_no}`,
        role: 'assistant' as const,
        content: interaction.response
      }] : [])
    ]);

    return Response.json({ messages });
  } catch (error) {
    console.error('Chat history API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

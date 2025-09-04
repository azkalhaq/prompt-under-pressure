import { NextRequest } from 'next/server';
import { insertChatInteraction } from '@/lib/chat-interactions';
import { getSupabaseServerClient } from '@/lib/supabase';
import { createUserSession, updateUserSession, getUserSession, incrementSessionPrompts } from '@/lib/user-sessions';
import { collectServerSideFingerprint } from '@/utils/browserFingerprint';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;
    console.log('[chat-db API] action:', action);

    switch (action) {
      case 'insert_interaction':
        await insertChatInteraction(data);
        break;
      
      case 'create_session':
        console.log('[chat-db API] create_session payload:', {
          userId: data?.userId,
          sessionId: data?.sessionId,
          routePath: data?.routePath,
        });
        // Collect browser fingerprinting data from server and merge with client data
        const serverBrowserData = collectServerSideFingerprint(req);
        const clientBrowserData = data.browserData || {};
        
        // Merge client and server data, preferring client data for client-specific fields
        const mergedBrowserData = {
          ...serverBrowserData,
          ...clientBrowserData,
          // Keep server data for fields that can't be determined client-side
          user_agent: clientBrowserData.user_agent || serverBrowserData.user_agent,
          language: clientBrowserData.language || serverBrowserData.language,
          platform: clientBrowserData.platform || serverBrowserData.platform,
          screen_width: clientBrowserData.screen_width || serverBrowserData.screen_width,
          screen_height: clientBrowserData.screen_height || serverBrowserData.screen_height,
          timezone: clientBrowserData.timezone || serverBrowserData.timezone,
          query_params: clientBrowserData.query_params || serverBrowserData.query_params
        };
        
        // Extract query parameters from the request
        const queryParams = {
          utm_source: data.utm_source,
          audio: data.audio,
          query_params: data.query_params,
        };
        
        await createUserSession(data.userId, data.sessionId, data.routePath, mergedBrowserData, queryParams);
        console.log('[chat-db API] create_session success for sessionId:', data.sessionId);
        break;
      
      case 'update_session':
        await updateUserSession(data.sessionId, data.updates);
        break;
      
      case 'get_session':
        const session = await getUserSession(data.sessionId);
        return Response.json({ session });
      
      case 'increment_prompts':
        await incrementSessionPrompts(data.sessionId);
        break;
      
      case 'set_reaction': {
        const supabase = getSupabaseServerClient();
        const sessionId: string = data?.sessionId;
        const reaction: 'up' | 'down' = data?.reaction;
        if (!sessionId || !reaction || !['up','down'].includes(reaction)) {
          return Response.json({ error: 'sessionId and reaction are required' }, { status: 400 });
        }
        // Find latest interaction for this session
        const { data: rows, error: selErr } = await supabase
          .from('chat_interactions')
          .select('id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (selErr) {
          throw new Error(selErr.message);
        }
        const latestId = rows && rows[0]?.id;
        if (!latestId) {
          return Response.json({ error: 'No interaction found for session' }, { status: 404 });
        }
        const { error: updErr } = await supabase
          .from('chat_interactions')
          .update({ reaction })
          .eq('id', latestId);
        if (updErr) {
          throw new Error(updErr.message);
        }
        break;
      }
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Chat DB API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

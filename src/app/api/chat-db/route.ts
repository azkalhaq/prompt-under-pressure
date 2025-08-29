import { NextRequest } from 'next/server';
import { 
  insertChatInteraction, 
  createUserSession, 
  updateUserSession, 
  getUserSession,
  incrementSessionPrompts 
} from '@/lib/chat-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'insert_interaction':
        await insertChatInteraction(data);
        break;
      
      case 'create_session':
        await createUserSession(data.userId, data.sessionId, data.routePath);
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

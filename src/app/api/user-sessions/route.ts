import { NextRequest, NextResponse } from 'next/server';
import { getCompletedUserSessions } from '@/lib/user-sessions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }

    const sessions = await getCompletedUserSessions(userId);
    
    return NextResponse.json({ 
      success: true, 
      sessions 
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user sessions' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserById } from '../../../lib/user-db';
import type { CreateUserRequest } from '../../../types/user';

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Create the user
    const result = await createUser(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users - Get user information
 * Query parameters: email, user_id, or username
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const user_id = searchParams.get('user_id');
    const username = searchParams.get('username');
    
    if (!email && !user_id && !username) {
      return NextResponse.json(
        { success: false, error: 'Must provide email, user_id, or username parameter' },
        { status: 400 }
      );
    }
    
    let user = null;
    
    if (email) {
      user = await getUserByEmail(email);
    } else if (user_id) {
      user = await getUserById(user_id);
    } else if (username) {
      // Import the function for username lookup
      const { getUserByUsername } = await import('../../../lib/user-db');
      user = await getUserByUsername(username);
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, user });
    
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

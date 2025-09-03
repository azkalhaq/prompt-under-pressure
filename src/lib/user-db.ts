import { getSupabaseServerClient } from './supabase';
import { generateUserId, generateUsernameFromEmail, isValidEmail, sanitizeInput } from '../utils/userUtils';
import type { User, CreateUserRequest, CreateUserResponse, UserExistsResponse } from '../types/user';

/**
 * Database operations for user management
 */

/**
 * Creates a new user in the database
 * @param userData - User data to create
 * @returns Promise with creation result
 */
export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Validate email
    if (!isValidEmail(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(userData.email.toLowerCase()),
      name: userData.name ? sanitizeInput(userData.name) : null,
      username: userData.username ? sanitizeInput(userData.username) : generateUsernameFromEmail(userData.email)
    };
    
    // Check if user already exists
    const existingUser = await getUserByEmail(sanitizedData.email);
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Check if username is already taken
    if (sanitizedData.username !== generateUsernameFromEmail(userData.email)) {
      const existingUsername = await getUserByUsername(sanitizedData.username);
      if (existingUsername) {
        return { success: false, error: 'Username already taken' };
      }
    }
    
    // Generate unique user_id
    let user_id: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      user_id = generateUserId(5);
      attempts++;
      
      if (attempts > maxAttempts) {
        return { success: false, error: 'Failed to generate unique user ID' };
      }
    } while (await getUserById(user_id));
    
    // Insert new user
    const insertData: {
      user_id: string;
      email: string;
      username: string;
      name?: string;
    } = {
      user_id,
      email: sanitizedData.email,
      username: sanitizedData.username
    };
    
    // Only add name if it's provided
    if (sanitizedData.name) {
      insertData.name = sanitizedData.name;
    }
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Database error occurred' };
    }
    
    return { success: true, user: newUser as User };
    
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Gets a user by their user_id
 * @param user_id - Unique user identifier
 * @returns Promise with user data or null
 */
export async function getUserById(user_id: string): Promise<User | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Gets a user by their email
 * @param email - User's email address
 * @returns Promise with user data or null
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Gets a user by their username
 * @param username - User's username
 * @returns Promise with user data or null
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * Checks if a user exists by email
 * @param email - Email to check
 * @returns Promise with existence check result
 */
export async function checkUserExists(email: string): Promise<UserExistsResponse> {
  try {
    const user = await getUserByEmail(email);
    return {
      exists: !!user,
      user: user || undefined
    };
  } catch (error) {
    console.error('Error checking user existence:', error);
    return { exists: false };
  }
}

/**
 * Updates user information
 * @param user_id - User's unique identifier
 * @param updates - Fields to update
 * @returns Promise with update result
 */
export async function updateUser(user_id: string, updates: Partial<Pick<User, 'name' | 'username'>>): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Sanitize inputs
    const sanitizedUpdates: Partial<Pick<User, 'name' | 'username'>> & { updated_at?: string } = {};
    if (updates.name) sanitizedUpdates.name = sanitizeInput(updates.name);
    if (updates.username) sanitizedUpdates.username = sanitizeInput(updates.username);
    
    // Add updated_at timestamp
    sanitizedUpdates.updated_at = new Date().toISOString();
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Database error occurred' };
    }
    
    return { success: true, user: updatedUser as User };
    
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

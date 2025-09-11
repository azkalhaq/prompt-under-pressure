/**
 * User-related type definitions
 */

export interface User {
  id: number;
  user_id: string;
  email: string | null;
  username: string;
  name: string;
  passcode: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email?: string;
  username?: string;
  name?: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserExistsResponse {
  exists: boolean;
  user?: User;
}

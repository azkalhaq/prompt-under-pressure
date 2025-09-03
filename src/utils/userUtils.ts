/**
 * Utility functions for user management
 */

/**
 * Generates a unique user ID with configurable length
 * @param length - Length of the user ID (default: 12)
 * @returns A unique alphanumeric user ID
 */
export function generateUserId(length: number = 5): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Ensure first character is a letter
  result += chars.charAt(Math.floor(Math.random() * 52));
  
  // Generate remaining characters
  for (let i = 1; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a username from email if no username is provided
 * @param email - User's email address
 * @returns Username derived from email
 */
export function generateUsernameFromEmail(email: string): string {
  return email.split('@')[0];
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes user input for database storage
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

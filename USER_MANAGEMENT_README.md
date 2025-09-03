# User Management System

This document describes the user management system implemented for the Next.js Pup Project.

## Overview

The user management system provides a complete solution for creating, retrieving, and managing users in the application. It includes:

- Database table for storing user information
- API endpoints for user operations
- Utility functions for user ID generation and validation
- React components for user registration
- TypeScript interfaces for type safety

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) UNIQUE NOT NULL,             -- unique user identifier (generated unique id based on n alphanumeric char - configurable)
    email VARCHAR(255) UNIQUE,                        -- user's email address
    username VARCHAR(255) UNIQUE,                     -- username (optional, default value use email)
    name VARCHAR(255),                                -- fullname
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- record creation time
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()     -- record update time
);
```

### Indexes

- `idx_users_user_id` - For fast lookups by user_id
- `idx_users_email` - For fast lookups by email
- `idx_users_username` - For fast lookups by username

## API Endpoints

### POST /api/users

Creates a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "user_id": "abc123def456",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/users

Retrieves user information. Must provide one of the following query parameters:

- `?email=user@example.com` - Get user by email
- `?user_id=abc123` - Get user by user_id
- `?username=johndoe` - Get user by username

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "user_id": "abc123def456",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Utility Functions

### User ID Generation

```typescript
import { generateUserId } from '../utils/userUtils';

// Generate a 12-character unique user ID
const userId = generateUserId(12); // e.g., "aB3cD4eF5gH6"

// Generate a default 12-character user ID
const defaultUserId = generateUserId(); // e.g., "xY9zW2vU8tR7"
```

### Username Generation

```typescript
import { generateUsernameFromEmail } from '../utils/userUtils';

// Generate username from email
const username = generateUsernameFromEmail("john.doe@example.com"); // "john.doe"
```

### Input Validation

```typescript
import { isValidEmail, sanitizeInput } from '../utils/userUtils';

// Validate email format
const isValid = isValidEmail("user@example.com"); // true

// Sanitize user input
const sanitized = sanitizeInput("<script>alert('xss')</script>"); // "scriptalert('xss')/script"
```

## Database Operations

### Creating Users

```typescript
import { createUser } from '../lib/user-db';

const result = await createUser({
  email: "user@example.com",
  name: "John Doe",
  username: "johndoe" // optional
});

if (result.success) {
  console.log('User created:', result.user);
} else {
  console.error('Error:', result.error);
}
```

### Retrieving Users

```typescript
import { getUserByEmail, getUserById, getUserByUsername } from '../lib/user-db';

// Get user by email
const userByEmail = await getUserByEmail("user@example.com");

// Get user by user_id
const userById = await getUserById("abc123def456");

// Get user by username
const userByUsername = await getUserByUsername("johndoe");
```

### Checking User Existence

```typescript
import { checkUserExists } from '../lib/user-db';

const result = await checkUserExists("user@example.com");
if (result.exists) {
  console.log('User exists:', result.user);
} else {
  console.log('User not found');
}
```

### Updating Users

```typescript
import { updateUser } from '../lib/user-db';

const result = await updateUser("abc123def456", {
  name: "John Smith",
  username: "johnsmith"
});

if (result.success) {
  console.log('User updated:', result.user);
} else {
  console.error('Error:', result.error);
}
```

## React Components

### UserRegistration Component

A complete form component for user registration:

```tsx
import UserRegistration from '../components/UserRegistration';

<UserRegistration 
  onUserCreated={(user) => {
    console.log('User created:', user);
    // Handle successful user creation
  }}
  className="custom-styles"
/>
```

## Features

### Automatic User ID Generation

- Generates unique, configurable-length alphanumeric user IDs
- Ensures uniqueness through database constraints
- Configurable length (default: 12 characters)
- First character is always a letter

### Username Handling

- Optional username field
- Automatically generates username from email if not provided
- Ensures username uniqueness
- Sanitizes input to prevent XSS

### Input Validation & Sanitization

- Email format validation
- Input sanitization to prevent XSS attacks
- Required field validation
- Database constraint enforcement

### Error Handling

- Comprehensive error messages
- Database error handling
- Validation error handling
- Graceful fallbacks

## Security Considerations

1. **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
2. **Email Validation**: Strict email format validation
3. **Unique Constraints**: Database-level uniqueness enforcement
4. **Error Handling**: No sensitive information leaked in error messages
5. **Type Safety**: Full TypeScript support for type safety

## Testing

Visit `/test-users` to test the user management functionality:

- User registration form
- API endpoint documentation
- Database schema display
- Real-time user creation testing

## Database Setup

To set up the database, run the SQL commands in `sql/database-setup.sql`. The users table will be created automatically when the application starts.

## Environment Variables

Ensure the following environment variables are set:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Dependencies

The system uses the following dependencies:

- `@supabase/supabase-js` - Database client
- `next` - Next.js framework
- `react` - React library
- `typescript` - TypeScript support

## Future Enhancements

Potential improvements for the user management system:

1. **Password Authentication**: Add secure password handling
2. **Email Verification**: Implement email verification workflow
3. **User Roles**: Add role-based access control
4. **Profile Management**: Enhanced user profile features
5. **Bulk Operations**: Support for bulk user operations
6. **Audit Logging**: Track user creation and modification history

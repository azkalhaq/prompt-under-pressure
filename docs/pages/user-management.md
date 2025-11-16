# User Management System

> **Disclaimer:** This documentation was generated with assistance from an AI model. Please verify details against the codebase before relying on it.

This document covers the user management surface area for the Prompting Under Pressure platform: database schema, API endpoints, helper utilities, and UI entry points. It reflects the current implementation as of `sql/database-setup.sql` and `src/app/api/users/route.ts`.

## Overview

The system provides:

- A Postgres table (`users`) for storing participant metadata and six-digit passcodes.
- Admin-protected API endpoints for creating and fetching users (with optional HTTP Basic Auth).
- Utility helpers for ID generation, username derivation, and sanitisation.
- React flows for admin/test operators to register or locate users.

## Database Schema

### `users` Table

```sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) UNIQUE NOT NULL,             -- externally shared participant ID
    email VARCHAR(255) UNIQUE,                        -- optional email address
    username VARCHAR(255) UNIQUE,                     -- optional username handle
    name VARCHAR(255),                                -- full name or label
    passcode VARCHAR(6) NOT NULL,                     -- six-digit numeric passcode
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- record creation time
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()     -- record update time
);
```

Related indexes (created in `sql/database-setup.sql`):

- `idx_users_user_id`
- `idx_users_email`
- `idx_users_username`
- `idx_users_passcode`

### Passcode Behaviour

- Generated automatically when a user is created (see `lib/user-db.ts`).
- 6 digits, zero-padded (e.g., `042193`).
- Usable as a lookup parameter via `GET /api/users?passcode=...`.

## API Endpoints

Endpoints live in `src/app/api/users/route.ts`.

### Authentication

- Toggle HTTP Basic Auth with `USERS_API_BASIC_AUTH_ENABLED=true`.
- Credentials pulled from `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS`.
- If enabled and not provided, POST requests return `401 Unauthorized`.

### POST `/api/users`

Create or upsert a user record. The handler:

- Accepts `CreateUserRequest` (see `types/user.ts`) containing any combination of `email`, `user_id`, `name`, `username`, `passcode`.
- Generates `user_id` / `passcode` when omitted.
- Prevents duplicates by checking existing users.

Example request:

```json
{
  "email": "participant@example.com",
  "name": "Participant 12",
  "user_id": "P12ALPHA",
  "username": "participant12"
}
```

Success response:

```json
{
  "success": true,
  "user": {
    "id": 42,
    "user_id": "P12ALPHA",
    "email": "participant@example.com",
    "username": "participant12",
    "name": "Participant 12",
    "passcode": "084391",
    "created_at": "2025-01-05T19:44:12.239Z",
    "updated_at": "2025-01-05T19:44:12.239Z"
  }
}
```

### GET `/api/users`

Fetch a user by one of the following query parameters:

- `user_id`
- `email`
- `username`
- `passcode`

If none are provided, the API returns `400`. Unknown users respond with `404`.

```http
GET /api/users?passcode=084391
```

Response:

```json
{
  "success": true,
  "user": {
    "user_id": "P12ALPHA",
    "email": "participant@example.com",
    "username": "participant12",
    "name": "Participant 12",
    "passcode": "084391",
    "created_at": "2025-01-05T19:44:12.239Z",
    "updated_at": "2025-01-05T19:44:12.239Z"
  }
}
```

## TypeScript Interfaces & Utilities

Key exports live under `src/lib/user-db.ts` and `src/utils/userUtils.ts`.

### ID & Username Helpers

```typescript
import { generateUserId, generateUsernameFromEmail } from '@/utils/userUtils';

const userId = generateUserId(12);     // e.g. "AB3D7K9QRT12"
const fallbackId = generateUserId();   // defaults to 12 characters

const username = generateUsernameFromEmail('alex.taylor@example.org'); // "alex.taylor"
```

### Validation & Sanitisation

```typescript
import { isValidEmail, sanitizeInput } from '@/utils/userUtils';

isValidEmail('person@example.com'); // true
sanitizeInput("<script>alert('x')</script>"); // "scriptalert('x')/script"
```

### Database Helpers

```typescript
import {
  createUser,
  updateUser,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  getUserByPasscode,
  checkUserExists,
} from '@/lib/user-db';

const created = await createUser({ email: 'person@example.com' });
const fetched = await getUserByPasscode('084391');
const updated = await updateUser('P12ALPHA', { name: 'Alex Taylor' });
```

- `createUser` and `updateUser` enforce email format, username uniqueness, and passcode generation.
- `checkUserExists` tries email, username, and user ID automatically.

## React Interfaces

- `src/components/UserRegistration.tsx` — admin registration form using above helpers.
- `src/app/login/page.tsx` — participant login screen that validates IDs through `GET /api/users`.

These components rely on the same API contract described above.

## Operational Notes

- Ensure the server has `USERS_API_BASIC_AUTH_ENABLED=false` when exposing POST `/api/users` publicly (e.g., kiosk registration). Enable it for controlled admin-only contexts.
- The API is stateless; there is no session cookie or authentication beyond optional Basic Auth.
- Passcodes should be treated as sensitive; avoid exposing them to participants unless they are part of the study design.

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

### Updated Schema

The `user_sessions` table now includes additional fields for enhanced tracking:

```sql
-- New columns added to user_sessions table
utm_source VARCHAR(255),                           -- UTM source parameter for tracking
audio BOOLEAN DEFAULT FALSE,                       -- audio parameter (true if audio=1 in query)
```

### Query Parameter Handling

The system now automatically captures and stores:
- **UTM Source**: `?utm_source=value` for campaign tracking
- **Audio Flag**: `?audio=1` to enable background audio
- **User ID**: `?u=value` for user identification
- **All Query Params**: Stored as text for complete tracking

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

## Audio Functionality

The system now includes background audio capabilities that activate after user interaction:

### Features
- **Query Parameter Control**: Enable with `?audio=1` in URL
- **User Interaction Required**: Audio only starts after clicking "Get Started" button
- **Cross-Page Support**: Works on all pages except `/thank-you`
- **Automatic Cleanup**: Audio stops when navigating away or disabling

### Usage
```typescript
import { useAudio } from '@/hooks/useAudio';

// In your component
const { isAudioEnabled, markUserInteraction } = useAudio(searchParams);

// Audio will automatically start after user interaction
// when the Sidebar's "Get Started" button is clicked
```

### Implementation Details
- Uses custom `audioActivation` event for cross-component communication
- Integrates with existing session management system
- Automatically handles browser autoplay restrictions
- Configurable audio file, volume, and loop settings

## Future Enhancements

Potential improvements for the user management system:

1. **Password Authentication**: Add secure password handling
2. **Email Verification**: Implement email verification workflow
3. **User Roles**: Add role-based access control
4. **Profile Management**: Enhanced user profile features
5. **Bulk Operations**: Support for bulk user operations
6. **Audit Logging**: Track user creation and modification history

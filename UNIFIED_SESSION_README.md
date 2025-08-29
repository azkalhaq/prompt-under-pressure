# Unified Session System

This document describes the unified session system that manages both Stroop test trials and Chat interactions in a single session.

## Database Schema

### user_sessions Table
The main session table that tracks user sessions across both Stroop tests and Chat interactions.

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_stroop_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_trials INTEGER DEFAULT 0,
    total_prompts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `user_id`: The user identifier
- `session_id`: Unique session identifier (shared between chat and stroop)
- `session_start_time`: When the session was first created
- `start_stroop_time`: When the Stroop test started (nullable if no stroop test)
- `end_time`: When the session ended (nullable if still active)
- `total_trials`: Number of Stroop trials completed
- `total_prompts`: Number of chat interactions completed

### stroop_trials Table
Stores individual Stroop test trial data.

```sql
CREATE TABLE stroop_trials (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    trial_number INTEGER NOT NULL,
    instruction TEXT NOT NULL CHECK (instruction IN ('word', 'color')),
    text TEXT NOT NULL,
    text_color TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('consistent', 'inconsistent')),
    iti INTEGER NOT NULL,
    reaction_time INTEGER,
    correctness BOOLEAN,
    user_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);
```

### chat_interactions Table
Stores individual chat interaction data.

```sql
CREATE TABLE chat_interactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    prompt TEXT NOT NULL,
    response TEXT,
    model TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd DECIMAL(10, 6),
    api_call_id TEXT,
    raw_request JSONB,
    raw_respond JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);
```

## API Endpoints

### Chat Database API (`/api/chat-db`)

Handles all chat and session-related database operations.

**Actions:**
- `insert_interaction`: Insert a new chat interaction
- `create_session`: Create a new user session
- `update_session`: Update session data
- `get_session`: Retrieve session information
- `increment_prompts`: Increment the total prompts count

### Stroop API (`/api/stroop`)

Handles Stroop trial data insertion.

**Actions:**
- `insert_trial`: Insert a new Stroop trial

### Chat API (`/api/chat`)

Handles chat completion and automatically manages session creation and interaction logging.

## Session Management

### Session ID Generation
Sessions are managed using a shared session ID that is:
1. Generated when a user first accesses any page
2. Stored in a cookie (`sid`) for persistence
3. Used consistently across both chat and Stroop components
4. Automatically creates a database session record on page load

### Browser Close Detection
The system automatically detects when users close their browser or navigate away from the page:
- Uses `beforeunload` and `pagehide` events for comprehensive coverage
- Uses `navigator.sendBeacon()` for reliable data transmission during page unload
- Falls back to `fetch()` with `keepalive: true` for older browsers
- Automatically updates session `end_time` when browser closes

### Session Lifecycle
1. **Session Creation**: When a user first accesses any page (automatic on page load)
2. **Session Updates**: 
   - Chat interactions increment `total_prompts`
   - Stroop trials increment `total_trials`
   - Stroop start time is recorded when Stroop test begins
3. **Session End**: Automatically detected when user closes browser, refreshes page, or navigates away

## Usage Examples

### Creating a Session
```typescript
await fetch('/api/chat-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_session',
    data: { userId: 'user123', sessionId: 'session456' }
  })
});
```

### Inserting a Chat Interaction
```typescript
await fetch('/api/chat-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'insert_interaction',
    data: {
      user_id: 'user123',
      session_id: 'session456',
      role: 'user',
      prompt: 'Hello, how are you?',
      response: 'I am doing well, thank you!',
      model: 'gpt-4',
      tokens_input: 10,
      tokens_output: 8,
      cost_usd: 0.002
    }
  })
});
```

### Inserting a Stroop Trial
```typescript
await fetch('/api/stroop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'insert_trial',
    data: {
      user_id: 'user123',
      session_id: 'session456',
      trial_number: 1,
      instruction: 'word',
      text: 'BLUE',
      text_color: 'red',
      condition: 'inconsistent',
      iti: 1000,
      reaction_time: 1500,
      correctness: true,
      user_answer: 'blue'
    }
  })
});
```

## Migration

If you have existing data, use the `migration-script.sql` file to migrate from the old structure to the new unified session system.

## Environment Variables

The system uses the same environment variables as before:
- `NEXT_PUBLIC_STROOP_ITI`: Inter-trial interval in milliseconds
- `NEXT_PUBLIC_STROOP_TRIAL_TIMER`: Trial timer in milliseconds (0 for no timer)
- `NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH`: Number of trials before switching instruction

## Benefits of Unified Sessions

1. **Consistent Session Tracking**: Both chat and Stroop data are linked to the same session
2. **Better Analytics**: Can analyze user behavior across both activities
3. **Simplified Management**: Single session ID for all interactions
4. **Data Integrity**: Foreign key constraints ensure data consistency
5. **Scalability**: Easy to add new activity types in the future

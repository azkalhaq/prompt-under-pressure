# Share Feature - Read-Only Chat History

This feature allows users to view read-only chat history from any session using a shareable URL.

## Overview

The share feature provides a way to view complete conversations between users and AI agents without requiring authentication or the ability to continue the conversation.

## Features

- **Read-only access**: No chat input box, just conversation display
- **Session-based**: Access via unique session ID
- **Consistent UI**: Uses the same chat layout as task-1 for consistency
- **No sidebar**: Clean, focused view without navigation elements
- **No reactions**: Thumbs up/down actions are hidden for read-only mode
- **Responsive design**: Works on all device sizes

## URL Structure

```
/share/{session-id}
```

Where `{session-id}` is the unique identifier for a chat session.

## Implementation Details

### API Endpoint

- **Route**: `/api/chat-history/[session-id]`
- **Method**: GET
- **Purpose**: Fetches chat interactions for a specific session
- **Response**: JSON with messages array containing user and assistant messages

### Page Component

- **Location**: `src/app/share/[session-id]/page.tsx`
- **Features**: 
  - Fetches chat history on mount
  - Displays loading states
  - Handles errors gracefully
  - Shows empty state when no messages exist

### Shell Integration

- **Sidebar**: Hidden for share routes (`/share/*`)
- **Layout**: Clean, focused view without navigation chrome

### Reaction Controls

- **Thumbs up/down**: Hidden for all messages in share mode
- **Copy functionality**: Still available for copying message content
- **Read-only mode**: No interactive feedback mechanisms

## Database Schema

The feature uses the existing `chat_interactions` table:

```sql
SELECT prompt, response, prompt_index_no, created_at
FROM chat_interactions
WHERE session_id = $1
ORDER BY prompt_index_no ASC
```

## Message Format

Messages are transformed from database records to UI format:

```typescript
type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
}
```

## Error Handling

- **404**: No chat history found for session
- **500**: Server error during fetch
- **Network errors**: Graceful fallback with user-friendly messages

## Usage Examples

### Valid URLs
- `/share/abc123-def456-ghi789`
- `/share/session_2024_01_15_user_123`

### Error Scenarios
- Invalid session ID format
- Session doesn't exist
- Database connection issues
- Malformed session data

## Security Considerations

- **Public access**: No authentication required
- **Session validation**: Only validates session ID format
- **Data exposure**: All chat content is publicly visible
- **Rate limiting**: Consider implementing if needed

## Future Enhancements

- **Password protection**: Optional session passwords
- **Expiration dates**: Auto-expiring shared links
- **Analytics**: Track share link usage
- **Export options**: PDF/CSV download of conversations
- **Partial sharing**: Share specific message ranges

## Testing

To test the feature:

1. Start the development server: `npm run dev`
2. Navigate to `/share/{valid-session-id}`
3. Verify chat history loads correctly
4. Test with invalid session IDs
5. Check responsive behavior on different screen sizes

## Dependencies

- Next.js 15+ (for dynamic route handling)
- Supabase (for database access)
- React hooks (useState, useEffect, useParams)
- Existing ChatItem component for message display

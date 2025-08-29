# Stroop Test Component

This component implements a classic Stroop test for measuring cognitive interference and processing speed. The test presents color words (RED, BLUE, GREEN, YELLOW) in different colors and asks participants to either name the word or identify the color.

## Features

### Data Collection
The component records the following data for each trial:
- **User ID**: Unique identifier for the participant
- **Session ID**: Unique identifier for each test session
- **Trial Number**: Sequential number of trials in the session
- **Instruction**: Whether to choose the word or color
- **Text**: The displayed word (RED, BLUE, GREEN, YELLOW)
- **Text Color**: The color of the displayed text
- **Condition**: Consistent (word matches color) or inconsistent (word doesn't match color)
- **ITI**: Inter-trial interval in milliseconds
- **Reaction Time**: Participant response time in milliseconds
- **Correctness**: Whether the response was correct (true/false/null for timeouts)

### Configuration
The component is configurable via environment variables:

```env
# Inter-trial interval in milliseconds (default: 1000ms)
NEXT_PUBLIC_STROOP_ITI=1000

# Trial timer in milliseconds (0 = no timer, default: 5000ms)
NEXT_PUBLIC_STROOP_TRIAL_TIMER=5000

# Number of trials before switching instruction (default: 10)
NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH=10
```

### Key Features
1. **Inter-trial Interval**: Configurable countdown between trials
2. **Trial Timer**: Optional timer for each trial (0 = no timer)
3. **Automatic Timeout**: Moves to next trial if timer expires
4. **Instruction Switching**: Alternates between word/color instructions
5. **Visual Feedback**: Green/red feedback for correct/incorrect responses
6. **Database Integration**: Automatically saves all trial data
7. **Session Management**: Creates and manages test sessions

## Setup

### 1. Database Setup
Run the SQL commands in `stroop-database-setup.sql` in your Supabase SQL editor to create the required tables:

```sql
-- Create stroop_sessions and stroop_trials tables
-- (See stroop-database-setup.sql for complete schema)
```

### 2. Environment Configuration
Add the following variables to your `.env.local` file:

```env
# Stroop Test Configuration
NEXT_PUBLIC_STROOP_ITI=1000
NEXT_PUBLIC_STROOP_TRIAL_TIMER=5000
NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH=10
```

### 3. Component Usage
The Stroop test component is already integrated into the task-2 page. It appears side-by-side with the chat interface.

## Database Schema

### stroop_sessions
- `id`: Primary key
- `user_id`: Participant identifier
- `session_id`: Unique session identifier
- `start_time`: Session start timestamp
- `end_time`: Session end timestamp (nullable)
- `total_trials`: Number of completed trials
- `created_at`: Record creation timestamp

### stroop_trials
- `id`: Primary key
- `user_id`: Participant identifier
- `session_id`: Session identifier (foreign key)
- `trial_number`: Sequential trial number
- `instruction`: 'word' or 'color'
- `text`: Displayed word
- `text_color`: Color of the text
- `condition`: 'consistent' or 'inconsistent'
- `iti`: Inter-trial interval
- `reaction_time`: Response time in milliseconds (nullable)
- `correctness`: Response accuracy (nullable for timeouts)
- `created_at`: Record creation timestamp

## API Endpoints

The component uses the following API endpoints:

- `POST /api/stroop` - Handles all Stroop-related database operations
  - `action: 'create_session'` - Creates a new test session
  - `action: 'insert_trial'` - Saves trial data
  - `action: 'update_session'` - Updates session information

## Component States

1. **Initial State**: Shows start button
2. **ITI State**: Shows countdown between trials
3. **Active Trial**: Shows stimulus and response buttons
4. **Feedback State**: Shows correct/incorrect feedback
5. **Session Complete**: Shows completion message

## Customization

### Modifying Colors
Update the `COLORS` and `COLOR_WORDS` arrays in the component:

```typescript
const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
```

### Adding More Instructions
Extend the instruction types and logic:

```typescript
type Instruction = 'word' | 'color' | 'font_size' | 'position';
```

### Modifying Trial Generation
Customize the `generateTrial` function to change trial characteristics:

```typescript
const generateTrial = useCallback((): StroopTrial => {
  // Custom trial generation logic
}, [instruction]);
```

## Troubleshooting

### Database Connection Issues
- Ensure Supabase credentials are correctly configured
- Check that database tables exist and have proper permissions
- Verify API routes are accessible

### Timer Issues
- Check environment variable configuration
- Ensure timers are properly cleared on component unmount
- Verify countdown logic in useEffect hooks

### Performance Issues
- Monitor database query performance
- Consider implementing pagination for large datasets
- Optimize component re-renders with useCallback and useMemo

## Data Analysis

The collected data can be analyzed for:
- **Reaction Time Analysis**: Compare consistent vs inconsistent conditions
- **Accuracy Analysis**: Measure error rates across conditions
- **Learning Effects**: Track performance over trials
- **Individual Differences**: Compare performance across participants

## Security Considerations

- User IDs should be validated and sanitized
- Consider implementing rate limiting for API endpoints
- Use Row Level Security (RLS) in Supabase for data protection
- Validate all input data before database insertion

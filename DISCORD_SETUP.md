# Discord Integration Setup

## Overview
The registration flow now requires users to be members of the Ascend Discord server before they can complete their registration.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration (already configured)
VITE_SUPABASE_URL=https://wdcwyvfeegchjadtyhkh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Discord Configuration (NEW - REQUIRED)
VITE_DISCORD_GUILD_ID=your_discord_server_id_here
```

## Getting Your Discord Guild (Server) ID

1. **Enable Developer Mode in Discord:**
   - Open Discord Settings (gear icon)
   - Navigate to **Advanced** under "App Settings"
   - Toggle **Developer Mode** ON

2. **Get Your Server ID:**
   - Right-click on your Ascend server name in the left sidebar
   - Click **Copy Server ID**
   - Paste this value into `VITE_DISCORD_GUILD_ID` in your `.env.local`

## Discord OAuth Scopes

The OAuth flow now requests the following scopes:
- `identify` - Get basic user info
- `email` - Get user's email
- `guilds` - Check which servers the user is a member of (NEW)

**Note:** You need to update your Discord OAuth application to allow the `guilds` scope:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **General**
4. Ensure these scopes are enabled:
   - `identify`
   - `email`
   - `guilds`
5. Update your Supabase Auth provider settings if needed

## Database Schema

The following table has been created in your Supabase database:

### `player_registrations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users (unique) |
| `riot_id` | TEXT | Player's Riot ID |
| `twitter` | TEXT | Optional Twitter handle |
| `youtube` | TEXT | Optional YouTube channel |
| `owns_account` | BOOLEAN | Confirms account ownership |
| `created_at` | TIMESTAMPTZ | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Security Features:**
- Row Level Security (RLS) enabled
- Users can only view/edit their own registration
- Foreign key constraint ensures data integrity
- Unique constraint prevents duplicate registrations

## Registration Flow

1. **User fills out registration form**
   - Riot ID, social links, account ownership confirmation

2. **On Submit → Discord Check**
   - System checks if user is in Ascend Discord server
   - Uses Discord API with the user's OAuth token

3. **If NOT in Discord:**
   - Shows "Join Ascend Discord to Register" page
   - "Join Ascend" button opens Discord invite
   - "Recheck" button verifies membership again

4. **If IN Discord:**
   - Saves registration to `player_registrations` table
   - Shows "Application Submitted!" success page
   - "Back to Home" button returns to landing page

## Testing

To test the flow:

1. Ensure `VITE_DISCORD_GUILD_ID` is set in `.env.local`
2. Make sure your Discord app has `guilds` scope enabled
3. Test with a user who is NOT in your Discord server (should see join prompt)
4. Test with a user who IS in your Discord server (should save successfully)

## Discord Invite Link

Update the Discord invite link in the code if needed:
- File: `src/pages/LoggedInRegistration.tsx`
- Line: `onClick={() => window.open('https://discord.gg/ascend', '_blank')}`
- Replace `'https://discord.gg/ascend'` with your actual invite link

## Error Handling

All functions include proper try-catch blocks and return structured error responses:

```typescript
{ success: boolean; error?: string }
{ isMember: boolean; error?: string }
```

Errors are displayed to users with actionable messages.


# Routine Scrapper - Cloud Sync Documentation

## Overview

This document explains how the cloud sync functionality works in the Routine Scrapper app. The app uses Supabase as its backend for storing and syncing routine data.

## Supabase Configuration

### Project Details
- **URL**: `https://eyaeohoyskehzhjorxol.supabase.co`
- **API Key**: (See source code for the anon key)

### Database Table: `app_data`

The sync uses a single table called `app_data` with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key - identifies the data type |
| data | jsonb | The actual data being stored |
| updated_at | timestamp | Last update timestamp |

### Data Keys

The app syncs the following data types:

| Key | Description |
|-----|-------------|
| `class_schedule` | Class routine data |
| `teachers` | Teacher database |
| `students` | Student directory |
| `app_version` | App version info for OTA updates |

## Setting Up Your Own Supabase Instance

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: Routine Scrapper
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users

### Step 2: Create the Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create the app_data table
CREATE TABLE public.app_data (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (optional, but recommended)
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (for demo purposes)
CREATE POLICY "Allow public access" ON public.app_data
    FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy the **Project URL**
3. Copy the **anon public** key

### Step 4: Update the App Code

Edit `src/utils/supabaseClient.ts`:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_ANON_KEY'
```

## OTA Updates

The app supports over-the-air (OTA) updates through the Settings panel.

### Version Configuration

To configure update information, insert a record into the `app_data` table:

```sql
INSERT INTO public.app_data (id, data)
VALUES ('app_version', '{"version": "1.0.0", "downloadUrl": "https://example.com/app.apk"}')
ON CONFLICT (id) DO UPDATE SET data = '{"version": "1.0.0", "downloadUrl": "https://example.com/app.apk"}';
```

### Update Data Format

| Field | Description |
|-------|-------------|
| version | Version number (e.g., "1.0.10") |
| downloadUrl | Direct link to the APK file |

## Syncing Data Manually

### Upload to Cloud

```javascript
import { syncSave, SYNC_KEYS } from './utils/supabaseClient'

// Example: Upload class schedule
await syncSave(SYNC_KEYS.SCHEDULE, {
  // your routine data here
})
```

### Download from Cloud

```javascript
import { syncLoad, SYNC_KEYS } from './utils/supabaseClient'

// Example: Load class schedule
const schedule = await syncLoad(SYNC_KEYS.SCHEDULE)
```

## Troubleshooting

### "Failed to fetch" Error

If you see this error:
1. Check your internet connection
2. Verify the Supabase URL and key are correct
3. Make sure the `app_data` table exists
4. Check Supabase project status in the dashboard

### Data Not Syncing

1. Enable Admin Mode in Settings to allow uploads
2. Check the browser console for error messages
3. Verify RLS policies allow writes

## GitHub Release Setup

To host APK files for OTA updates:

1. Create a GitHub repository
2. Go to **Releases** → **Create a new release**
3. Upload your APK file
4. Use the download URL in the format:
   ```
   https://raw.githubusercontent.com/username/repo/commit-hash/app.apk
   ```

## Support

For issues or questions, please open a GitHub issue in the project repository.

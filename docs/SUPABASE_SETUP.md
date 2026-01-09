# Supabase Setup Guide

This guide walks you through setting up your Supabase project for the AI Budget App.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Basic familiarity with SQL

---

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)

2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Project name**: `ai-budget-app` (or any name you prefer)
     - **Database Password**: Generate a strong password and **save it securely**
     - **Region**: Choose closest to your location
     - **Pricing Plan**: Free tier is sufficient for development

3. **Wait for project creation**: This takes 1-2 minutes. You'll see a progress indicator.

---

## Step 2: Run Database Migrations

Once your project is ready:

### Option A: SQL Editor (Recommended)

1. **Open SQL Editor**:
   - In the Supabase dashboard, navigate to **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Run Migration 1 - Schema**:
   - Copy the entire contents of [`supabase/migrations/20260108_initial_schema.sql`](supabase/migrations/20260108_initial_schema.sql)
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - ✅ You should see: "Success. No rows returned"

3. **Run Migration 2 - RLS Policies**:
   - Click **New Query** again
   - Copy contents of [`supabase/migrations/20260108_rls_policies.sql`](supabase/migrations/20260108_rls_policies.sql)
   - Paste and **Run**
   - ✅ You should see multiple "Success" messages for each policy created

4. **Run Migration 3 - Seed Data**:
   - Click **New Query** again
   - Copy contents of [`supabase/migrations/20260108_seed_data.sql`](supabase/migrations/20260108_seed_data.sql)
   - Paste and **Run**
   - ✅ You should see verification notices showing seed data was inserted correctly

### Option B: Supabase CLI (Advanced)

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## Step 3: Verify Database Setup

1. **Check Tables Created**:
   - Go to **Table Editor** in Supabase dashboard
   - You should see 10 tables:
     - `user_preferences`
     - `accounts`
     - `categories`
     - `subcategories`
     - `transactions`
     - `spending_goals`
     - `saving_goals`
     - `ai_corrections`
     - `chat_sessions`
     - `chat_messages`

2. **Verify RLS Enabled**:
   - Go to **Authentication** → **Policies**
   - Each table should have multiple policies (e.g., "Users can view own accounts")

3. **Check Seed Data**:
   - Go to **Table Editor** → **categories**
   - You should see 2 system categories: "Unassigned" (income) and "Unassigned" (expense)
   - Both should have `is_system = true`
   - Go to **subcategories** table
   - You should see 2 system subcategories, both named "Unassigned"

---

## Step 4: Get API Credentials

1. **Navigate to Project Settings**:
   - Click **Settings** (gear icon in left sidebar)
   - Click **API** under Project Settings

2. **Copy Required Values**:
   - **Project URL**: Found under "Project URL" (e.g., `https://abcdefgh.supabase.co`)
   - **API Key (anon public)**: Found under "Project API keys" → "anon public"

   ⚠️ **Important**:
   - Copy the **anon public** key (NOT the service_role key)
   - The anon key is safe to use in your frontend code
   - Never commit the service_role key to git

---

## Step 5: Configure Local Environment

1. **Create `.env.local` file** in project root:

```bash
cp .env.local.example .env.local
```

2. **Edit `.env.local`** and add your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here

# Google AI (Gemini) Configuration (for later phases)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. **Replace placeholders**:
   - `YOUR_PROJECT_REF` with your actual project URL
   - `your_anon_public_key_here` with the anon key you copied

4. **Save the file**

⚠️ **Security Note**: `.env.local` is already in `.gitignore` and will NOT be committed to git.

---

## Step 6: Enable Google OAuth (Optional - for Phase 2)

This step can be skipped for now and completed during Phase 2: Authentication.

1. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

2. **Configure in Supabase**:
   - Go to **Authentication** → **Providers** → **Google**
   - Toggle "Enable Sign in with Google"
   - Paste your Google Client ID and Client Secret
   - Save

---

## Step 7: Test Connection

1. **Start your development server**:

```bash
npm run dev
```

2. **Open browser console** (F12)

3. **Test Supabase connection**:

```javascript
import { supabase } from './src/lib/supabaseClient';

// Test connection
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_system', true);

console.log('System categories:', data);
// Should show 2 Unassigned categories
```

If you see the system categories, your setup is complete! ✅

---

## Troubleshooting

### Error: "Missing VITE_SUPABASE_URL environment variable"

- Make sure `.env.local` exists in project root
- Verify the file contains `VITE_SUPABASE_URL=...`
- Restart your dev server (`npm run dev`)

### Error: "Invalid API key"

- Double-check you copied the **anon public** key (not service_role)
- Verify no extra spaces or line breaks in `.env.local`

### Error: "Failed to fetch" / Connection errors

- Check your Supabase project is not paused (free tier projects pause after inactivity)
- Verify project URL is correct (check for typos)
- Test connection in Supabase dashboard SQL Editor first

### No tables visible in Table Editor

- Re-run the `initial_schema.sql` migration
- Check SQL Editor for error messages
- Verify you ran all 3 migration files in order

### RLS policies blocking queries

- RLS is working correctly! Policies require authentication
- You'll implement auth in Phase 2
- For now, test with SQL Editor (bypasses RLS)

---

## Next Steps

Once Supabase is configured:

1. ✅ Verify `.env.local` is set up correctly
2. ✅ Test connection from React app
3. 🚀 Proceed to **Phase 2: Authentication & User Management**

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## System Category UUIDs (Reference)

These UUIDs are hardcoded in the seed data and available in [`src/config/constants.ts`](src/config/constants.ts):

- **Income Unassigned Category**: `00000000-0000-0000-0000-000000000001`
- **Expense Unassigned Category**: `00000000-0000-0000-0000-000000000002`
- **Income Unassigned Subcategory**: `00000000-0000-0000-0000-000000000003`
- **Expense Unassigned Subcategory**: `00000000-0000-0000-0000-000000000004`

Use these constants when referencing system categories in your code:

```typescript
import { SYSTEM_CATEGORIES, SYSTEM_SUBCATEGORIES } from '@/config/constants';

// Example: Default to unassigned expense subcategory
const defaultSubcategoryId = SYSTEM_SUBCATEGORIES.EXPENSE_UNASSIGNED;
```

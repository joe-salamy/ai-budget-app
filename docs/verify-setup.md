# Phase 1 Verification Checklist

Use this checklist to verify Phase 1 is complete before proceeding to Phase 2.

## ✅ Pre-Deployment Checks (Done by Claude Code)

- [x] Migration files created in `supabase/migrations/`:
  - [x] `20260108_initial_schema.sql` (10 tables, enums, indexes, triggers)
  - [x] `20260108_rls_policies.sql` (RLS enabled on all tables)
  - [x] `20260108_seed_data.sql` (system categories/subcategories)
- [x] Supabase client configured: `src/lib/supabaseClient.ts`
- [x] TypeScript types defined for all database tables
- [x] System constants exported: `src/config/constants.ts`
- [x] Environment variables template: `.env.local.example`
- [x] Setup documentation: `SUPABASE_SETUP.md`
- [x] Updated README with project info
- [x] `.env.local` in `.gitignore`

## 🔧 Manual Setup Steps (To Be Done by User)

Follow these steps in order:

### 1. Create Supabase Project

- [ ] Go to [https://app.supabase.com](https://app.supabase.com)
- [ ] Click "New Project"
- [ ] Enter project name, database password, region
- [ ] Wait for project creation (1-2 minutes)
- [ ] **Save your database password securely**

### 2. Run Database Migrations

- [ ] Open Supabase SQL Editor
- [ ] Run `20260108_initial_schema.sql` → Should see "Success. No rows returned"
- [ ] Run `20260108_rls_policies.sql` → Should see multiple "Success" messages
- [ ] Run `20260108_seed_data.sql` → Should see "Seed data verification PASSED ✓"

### 3. Verify Database Setup

Check in Supabase Dashboard:

- [ ] **Table Editor** shows 10 tables:
  - [ ] user_preferences
  - [ ] accounts
  - [ ] categories
  - [ ] subcategories
  - [ ] transactions
  - [ ] spending_goals
  - [ ] saving_goals
  - [ ] ai_corrections
  - [ ] chat_sessions
  - [ ] chat_messages

- [ ] **Authentication → Policies** shows RLS policies for each table

- [ ] **Table Editor → categories** shows 2 system categories:
  - [ ] "Unassigned" (income) with `is_system = true`
  - [ ] "Unassigned" (expense) with `is_system = true`

- [ ] **Table Editor → subcategories** shows 2 system subcategories:
  - [ ] "Unassigned" under Income category
  - [ ] "Unassigned" under Expense category

### 4. Configure Local Environment

- [ ] Copy `.env.local.example` to `.env.local`:
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] Get Supabase credentials from **Settings → API**:
  - [ ] Copy **Project URL** (e.g., `https://abcdefgh.supabase.co`)
  - [ ] Copy **anon public** API key (NOT service_role)

- [ ] Edit `.env.local` and add credentials:
  ```env
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key_here
  VITE_GEMINI_API_KEY=your_gemini_key (optional for now)
  ```

- [ ] Save `.env.local`

### 5. Test Connection

- [ ] Start dev server:
  ```bash
  npm run dev
  ```

- [ ] Server starts without errors

- [ ] Open browser DevTools console (F12)

- [ ] Test Supabase connection (paste in console):
  ```javascript
  // Import supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    'YOUR_PROJECT_URL',
    'YOUR_ANON_KEY'
  );

  // Test query
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_system', true);

  console.log('System categories:', data);
  console.log('Error:', error);
  ```

- [ ] Console shows 2 system categories (no errors)

## ✅ Phase 1 Complete!

If all checkboxes above are checked, Phase 1 is complete and you're ready for Phase 2.

## 🚨 Troubleshooting

### Migration errors

- **Syntax error**: Check you copied entire SQL file without truncation
- **Foreign key violation**: Run migrations in order (schema → RLS → seed)
- **Permission denied**: You're logged in to the correct Supabase project

### Connection errors

- **"Missing environment variable"**: Ensure `.env.local` exists in project root
- **"Invalid API key"**: Double-check you copied anon key (not service_role)
- **CORS errors**: Supabase project is paused (free tier) - unpause in dashboard
- **Network error**: Check Supabase project URL for typos

### No data in tables

- Seed data migration didn't run - re-run `20260108_seed_data.sql`
- Check SQL Editor for error messages

### RLS blocking queries

- This is correct! RLS requires authentication
- You'll implement auth in Phase 2
- For now, test queries directly in Supabase SQL Editor (bypasses RLS)

## 📚 Reference

- Full setup guide: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Development plan: [plan.md](plan.md)
- Progress tracking: [progress.md](progress.md)

## 🚀 Next Steps

Once Phase 1 verification is complete:

1. Review Phase 2 requirements in [plan.md](plan.md#phase-2-authentication--user-management)
2. Prepare to implement:
   - Auth service (`src/services/auth.ts`)
   - useAuth hook
   - Login/SignUp pages
   - Protected routes
   - Google OAuth integration

---

**Need help?** Refer to troubleshooting sections in [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

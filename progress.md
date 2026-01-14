# Project Progress - AI Budget App

## Current Status

**Phase 7 Complete** ✅ - AI Integration - Single Transaction Categorization

## Completed Milestones

- **Phase 0: Project Setup & Infrastructure** ✅
  - Vite + React 19 + TypeScript initialized with strict mode
  - ESLint and Prettier configured
  - Tailwind CSS 4 installed and configured with dark theme CSS variables
  - shadcn/ui dependencies installed (class-variance-authority, clsx, tailwind-merge, lucide-react)
  - Complete folder structure created: src/{components/{ui,features},pages,services,hooks,lib,types,config}, api/, supabase/migrations/
  - Core dependencies installed: react-router-dom, @supabase/supabase-js, recharts, @nivo/sankey, date-fns, zod, react-markdown
  - [Router.tsx](src/Router.tsx) with all routes (public + protected)
  - [AppLayout.tsx](src/components/AppLayout.tsx) with header, navigation, AI button placeholder
  - All pages created: Landing, Login, SignUp, Dashboard, Setup, TransactionInput, TransactionHistory, Settings
  - [App.tsx](src/App.tsx) configured to use Router
  - [vercel.json](vercel.json) for deployment config
  - [.env.local.example](.env.local.example) with required vars
  - TypeScript types defined in [src/types/index.ts](src/types/index.ts)
  - Utility functions in [src/lib/utils.ts](src/lib/utils.ts)
  - Constants in [src/config/constants.ts](src/config/constants.ts)

- **Phase 1: Database Schema & Backend Setup** ✅
  - Complete database schema migration: [20260108_initial_schema.sql](supabase/migrations/20260108_initial_schema.sql)
  - Row-Level Security policies: [20260108_rls_policies.sql](supabase/migrations/20260108_rls_policies.sql)
  - Seed data migration: [20260108_seed_data.sql](supabase/migrations/20260108_seed_data.sql)
  - Supabase client configured: [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)

- **Phase 2: Authentication & User Management** ✅
  - Auth service: [src/services/auth.ts](src/services/auth.ts)
  - useAuth hook: [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)
  - UI components: Button, Input, Card in [src/components/ui/](src/components/ui/)
  - Auth pages: LandingPage, SignUpPage, LoginPage, SettingsPage
  - Protected routing with redirect logic

- **Phase 3: Core Data Models** ✅
  - **Services**:
    - [src/services/accounts.ts](src/services/accounts.ts) - Full CRUD for accounts with name uniqueness validation
    - [src/services/categories.ts](src/services/categories.ts) - Full CRUD for categories and subcategories
  - **Hooks**:
    - [src/hooks/useAccounts.ts](src/hooks/useAccounts.ts) - Fetch/manage accounts with optimistic updates
    - [src/hooks/useCategories.ts](src/hooks/useCategories.ts) - Fetch/manage categories & subcategories
    - [src/hooks/useAutoSave.ts](src/hooks/useAutoSave.ts) - Debounced auto-save utility
  - **UI Components**:
    - [src/components/ui/Select.tsx](src/components/ui/Select.tsx) - Dropdown selection component
    - [src/components/features/AccountForm.tsx](src/components/features/AccountForm.tsx) - Account creation/editing form
    - [src/components/features/CategoryForm.tsx](src/components/features/CategoryForm.tsx) - Category creation/editing form
    - [src/components/features/SubcategoryForm.tsx](src/components/features/SubcategoryForm.tsx) - Subcategory creation/editing form
  - **Pages**:
    - [src/pages/SetupPage.tsx](src/pages/SetupPage.tsx) - 3-step wizard (Accounts → Categories → Subcategories)
    - [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx) - Updated with Accounts, Categories, Subcategories management sections
  - **Features Implemented**:
    - Name uniqueness validation across accounts, categories, and subcategories
    - System categories/subcategories cannot be edited or deleted
    - Categories with subcategories cannot be deleted (must delete subcategories first)
    - Soft delete support for all entities
    - Transaction count checks before deletion
    - **Edit functionality in Settings page**:
      - Edit accounts (name, type, initial balance)
      - Edit categories (name only, type locked to prevent breaking subcategory logic)
      - Edit subcategories (name, parent category)

- **Phase 4: Transaction Management (CRUD)** ✅
  - **Services**:
    - [src/services/transactions.ts](src/services/transactions.ts) - Full CRUD for transactions including:
      - Create/update/delete transactions
      - Transfer transactions (creates paired entries)
      - Bulk update/delete operations
      - Transaction filtering (by account, date range, search query)
      - Running balance calculations
      - Recent activity by account
  - **Hooks**:
    - [src/hooks/useTransactions.ts](src/hooks/useTransactions.ts) - Fetch/manage transactions with:
      - useTransactions hook with filtering support
      - useRecentActivity hook for activity panel
      - useSimpleTransactions for basic transaction lists
  - **UI Components**:
    - [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx) - Reusable modal dialog
    - [src/components/features/TransactionForm.tsx](src/components/features/TransactionForm.tsx) - Form for income/expense/transfer with auto-categorization
    - [src/components/features/TransactionTable.tsx](src/components/features/TransactionTable.tsx) - Sortable table with bulk selection
    - [src/components/features/RecentActivityPanel.tsx](src/components/features/RecentActivityPanel.tsx) - Account activity summary with balances
    - [src/components/features/BulkEditModal.tsx](src/components/features/BulkEditModal.tsx) - Bulk subcategory assignment
    - [src/components/features/ConfirmDeleteModal.tsx](src/components/features/ConfirmDeleteModal.tsx) - Delete confirmation dialog
  - **Pages**:
    - [src/pages/TransactionInputPage.tsx](src/pages/TransactionInputPage.tsx) - Add transactions with Income/Expense/Transfer tabs, auto-categorization, Recent Activity panel
    - [src/pages/TransactionHistoryPage.tsx](src/pages/TransactionHistoryPage.tsx) - View/filter/sort transactions with bulk selection and operations

- **Phase 5: Dashboard - Basic Views & Tables** ✅
  - **Services**:
    - [src/services/dashboard.ts](src/services/dashboard.ts) - Dashboard data aggregation:
      - getAccountSummary(startDate, endDate) - Account balances with transactions
      - getCategorySummary(startDate, endDate) - Category/subcategory totals with goals
      - calculateNetWorth(date) - Net worth calculation
      - getDashboardMetrics(startDate, endDate) - Quick income/expense metrics
  - **Hooks**:
    - [src/hooks/useDashboard.ts](src/hooks/useDashboard.ts) - Dashboard state management:
      - Date range state with 90-day default
      - Account/Category summary fetching
      - Net worth and metrics calculations
      - Refresh functions for all data
  - **UI Components**:
    - [src/components/features/AccountSummary.tsx](src/components/features/AccountSummary.tsx) - Expandable account summary table:
      - Grouped by asset/liability type
      - Starting balance, changes, ending balance per account
      - Click to expand and see transactions in date range
      - Net worth summary in footer
    - [src/components/features/CategorySummary.tsx](src/components/features/CategorySummary.tsx) - Expandable category summary table:
      - Grouped by income/expense type
      - Category totals with goal tracking
      - Click to expand and see subcategories
      - Color-coded goal differences (green/red)
      - Income/Expense/Net summary in footer
  - **Pages**:
    - [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) - Complete dashboard with:
      - Date range selector (start/end date inputs)
      - Quick date presets (30 days, 90 days, this month, last month, 6 months, YTD)
      - Key metrics cards (Net Worth, Income, Expenses, Net Change)
      - Financial Health Score placeholder (Phase 11)
      - Account Summary table with expandable rows
      - Category Summary table with expandable rows

- **Phase 6: Dashboard - Visualizations** ✅
  - **Services**:
    - [src/services/charts.ts](src/services/charts.ts) - Chart data preparation:
      - prepareNetWorthData(startDate, endDate) - Net worth line chart data with dynamic time granularity (daily/weekly/monthly based on date range)
      - prepareSankeyData(startDate, endDate) - Cash flow Sankey diagram data
  - **Hooks**:
    - [src/hooks/useDashboard.ts](src/hooks/useDashboard.ts) - Extended with chart state:
      - netWorthChartData, netWorthChartAccounts, netWorthChartLoading
      - sankeyData, sankeyLoading
      - refreshCharts function
  - **UI Components**:
    - [src/components/features/NetWorthChart.tsx](src/components/features/NetWorthChart.tsx) - Net worth line chart (Recharts):
      - Line for each account with color coding (green=assets, red=liabilities)
      - Prominent net worth line in blue
      - Responsive container, custom tooltip, legend
      - Formatted currency on Y-axis, dates on X-axis
    - [src/components/features/SankeyDiagram.tsx](src/components/features/SankeyDiagram.tsx) - Cash flow visualization (@nivo/sankey):
      - Income subcategories → Income categories → Expenses categories → Expense subcategories
      - Color-coded nodes (green=income, red=expenses, blue=savings)
      - Link gradients, custom tooltips, responsive design
  - **Pages**:
    - [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) - Updated with real charts:
      - Replaced placeholder with NetWorthChart
      - Replaced placeholder with SankeyDiagram
      - Charts update with date range changes

- **Phase 7: AI Integration - Single Transaction Categorization** ✅
  - **Serverless Functions**:
    - [api/categorize.ts](api/categorize.ts) - Vercel serverless function for AI categorization:
      - Single and batch mode support
      - Fetches user's subcategories, past transactions, and AI corrections
      - Builds intelligent prompt for Gemini 2.5 Flash
      - Returns categorization with confidence scores
      - Fallback to "Unassigned" on API failures
      - Token usage logging for cost monitoring
  - **Services**:
    - [src/services/ai.ts](src/services/ai.ts) - Frontend AI service:
      - categorizeSingleTransaction() - Single transaction categorization
      - categorizeBatchTransactions() - Batch categorization support
      - saveAICorrection() - Store user corrections for learning
      - getAICorrection() - Retrieve user's preferred categorization
  - **UI Components**:
    - [src/components/features/TransactionForm.tsx](src/components/features/TransactionForm.tsx) - Updated with AI categorization:
      - Lookup-first approach: checks AI corrections → past transactions → AI
      - Loading state with spinner during AI categorization
      - Visual indicators: "Based on previous entry", "Based on your preference", "AI suggests"
      - Accept/override UI for AI suggestions with confidence display
      - Automatic correction saving when user overrides AI
      - ai_suggested and user_corrected flags on form data
  - **Pages**:
    - [src/pages/TransactionInputPage.tsx](src/pages/TransactionInputPage.tsx) - Updated:
      - Passes AI flags to transaction creation
      - Updated tips to explain auto-categorization and AI learning
  - **Environment**:
    - [.env.local.example](.env.local.example) - Added server-side keys:
      - SUPABASE_SERVICE_ROLE_KEY for serverless functions
      - GEMINI_API_KEY for Google AI

## Technical Decisions

- **Decision**: Supabase for database and auth
- **Decision**: React 19 + TypeScript + Vite
- **Decision**: Tailwind CSS 4 + dark mode only
- **Decision**: Vercel for hosting
- **Decision**: Gemini 2.5 Flash for AI

## Deviations from plan.md

- Used Tailwind CSS 4 (latest) instead of v3
- Used React 19 (latest stable) instead of 18+

## Known Blockers & Tech Debt

- Google OAuth needs to be configured in Supabase dashboard (optional)
- Account deletion requires serverless function implementation (deferred)
- Email confirmation is disabled (can be enabled in Supabase if needed)
- Lint warnings in hooks for setState in useEffect (follows existing codebase pattern for data fetching)

## Bug Fixes

- **2026-01-11: Fixed 403 Forbidden errors on Setup page**
  - **Issue**: API calls to categories, accounts, and subcategories returned 403 Forbidden despite correct RLS policies
  - **Root Cause**: Missing table-level GRANT permissions for the `authenticated` role
  - **Fix**: Applied GRANT statements in Supabase SQL Editor

- **2026-01-12: Fixed date selector not triggering data refresh on Dashboard**
  - **Issue**: When manually changing dates using calendar selectors, transactions did not query properly. Account Summary showed no transactions and changes = 0, Category Summary was blank. However, preset buttons worked correctly.
  - **Root Cause**: The `useEffect` hook in `useDashboard.ts` depended on `refreshAll` callback, creating a complex dependency chain. When dates were changed manually, React didn't properly detect the change and trigger the effect to refetch data.
  - **Fix**:
    - Added `dateRange.startDate` and `dateRange.endDate` explicitly to the effect's dependency array in `src/hooks/useDashboard.ts:219`
    - Updated date change handlers in `src/pages/DashboardPage.tsx:42-48` to use functional updates for better state handling

## Recent Changes

- **2026-01-13: Transaction Input Page - Multi-Transaction Tabular Input**
  - **Change**: Replaced single-transaction form with tabular multi-transaction entry
  - **New Component**: [src/components/features/MultiTransactionTable.tsx](src/components/features/MultiTransactionTable.tsx)
  - **Features**:
    - Enter multiple transactions at once in a table format (starts with 3 rows, can add more)
    - Separate tabs for Income, Expense, and Transfer types
    - "Auto-Categorize" button for batch AI categorization of uncategorized transactions
    - AI categorization now runs ONLY on button click (not on description blur)
    - Batch processing: up to 25 transactions per LLM call to reduce API usage
    - Visual indicators for categorization source: "Previous" (lookup), "Preferred" (user correction), "AI", "Corrected"
    - Rows persist account selection when adding new rows

## Next Immediate Steps

1. **Proceed to Phase 8**: Statement Parsing with Regex + Parallel Batch Categorization
   - Create regex parsing utilities for statement formats
   - Create Vercel serverless function for statement parsing
   - Implement parallel batch categorization
   - Build statement upload UI with review workflow

## Project Organization

- **Root**: Configuration files, plan.md, progress.md, CLAUDE.md
- **docs/**: All documentation
- **prompts/**: AI agent instructions and guidelines
- **src/**: Application source code
- **api/**: Vercel serverless functions
- **supabase/**: Database migrations

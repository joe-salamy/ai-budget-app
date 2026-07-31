# AI-Powered Budget App - Development Plan

## Project Overview

A personal finance management application with AI-powered transaction categorization and an intelligent chatbot assistant. Users can track accounts, categorize transactions, set spending/saving goals, and visualize their financial health.

## Table of Contents

- AI-Powered Budget App - Development Plan
  - Project Overview
  - Tech Stack
    - Frontend
    - Backend
    - AI/LLM
    - Future Considerations
  - Data Model
    - Core Tables
      - `users`
      - `accounts`
      - `categories`
      - `subcategories`
      - `transactions`
      - `spending_goals`
      - `saving_goals`
      - `ai_corrections`
      - `user_preferences`
      - `chat_sessions`
      - `chat_messages`
  - Application Architecture
    - File Structure
  - Key Features & Specifications
    - 1. Authentication
    - 2. Setup/Onboarding
    - 3. Transaction Management
      - Input Methods
      - Most Recent Activity Panel
      - Transaction History
    - 4. Dashboard
      - Date Range Selector
      - Account Summary Table
      - Category Summary Table
      - Visualizations
      - Financial Health Score
    - 5. Budget Goals
      - Spending Goals
      - Saving Goals
    - 6. AI Features
      - Statement Parsing & Transaction Categorization (_Core Feature_)
      - AI Chatbot (_Core Feature_)
  - Development Phases
    - Phase 0: Project Setup & Infrastructure
    - Phase 1: Database Schema & Backend Setup
    - Phase 2: Authentication & User Management
    - Phase 3: Core Data Models (Accounts, Categories, Subcategories)
    - Phase 4: Transaction Management (CRUD)
    - Phase 5: Dashboard - Basic Views & Tables
    - Phase 6: Dashboard - Visualizations
    - Phase 7: AI Integration - Single Transaction Categorization
    - Phase 8: Statement Parsing with Regex + Parallel Batch Categorization
    - Phase 9: AI Chatbot Side Panel
    - Phase 10: Budget Goals & Tracking
    - Phase 11: Financial Health Score
    - Phase 12: Polish, Testing & Deployment
      - 12.1: UI/UX Polish
      - 12.2: Performance Optimization
      - 12.3: Unit Testing
      - 12.4: Integration Testing
      - 12.5: End-to-End Testing
      - 12.6: Security Review
      - 12.7: Documentation
      - 12.8: Error Monitoring & Logging
      - 12.9: Deployment
      - 12.10: Beta Testing
      - 12.11: Launch Checklist
  - Future Enhancements (Not in Initial Phases)
  - Key Recommendations
    - AI Implementation Best Practices
      - AI Categorization Optimization Factors
    - Data Management Best Practices
    - UX Best Practices
    - Performance Considerations
    - Security Considerations
    - Name Constraints
      - Naming Rules
      - Renaming Behavior
      - Deletion Rules
  - Success Metrics
  - Questions & Decisions
    - Answered
    - Deferred (for future phases)
  - Development Tips for AI Agents
  - Phase Completion Checklist

---

## Tech Stack

### Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Hosting**: Vercel
- **UI Components**: shadcn/ui or similar component library
- **Charts**:
  - Recharts (line charts, bar charts)
  - @nivo/sankey (Sankey diagrams)
- **State Management**: React Context + hooks (consider Zustand if complexity grows)
- **Theme**: Dark mode only (fast, lightweight aesthetic)
- **Design Philosophy**:
  - Prioritize speed and responsiveness
  - Lightweight, minimal design
  - Interactive hover effects on icons and buttons

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (with note to potentially migrate to Better Auth)
  - Email/password authentication
  - Google OAuth integration
- **Row Level Security**: Enabled for all tables
- **API Proxy**: Vercel Serverless Functions

### AI/LLM

- **Primary Model**: Google Gemini 2.5 Flash (prioritizing accuracy > speed > cost)
- **Use Cases**:
  - Transaction categorization
  - Statement parsing
  - Chatbot assistance
  - Budget recommendations

### Future Considerations

- Multi-currency support
- Better Auth migration
- CSV file upload for transactions
- Multi-user/family sharing
- PDF statement parsing
- Bank account linking (Plaid integration)
- User analytics and usage data collection
- MCP (Model Context Protocol) server for external integrations
- Bill reminders with notifications
- **Payment System**: Stripe integration for subscription model
  - Free trial: One week of free AI chatbot access
  - Paid tier: $5/month after trial
  - Friend access management (complimentary access for specific users)

---

## Data Model

### Core Tables

#### `users`

- Managed by Supabase Auth
- Additional profile fields in separate `user_profiles` table

#### `accounts`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
name (text)
type (enum: 'asset' | 'liability')
initial_balance (decimal)
created_at (timestamp)
updated_at (timestamp)
deleted_at (timestamp, nullable) -- soft delete
```

#### `categories`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
name (text)
type (enum: 'income' | 'expense')
is_system (boolean) -- true for "Unassigned"
created_at (timestamp)
deleted_at (timestamp, nullable)
```

#### `subcategories`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
category_id (uuid, FK → categories)
name (text)
is_system (boolean) -- true for "Unassigned"
created_at (timestamp)
deleted_at (timestamp, nullable)
```

#### `transactions`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
account_id (uuid, FK → accounts)  -- foreign key enables automatic name updates
date (date)
name (text)  -- transaction description, NOT account/category name
amount (decimal) -- positive for income, negative for expense
subcategory_id (uuid, FK → subcategories, nullable)  -- foreign key enables automatic name updates
comment (text, nullable)
is_initial_balance (boolean)
is_transfer (boolean)
transfer_to_account_id (uuid, FK → accounts, nullable)
ai_suggested (boolean) -- was this auto-categorized by AI?
user_corrected (boolean) -- did user override AI suggestion?
created_at (timestamp)
updated_at (timestamp)
deleted_at (timestamp, nullable)
```

**Important Design Note**: Transactions reference accounts and subcategories by **ID** (foreign key), not by name. This means when you rename an account or subcategory, all transactions automatically display the updated name through database joins. No need to update transaction records themselves - this is a key benefit of relational database design.

#### `spending_goals`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
subcategory_id (uuid, FK → subcategories)
amount (decimal)
period (enum: 'weekly' | 'monthly' | 'quarterly' | 'annual')
start_date (date)
end_date (date, nullable) -- null means ongoing
created_at (timestamp)
updated_at (timestamp)
```

#### `saving_goals`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
name (text)
target_amount (decimal, nullable) -- null if only time-based
target_date (date, nullable) -- null if only amount-based
current_amount (decimal)
account_id (uuid, FK → accounts, nullable) -- which account to track
created_at (timestamp)
updated_at (timestamp)
completed_at (timestamp, nullable)
```

#### `ai_corrections`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
transaction_name (text) -- normalized transaction name
account_id (uuid, FK → accounts)
ai_suggested_subcategory_id (uuid, FK → subcategories, nullable)
user_corrected_subcategory_id (uuid, FK → subcategories)
created_at (timestamp)
```

#### `user_preferences`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
ai_personality (enum: 'professional' | 'friendly' | 'stern')
currency (text) -- 'USD' for now
created_at (timestamp)
updated_at (timestamp)
```

#### `chat_sessions`

```sql
id (uuid, PK)
user_id (uuid, FK → users)
title (text) -- auto-generated or user-edited
created_at (timestamp)
updated_at (timestamp)
last_message_at (timestamp)
```

#### `chat_messages`

```sql
id (uuid, PK)
session_id (uuid, FK → chat_sessions)
user_id (uuid, FK → users)
role (enum: 'user' | 'assistant')
content (text)
function_calls (jsonb, nullable) -- stores function call details if applicable
created_at (timestamp)
```

---

## Application Architecture

### File Structure

```
/ai-budget-app
├── .env.local              # API keys, Supabase URL/keys
├── .gitignore
├── package.json
├── vercel.json
├── vite.config.ts
├── tsconfig.json
│
├── /api                    # Vercel Serverless Functions
│   ├── categorize.ts       # AI categorization endpoint
│   ├── parse-statement.ts  # Statement parsing endpoint
│   └── chat.ts             # AI chatbot endpoint
│
├── /public
│   ├── favicon.ico
│   └── robots.txt
│
├── /src
│   ├── /assets
│   │   └── logo.svg
│   ├── /components
│   │   ├── /ui             # Generic reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Select.tsx
│   │   └── /features       # Feature-specific components
│   │       ├── TransactionList.tsx
│   │       ├── TransactionForm.tsx
│   │       ├── AccountSummary.tsx
│   │       ├── CategorySummary.tsx
│   │       ├── BudgetChart.tsx
│   │       ├── NetWorthChart.tsx
│   │       ├── SankeyDiagram.tsx
│   │       ├── FinancialHealthScore.tsx
│   │       ├── ChatSidePanel.tsx
│   │       ├── ChatSessionList.tsx
│   │       └── StatementParser.tsx
│   ├── /config
│   │   └── constants.ts    # App constants (not secrets)
│   ├── /hooks
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useAccounts.ts
│   │   ├── useCategories.ts
│   │   ├── useGoals.ts
│   │   ├── useAutoSave.ts
│   │   └── useChatPanel.ts
│   ├── /lib
│   │   ├── supabaseClient.ts
│   │   └── utils.ts
│   ├── /pages
│   │   ├── LandingPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SetupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionInputPage.tsx
│   │   ├── TransactionHistoryPage.tsx
│   │   └── SettingsPage.tsx
│   ├── /services
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── accounts.ts
│   │   ├── categories.ts
│   │   ├── goals.ts
│   │   └── ai.ts
│   ├── /types
│   │   └── index.ts        # All TypeScript interfaces
│   ├── App.tsx
│   ├── Router.tsx
│   └── main.tsx
│
└── /supabase
    └── /migrations
        ├── 20260104_initial_schema.sql
        ├── 20260104_rls_policies.sql
        └── 20260104_seed_data.sql
```

---

## Key Features & Specifications

### 1. Authentication

- Email/password signup and login
- Google OAuth integration
- Protected routes (redirect to login if not authenticated)
- User profile management in settings

### 2. Setup/Onboarding

User creates:

- **Accounts**: name, type (asset/liability), initial balance
- **Categories**: name, type (income/expense)
  - System creates "Unassigned" category (income & expense) that cannot be edited/deleted
- **Subcategories**: name, parent category, optional spending goal
  - System creates "Unassigned" subcategory under each "Unassigned" category

### 3. Transaction Management

#### Input Methods

Three input forms (all auto-save):

**Income Form**

- Date, Account (dropdown), Name, Amount, Subcategory (dropdown), Comment
- Category auto-populated based on subcategory (shown as read-only field for transparency)

**Expense Form**

- Date, Account (dropdown), Name, Amount, Subcategory (dropdown), Comment
- Category auto-populated based on subcategory (shown as read-only field for transparency)

**Transfer Form**

- Date, From Account (dropdown), To Account (dropdown), Name, Amount, Subcategory (dropdown, optional), Comment
- Some transfers need categorization (moving to brokerage = investing), others don't (paying credit card)

#### Most Recent Activity Panel

Shows for each account:

- Account name
- Current balance
- Most recent transaction (name, amount, date)

Purpose: helps users know which transactions to add

#### Transaction History

- Comprehensive table of all transactions
- Columns: Date, Account, Name, Amount, Subcategory, Category, Comment, Running Balance, Date Added
- Filter/view options:
  - Group by account/category/date
  - Show transactions added today
  - Date range filter
  - CRM-style saved views
- Bulk operations:
  - Checkbox selection for multiple transactions
  - Bulk edit subcategory
  - Bulk delete
  - Keyboard shortcuts (Shift+click for range selection)

### 4. Dashboard

#### Date Range Selector

Two date inputs at top to filter all dashboard data (default = last 90 days)

#### Account Summary Table

For each account:

- Account type, name, starting balance, total change ($ amount), ending balance
- Expandable rows showing all transactions in date range:
  - Date, Name, Amount, Running Balance, Category, Subcategory
- Net Worth Summary at bottom (assets - liabilities)

#### Category Summary Table

For each category:

- Type, Name, Total spent/earned in period, Goal (if applicable), Difference from goal
- Expandable rows showing subcategories with same metrics

#### Visualizations

1. **Net Worth Over Time**: Line chart showing value of each account + total net worth from start to end date
2. **Sankey Diagram**: Flow visualization
   - Income subcategories → Income categories → Expense categories → Expense subcategories
   - Width of flows represents $ amounts

#### Financial Health Score

A 0-100 score displayed prominently on dashboard (similar to sleep score aesthetic):

- **Factors** (recommended implementation):
  - 40%: Spending vs. spending goals (are you staying under budget?)
  - 30%: Savings rate (income saved vs. income earned)
  - 20%: Progress on saving goals
  - 10%: Net worth trend (positive = improving)
- Visual: Large circular progress indicator with color coding (red/yellow/green)
- Breakdown showing which factors are helping/hurting the score
- Historical trend of score over time

### 5. Budget Goals

#### Spending Goals

- Set per subcategory
- Time-based: weekly, monthly, quarterly, annual
- Can set different goals for different time periods
- Track actual vs. goal in dashboard

#### Saving Goals

- Named goals (e.g., "Emergency Fund", "Vacation")
- Can set:
  - Target amount only (save $5000)
  - Target date only (save as much as possible by June 2026)
  - Both amount AND date (save $5000 by June 2026)
- Optionally link to specific account
- Visual progress bar showing current vs. target
- Estimated completion date based on recent savings rate

### 6. AI Features

#### Statement Parsing & Transaction Categorization (_Core Feature_)

This unified feature handles both parsing pasted statements and categorizing transactions.

**Overall Flow**:

1. **Parse statement** (regex-based, no AI)
   - Extract date, name, amount from pasted text
   - Use regex patterns for common statement formats
2. **Lookup categorization** (database query, no AI)
   - For each transaction: check if same name + account exists in history
   - If found: assign same subcategory
3. **AI categorization** (LLM, only for uncategorized transactions)
   - Batch remaining uncategorized transactions
   - Send to AI in parallel batches of ~10 transactions
   - Process multiple batches concurrently
4. **Review and save**
   - User reviews all transactions with categories
   - Can edit before saving to database

---

**1. Statement Parsing (Regex-Based)**

- **No AI used** - purely pattern matching
- **Process**:
  1. User pastes statement text into textarea
  2. Apply regex patterns to identify transaction rows
  3. Extract fields from each row:
     - Date (various formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
     - Description/Name (merchant name)
     - Amount (handle negatives, parentheses for debits, currency symbols)
  4. Normalize extracted data:
     - Convert dates to ISO format (YYYY-MM-DD)
     - Clean merchant names (trim whitespace, remove location codes)
     - Parse amounts as decimal (negative for expenses, positive for income)
     - Detect transaction type from amount sign or debit/credit columns
  5. Return array of parsed transactions

- **Regex Pattern Examples**:

  ```javascript
  // Credit card statement: "01/15/2026  AMAZON.COM  -$45.99"
  const pattern1 = /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9\s\.]+)\s+[-]?\$?([\d,]+\.\d{2})/;

  // Bank statement: "2026-01-15 | Whole Foods #123 | $87.23 | Debit"
  const pattern2 = /(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+)\s*\|\s*\$?([\d,]+\.\d{2})/;

  // Generic: flexible pattern matching
  const datePattern = /\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/;
  const amountPattern = /[-]?\(?\$?[\d,]+\.\d{2}\)?/;
  ```

- **Multiple Format Support**:
  - Try each pattern sequentially
  - Use the pattern with most successful matches
  - Fall back to line-by-line parsing if no pattern matches well

- **Error Handling**:
  - If regex fails to extract date/amount, mark row as "needs review"
  - User can manually fix these before categorization
  - Show warning if < 50% of lines parsed successfully

---

**2. Lookup-Based Categorization (No AI)**

- **Process**:

  ```javascript
  for (const transaction of parsedTransactions) {
    // Query database for same transaction name + account
    const pastTransaction = await db.query(
      `SELECT subcategory_id FROM transactions 
       WHERE user_id = $1 
       AND account_id = $2 
       AND name = $3 
       AND deleted_at IS NULL
       ORDER BY date DESC, created_at DESC 
       LIMIT 1`,
      [userId, accountId, transaction.name]
    );

    if (pastTransaction) {
      transaction.subcategory_id = pastTransaction.subcategory_id;
      transaction.categorization_method = "lookup";
    } else {
      transaction.categorization_method = "needs_ai";
    }
  }
  ```

- **Lookup Hit Rate**: Typically 60-80% of transactions (recurring merchants)
- **Benefits**:
  - Instant categorization
  - No API cost
  - User's own historical patterns
  - Consistent with past behavior

---

**3. AI Categorization (Batch + Parallel Processing)**

- **Only runs for transactions not found in lookup**
- **Process**:
  1. Collect all transactions marked as `needs_ai`
  2. Split into batches of 10 transactions each
  3. Send multiple batches to AI **in parallel** (concurrent API calls)
  4. Wait for all batches to complete
  5. Merge results back into transaction list

- **Batch Configuration**:
  - **Batch size**: 20-50 transactions per API call (test for optimal amount)
    - Small enough to complete quickly (~1-2 seconds per batch)
    - Large enough to reduce total API calls
    - Easy error recovery if one batch fails
  - **Parallel batches**: 3-5 concurrent API calls
    - Gemini API supports concurrency
    - Significantly faster than sequential processing
    - 50 transactions: 5 batches in parallel = ~2 seconds total vs. ~10 seconds sequential

- **Implementation Example**:

  ```javascript
  const uncategorized = transactions.filter((t) => t.categorization_method === "needs_ai");
  const batches = chunkArray(uncategorized, 10); // Split into groups of 10

  // Process batches in parallel
  const batchPromises = batches.map((batch) =>
    fetch("/api/categorize", {
      method: "POST",
      body: JSON.stringify({ transactions: batch, user_id: userId }),
    }).then((res) => res.json())
  );

  const results = await Promise.all(batchPromises);

  // Merge results back
  let resultIndex = 0;
  for (const batch of results) {
    for (const categorization of batch) {
      uncategorized[resultIndex].subcategory_id = categorization.subcategory_id;
      uncategorized[resultIndex].categorization_method = "ai";
      resultIndex++;
    }
  }
  ```

- **AI Prompt** (batch format):

  ```
  You are a financial categorization assistant.

  User's categories and subcategories:
  [JSON list]

  User's past transaction patterns:
  [Sample of 50 recent transactions]

  User corrections from AI:
  [List from ai_corrections table]

  Categorize these transactions:
  [
    { "name": "Amazon.com", "account": "Chase Credit", "amount": -45.99 },
    { "name": "Whole Foods", "account": "Chase Credit", "amount": -87.23 },
    ...
  ]

  Return ONLY a JSON array in same order:
  [
    { "subcategory": "Online Shopping" },
    { "subcategory": "Groceries" },
    ...
  ]

  If uncertain, use "Unassigned".
  ```

- **Error Handling**:
  - If a batch fails: assign "Unassigned" to those transactions
  - If partial response: use what's available, "Unassigned" for rest
  - Retry failed batches once with exponential backoff
  - Never block user - always provide result (even if "Unassigned")

---

**4. Single Transaction Categorization** (manual input)

When user manually inputs one transaction (not via statement parsing):

1. **Lookup first** (same as above)
   - Check transaction history for same name + account
   - If found: auto-fill subcategory with indicator "Based on previous entry"
2. **AI if no match** (single transaction call)
   - Trigger when user tabs out of "Name" field or enters Amount
   - Show loading: "AI is categorizing..."
   - Call `/api/categorize` with single transaction
   - Display suggested subcategory
   - User can accept (checkmark) or override (X)
3. **Save correction if overridden**
   - Store in `ai_corrections` table
   - Used in future AI prompts for learning

---

**Performance & Cost Comparison**:

| Method                           | 50 Transactions        | Time        | Cost    |
| -------------------------------- | ---------------------- | ----------- | ------- |
| **Sequential individual calls**  | 50 API calls           | ~50 seconds | $0.002  |
| **Sequential batches (10 each)** | 5 API calls            | ~10 seconds | $0.0004 |
| **Parallel batches (10 each)**   | 5 API calls (parallel) | ~2 seconds  | $0.0004 |

**Recommendation**: Always use parallel batch processing for statement parsing. Use single calls only for manual transaction input.

#### AI Chatbot (_Core Feature_)

**Capabilities**:

- Access to all user data (accounts, transactions, categories, goals)
- Can perform actions on user's behalf:
  - Create accounts, categories, subcategories
  - Add transactions (must correctly characterize as expense vs income vs transfer)
  - Set up budget goals
  - Modify settings
- Conversational onboarding (alternative to setup forms)
- Offers budget templates (50/30/20 rule, zero-based budgeting)
- Answers questions about spending patterns
- Provides financial advice based on user's data
- **Transaction Intelligence**:
  - Properly categorizes expense vs income vs transfer
  - Detects duplicate transfers (checks if opposite transfer already exists)
  - Has access to SQL database of transactions with comprehensive filter capabilities
  - Learns from user patterns over time
- **User Communication**:
  - Inform users that AI improves and adapts to their patterns over time
  - Show transparency when agent is "thinking" or using tools (no blank screen)
  - Display active tool calls and reasoning process

**Personality Settings** (user-configurable in Settings):

- **Professional**: Formal, data-focused, concise
- **Friendly**: Encouraging, uses emojis, conversational
- **Stern**: Direct, pushes user on overspending, accountability-focused

**AI Configuration**:

- **Temperature**: Set to 0 for consistent, deterministic responses
- **Context Management**: Keep agent focused on approved financial topics
- **Tool Transparency**: Display which tools/functions the AI is calling in real-time

**Implementation** (VS Code-style side panel):

- **Side panel component** accessible from all pages:
  - Toggle button in app header (AI icon)
  - Slides in from right side (similar to VS Code Copilot)
  - Resizable panel width
  - Can be collapsed/expanded
  - Persists across page navigation
- **Chat sessions**:
  - Multiple chat sessions saved and retrievable
  - Session list shows title + timestamp
  - Auto-generate session title from first message
  - User can rename sessions
  - Start new session or continue existing
  - Delete old sessions
- **Message interface**:
  - Streaming responses for better UX
  - Message history stored in database with session context
  - Markdown rendering for formatted responses
  - Code blocks for financial summaries
- **Quick actions panel** (at top of chat):
  - "Categorize statement"
  - "Add transaction"
  - "Review spending"
  - "Set budget goal"
- **System prompt includes**:
  - Personality directive
  - Current user data summary (accounts, recent transactions, goals)
  - Available actions (function calling)
  - Current page context (e.g., "User is on Dashboard page viewing Jan 2026 data")

---

## Development Phases

Each phase should be completed and tested before moving to the next. Phases are designed to be implemented by an AI agent one at a time.

---

### Phase 0: Project Setup & Infrastructure

**Goal**: Initialize project with all necessary tooling and configurations

**Tasks**:

1. Initialize Vite + React + TypeScript project
2. Configure TypeScript (strict mode)
3. Set up ESLint and Prettier
4. Install and configure Tailwind CSS
5. Install shadcn/ui or similar component library
6. Set up Git repository structure
7. Create `.env.local.example` with required variables
8. Configure Vercel project (vercel.json)
9. Set up folder structure as specified above
10. Install core dependencies:
    - react-router-dom
    - @supabase/supabase-js
    - recharts (line/bar charts)
    - @nivo/sankey @nivo/core (Sankey diagrams)
    - date-fns
    - zod (for validation)
    - markdown-to-jsx or react-markdown (for chat message rendering)
11. Create basic Router.tsx with placeholder routes
12. Create basic App.tsx with header including AI chat toggle button placeholder
13. Create basic AppLayout.tsx component (header with nav and chat toggle button)
14. Configure dark mode theme:
    - Set up dark color palette in Tailwind config
    - Ensure all shadcn/ui components use dark theme
    - Add hover effects for interactive elements
    - Test responsive behavior across devices
15. Establish design standards:
    - Create reusable animation/transition patterns
    - Define spacing and typography system
    - Set up loading states and skeletons
    - Document component styling patterns

**Deliverables**:

- Runnable empty React app
- All folders created
- Dependencies installed
- Git repository initialized

**Testing**:

- `npm run dev` starts dev server
- No console errors
- App displays "Hello World" or similar

---

### Phase 1: Database Schema & Backend Setup

**Goal**: Set up Supabase project and create all database tables with RLS

**Tasks**:

1. Create Supabase project
2. Write migration file: `20260104_initial_schema.sql`
   - All tables from data model above
   - Proper foreign key constraints
   - Indexes on frequently queried columns (user_id, account_id, date)
   - Soft delete support (deleted_at fields)
3. Write migration file: `20260104_rls_policies.sql`
   - Enable RLS on all tables
   - Policies: users can only access their own data
   - Policy for system categories/subcategories (readable by all users, writable by none)
4. Write migration file: `20260104_seed_data.sql`
   - Create system "Unassigned" categories (income & expense)
   - Create system "Unassigned" subcategories
5. Run migrations in Supabase
6. Set up Supabase client in `/src/lib/supabaseClient.ts`
7. Add environment variables to `.env.local`

**Deliverables**:

- Supabase project with all tables created
- RLS policies active and tested
- Supabase client configured in app

**Testing**:

- Use Supabase dashboard to verify tables exist
- Verify RLS policies by attempting cross-user queries
- Test connection from React app (simple query in console)

---

### Phase 2: Authentication & User Management

**Goal**: Implement complete auth flow with Supabase Auth + Google OAuth

**Tasks**:

1. Create auth service (`/src/services/auth.ts`):
   - signUp(email, password)
   - signIn(email, password)
   - signInWithGoogle()
   - signOut()
   - getCurrentUser()
   - resetPassword()
2. Create useAuth hook (`/src/hooks/useAuth.ts`):
   - Manages auth state
   - Provides auth methods to components
   - Handles session persistence
3. Set up Google OAuth in Supabase console
4. Build LandingPage.tsx:
   - Hero section with app description
   - "Get Started" CTA → SignUpPage
   - "Log In" link → LoginPage
5. Build SignUpPage.tsx:
   - Email + password form
   - Google OAuth button
   - Link to LoginPage
   - Form validation with error messages
6. Build LoginPage.tsx:
   - Email + password form
   - Google OAuth button
   - "Forgot password?" link
   - Link to SignUpPage
7. Update Router.tsx:
   - Public routes: Landing, SignUp, Login
   - Protected routes: Dashboard, Setup, etc.
   - Redirect logic (if logged in, redirect away from login/signup)
8. Create SettingsPage.tsx (basic):
   - Display user email
   - Change password form
   - Delete account button
   - Note: Account/category management will be added in Phase 3
9. Create user_profiles table trigger:
   - On user signup, create corresponding user_preferences row

**Deliverables**:

- Complete authentication flow
- Protected routing
- Google OAuth working
- Basic settings page

**Testing**:

- Sign up with email/password
- Sign in with email/password
- Sign in with Google
- Sign out
- Verify protected routes redirect to login
- Verify logged-in users can't access login/signup pages

---

### Phase 3: Core Data Models (Accounts, Categories, Subcategories)

**Goal**: CRUD operations for accounts, categories, and subcategories

**Tasks**:

1. Define TypeScript interfaces (`/src/types/index.ts`):
   - Account, Category, Subcategory, Transaction, etc.
2. Create services:
   - `/src/services/accounts.ts`: CRUD for accounts
   - `/src/services/categories.ts`: CRUD for categories + subcategories
3. Create hooks:
   - `/src/hooks/useAccounts.ts`: Fetch and manage accounts
   - `/src/hooks/useCategories.ts`: Fetch and manage categories/subcategories
   - `/src/hooks/useAutoSave.ts`: Debounced auto-save utility
4. Build SetupPage.tsx:
   - Stepper/wizard UI (3 steps)
   - **Step 1: Accounts**
     - Form to add accounts (name, type, initial balance)
     - List of added accounts with edit/delete
     - Auto-save on input change
   - **Step 2: Categories**
     - Form to add categories (name, type)
     - List showing categories with subcategories nested
     - Auto-save
     - "Unassigned" categories shown but disabled
   - **Step 3: Subcategories**
     - Select parent category (dropdown)
     - Add subcategory name
     - Optional: set spending goal
     - List of subcategories grouped by category
     - Auto-save
   - "Finish Setup" button → DashboardPage
5. Create UI components:
   - AccountForm.tsx
   - CategoryForm.tsx
   - SubcategoryForm.tsx
6. Add management sections to SettingsPage.tsx:
   - **Accounts Section**:
     - Table/list of all user accounts
     - Each row: name, type, current balance (calculated dynamically), edit/delete buttons
     - Click edit → inline editing or modal form
     - Can edit: name, type, initial balance
     - **Editing initial balance** will recalculate all running balances for that account (show warning/info message)
     - Delete follows business rules (see "Business Rules & Data Constraints" section)
       - Popup to choose: delete all associated transactions OR leave them unassigned
       - Then confirmation warning before proceeding
   - **Categories Section**:
     - Table/list of all categories (grouped by type: income/expense)
     - Each row: name, type, subcategory count, edit/delete buttons
     - Click edit → inline editing or modal form
     - Can edit: name only (type change would break subcategory logic)
     - Delete follows business rules (see "Business Rules & Data Constraints" section)
       - Cannot delete if has subcategories (must delete subcategories first)
       - If no subcategories, show confirmation dialog
     - "Unassigned" categories shown but cannot be edited/deleted
   - **Subcategories Section**:
     - Table/list grouped by parent category
     - Each row: name, parent category, edit/delete buttons
     - Click edit → inline editing or modal form
     - Can edit: name, parent category (dropdown)
     - Delete follows business rules (see "Business Rules & Data Constraints" section)
       - Popup to choose: delete all associated transactions OR leave them unassigned
       - Then confirmation warning before proceeding
     - "Unassigned" subcategories cannot be edited/deleted
   - **Important Notes** (show in UI with info icon):
     - "Renaming accounts, categories, or subcategories will automatically update all related transactions."
     - "Names must be unique across all accounts, categories, and subcategories."
     - "Renaming to match an existing item will merge them together."

**Deliverables**:

- Fully functional setup wizard
- Full CRUD operations for accounts, categories, subcategories
- Management interface in Settings page for ongoing editing
- Auto-save behavior working
- Data persists to Supabase
- Name changes automatically propagate to all transactions via foreign key relationships

**Testing**:

- Complete setup flow as new user
- Add, edit, delete accounts/categories/subcategories in setup wizard
- Verify auto-save (check database)
- Verify "Unassigned" categories cannot be edited/deleted
- Refresh page mid-setup, verify data persists
- Go to Settings page, edit account name → verify change saves
- Add transaction using old account name context → verify shows new name
- Edit category name → verify all subcategories still linked correctly
- Edit subcategory name → verify all transactions show new name
- Attempt to delete category with subcategories → verify blocked with error message
- Delete subcategory → verify confirmation dialog shows transaction count
- Try to edit "Unassigned" category/subcategory → verify disabled with tooltip

---

### Phase 4: Transaction Management (CRUD)

**Goal**: Build transaction input forms and transaction history page

**Tasks**:

1. Create transaction service (`/src/services/transactions.ts`):
   - createTransaction(data)
   - updateTransaction(id, data)
   - deleteTransaction(id)
   - bulkDeleteTransactions(ids[])
   - bulkUpdateTransactions(ids[], updates)
   - getTransactions(filters)
   - getTransactionsByAccount(accountId)
   - getRecentTransactionByNameAndAccount(name, accountId)
   - **calculateRunningBalance(accountId, transactionDate)**:
     - Returns: initial_balance + SUM(all transactions in account up to and including date)
     - Never stores running balance - always calculates dynamically
     - Ensures consistency when transactions added/edited/deleted
     - Ensures balance updates automatically when initial balance edited
2. Create useTransactions hook (`/src/hooks/useTransactions.ts`):
   - Fetch transactions with filters
   - Manage loading/error states
   - Optimistic updates
3. Build TransactionInputPage.tsx:
   - Three tabs: Income, Expense, Transfer
   - **Income Tab**:
     - Form fields: Date, Account (dropdown), Name, Amount, Subcategory (dropdown), Category (read-only, auto-populated), Comment
     - Auto-save on field change
   - **Expense Tab**:
     - Same fields as Income
   - **Transfer Tab**:
     - Fields: Date, From Account, To Account, Name, Amount, Subcategory (optional), Comment
   - **Most Recent Activity Panel**:
     - Shows all accounts with current balance and most recent transaction
     - Helps user know what to add next
4. Build TransactionHistoryPage.tsx:
   - **Main Table**:
     - Columns: Checkbox, Date, Account, Name, Amount, Subcategory, Category, Comment, Running Balance, Date Added
     - Sortable columns
     - Checkbox for bulk selection (with shift+click range support)
   - **Filters**:
     - Date range picker
     - Account filter (multi-select)
     - Category/subcategory filter
     - Search by name
   - **Bulk Actions Bar** (appears when items selected):
     - Bulk edit subcategory (modal)
     - Bulk delete (confirmation modal)
   - **Saved Views** (optional for this phase, can defer):
     - "Transactions added today"
     - "Uncategorized transactions"
     - "Transactions this month"
5. Build supporting components:
   - TransactionForm.tsx (reusable form component)
   - TransactionTable.tsx (reusable table with bulk selection)
   - BulkEditModal.tsx
   - ConfirmDeleteModal.tsx

**Deliverables**:

- Three transaction input forms with auto-save
- Most Recent Activity panel
- Transaction History page with filtering and bulk operations
- All CRUD operations functional

**Testing**:

- Add income, expense, and transfer transactions
- Verify auto-save works
- Verify category auto-populates from subcategory
- Edit existing transactions
- Delete single transaction
- Bulk select and delete multiple transactions
- Bulk edit subcategories
- Filter by date, account, category
- Search by transaction name
- Verify running balance calculates correctly (dynamically, not stored)
- Edit account initial balance → verify all running balances recalculate
- Add transaction out of chronological order → verify running balances correct for all subsequent transactions

---

### Phase 5: Dashboard - Basic Views & Tables

**Goal**: Build dashboard with date range filtering and summary tables

**Tasks**:

1. Create dashboard service (`/src/services/dashboard.ts`):
   - getAccountSummary(startDate, endDate)
   - getCategorySummary(startDate, endDate)
   - calculateNetWorth(date)
2. Create useDashboard hook (`/src/hooks/useDashboard.ts`):
   - Manages date range state
   - Fetches summary data
3. Build DashboardPage.tsx structure:
   - **Header**:
     - Date range selector (start date, end date)
     - Financial Health Score (placeholder for now)
   - **Content Grid**:
     - Account Summary section
     - Category Summary section
     - Charts section (placeholder)
4. Build AccountSummary.tsx component:
   - **Table Structure**:
     - Row per account: Type, Name, Starting Balance, Changes, Ending Balance
     - Expandable row → shows all transactions in date range
     - Transaction sub-table: Date, Name, Amount, Running Balance, Category, Subcategory
     - Footer row: Net Worth (Total Assets - Total Liabilities)
   - Collapsible/expandable rows (click to expand)
5. Build CategorySummary.tsx component:
   - **Table Structure**:
     - Row per category: Type, Name, Total (in period), Goal, Difference
     - Expandable row → shows all subcategories
     - Subcategory sub-table: Name, Total, Goal, Difference
   - Color coding: green if under budget, red if over

**Deliverables**:

- Dashboard page with working date range filter
- Account summary table with expandable transaction details
- Category summary table with expandable subcategory details
- Net worth calculation

**Testing**:

- Select different date ranges, verify data updates
- Expand/collapse account rows, verify transactions display
- Expand/collapse category rows, verify subcategories display
- Verify balances and totals calculate correctly
- Test with no transactions (should show $0.00)
- Test with transactions outside date range (should be excluded)

---

### Phase 6: Dashboard - Visualizations

**Goal**: Add charts and graphs to dashboard

**Tasks**:

1. Install charting libraries:
   - **Recharts**: `npm install recharts` - for line charts (net worth over time)
   - **@nivo/sankey**: `npm install @nivo/sankey @nivo/core` - for Sankey diagram
     - Recommended: Better React integration, responsive, excellent tooltips
     - Active maintenance, good documentation
     - Alternative: `plotly.js-react` (includes Sankey but heavier bundle)
   - Note: Recharts doesn't include Sankey support, need separate library
2. Create chart service (`/src/services/charts.ts`):
   - prepareNetWorthData(startDate, endDate)
     - Returns: `[{ date, account1, account2, ..., netWorth }]`
     - Simple aggregation - straightforward for line chart
   - prepareSankeyData(startDate, endDate)
     - Returns nodes and links in Nivo format:
       ```typescript
       {
         nodes: [
           { id: 'Income:Salary' },
           { id: 'Income' },
           { id: 'Expenses' },
           { id: 'Expenses:Rent' }
         ],
         links: [
           { source: 'Income:Salary', target: 'Income', value: 5000 },
           { source: 'Income', target: 'Expenses', value: 3000 },
           { source: 'Expenses', target: 'Expenses:Rent', value: 1500 }
         ]
       }
       ```
     - Aggregate transactions by subcategory and category
3. Build NetWorthChart.tsx (straightforward with Recharts):
   - Use `<LineChart>` component from Recharts
   - Line chart showing each account's value over time
   - Separate line for net worth
   - Time granularity based on date range:
     - < 28 days: daily
     - < 180 days: weekly
     - ≥ 180 days: monthly
   - Legend with color coding per account
   - Tooltip showing exact values on hover
   - Y-axis: dollar amount (formatted as currency), X-axis: date
4. Build SankeyDiagram.tsx (using @nivo/sankey):
   - Import `ResponsiveSankey` from `@nivo/sankey`
   - Flow visualization of money movement
   - Left side: Income subcategories → Income categories
   - Right side: Expense categories → Expense subcategories
   - Width of flow = dollar amount
   - Key props:
     - `data`: nodes and links from prepareSankeyData()
     - `nodeThickness`: 15-20px
     - `nodeSpacing`: 24px
     - `linkOpacity`: 0.5
     - `enableLinkGradient`: true (beautiful gradient effect)
     - `tooltip`: Custom component showing exact $ amounts
   - Color coding by category type (income = green, expense = red)
   - Tooltip showing exact amounts on hover
   - Handle edge case: if no income or no expenses, show message
   - Responsive to container size
   - prepareSankeyData(startDate, endDate)
5. Integrate charts into DashboardPage.tsx:
   - Chart section below tables
   - Tab interface or side-by-side layout
   - Responsive sizing

**Deliverables**:

- Net worth over time chart
- Sankey diagram
- Charts update based on date range filter
- Responsive design

**Testing**:

- Select various date ranges, verify charts update
- Verify net worth line matches calculated net worth
- Hover tooltips display correct values
- Test with edge cases:
  - Single transaction
  - No transactions
  - Only income or only expenses
  - Very large date range (performance)
- Verify responsiveness on mobile/tablet

---

### Phase 7: AI Integration - Single Transaction Categorization

**Goal**: Implement AI-powered categorization for manually entered transactions

**Tasks**:

1. Set up Gemini API:
   - Get API key from Google AI Studio
   - Add to environment variables
   - Test API connection
2. Create Vercel Serverless Function (`/api/categorize.ts`):
   - Accepts:
     - Single mode: `{ transaction: { name, account, amount }, user_id }`
     - Batch mode: `{ transactions: [{ name, account, amount }], user_id }`
   - **Process**:
     1. Fetch user's categories and subcategories
     2. Fetch sample of user's past transactions (last 50-100)
     3. Fetch user's AI corrections
     4. Build prompt (single or batch format - see AI Features section)
     5. Call Gemini API
     6. Parse JSON response
     7. Return:
        - Single: `{ subcategory: "name" }`
        - Batch: `[{ subcategory: "name" }, ...]`
   - Error handling: return "Unassigned" if API fails
   - Logging: log API calls with token usage for cost monitoring
   - Rate limiting: implement per-user rate limits
3. Create AI service (`/src/services/ai.ts`):
   - categorizeSingleTransaction(name, account, amount): calls /api/categorize (single mode)
   - categorizeBatchTransactions(transactions[]): calls /api/categorize (batch mode)
4. Update TransactionForm component:
   - **Lookup step** (runs before AI):
     - On transaction name input, lookup in transactions table
     - If match found, auto-fill subcategory (show indicator: "Based on previous entry")
     - Allow user to override
   - **AI step** (runs if no lookup match):
     - When user tabs out of "Name" field or enters Amount, trigger AI categorization
     - Show loading state: "AI is categorizing..."
     - Display suggested subcategory
     - Show acceptance UI: checkmark to accept, X to override
     - If overridden, save to ai_corrections table
5. Update transaction save logic:
   - Set `ai_suggested` field to true if AI was used
   - Set `user_corrected` field to true if user overrode AI

**Deliverables**:

- Working AI categorization in transaction forms
- Lookup-first approach (checks past transactions before calling AI)
- User can accept or override AI suggestions
- AI corrections stored for future improvement

**Testing**:

- Add transaction with name that matches past transaction → verify lookup works
- Add new transaction → verify AI categorization triggers
- Verify AI returns reasonable suggestion
- Override AI suggestion → verify correction saved to ai_corrections table
- Add same transaction again → verify corrected category is suggested (via lookup)
- Test with Gemini API failures → verify fallback to "Unassigned"
- Test with invalid JSON responses → verify error handling

---

### Phase 8: Statement Parsing with Regex + Parallel Batch Categorization

**Goal**: Implement the core "paste statement" feature with regex parsing and efficient AI categorization

**Tasks**:

1. Create regex parsing utilities (`/src/lib/statementParser.ts`):
   - **Pattern library**:
     - Define regex patterns for common statement formats (credit cards, banks)
     - Support multiple date formats (MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY)
     - Handle various amount formats ($1,234.56, -$45.99, ($99.99), 123.45)
     - Detect debit/credit indicators
   - **Parsing functions**:
     - `detectFormat(text)`: try each pattern, return best match
     - `parseTransactions(text, format)`: extract transactions using selected pattern
     - `normalizeTransaction(raw)`: clean and standardize extracted data
     - `validateTransaction(txn)`: ensure date, name, amount are valid
   - **Error handling**:
     - Return "needs_review" flag for transactions with parsing errors
     - Calculate confidence score (% of fields successfully extracted)
2. Create Vercel Serverless Function (`/api/parse-statement.ts`):
   - Accepts: `{ statementText: string, accountId: uuid, userId: uuid }`
   - **Process**:
     1. **Parse with regex** (no AI):
        - Call statementParser.parseTransactions(statementText)
        - Returns array: `[{ date, name, amount, needs_review }]`
     2. **Filter duplicates**:
        - Check existing transactions (same date + name + amount + account)
        - Mark duplicates (don't include in results)
     3. **Lookup categorization** (database, no AI):
        - For each transaction: query for same name + account in history
        - If found: assign subcategory_id, mark as `categorization: 'lookup'`
     4. **Prepare for AI categorization**:
        - Collect transactions with `categorization: 'needs_ai'`
        - Split into batches of 10
     5. **Parallel batch categorization** (AI):
        ```javascript
        const batches = chunkArray(needsAI, 10);
        const promises = batches.map((batch) =>
          fetch("/api/categorize", {
            method: "POST",
            body: JSON.stringify({ transactions: batch, user_id: userId }),
          })
        );
        const results = await Promise.all(promises); // Parallel execution
        ```
     6. **Merge results**:
        - Combine lookup results + AI results
        - Return array with all transactions categorized
   - Error handling:
     - If regex parsing fails badly (< 30% success rate): return error, ask user to check format
     - If AI batch fails: assign "Unassigned" to that batch, continue with others
     - Return partial results, never completely fail
   - Performance logging: track parsing time, AI time, total time
3. Create statement service (`/src/services/statements.ts`):
   - parseStatement(text, accountId): calls /api/parse-statement
   - validateStatementFormat(text): quick check before full parse
4. Build StatementParser.tsx component:
   - **UI Structure**:
     - Dropdown: Select account
     - Textarea: Paste statement text
     - "Format Help" link/tooltip showing supported formats
     - Button: "Parse Transactions"
     - Progress indicator:
       - Step 1: Parsing... (regex)
       - Step 2: Looking up categories... (database)
       - Step 3: AI categorizing X transactions... (with progress)
     - Results table:
       - Columns: Date, Name, Amount, Subcategory (editable), Source, Actions
       - Color coding:
         - 🟢 Green: lookup (from history)
         - 🔵 Blue: AI categorized
         - ⚪ Gray: "Unassigned"
         - 🟡 Yellow: needs_review (parsing issue)
       - Edit inline or click to open modal
       - Delete button per row
     - Summary bar: "Found 45 transactions: 30 from history, 15 by AI, 0 unassigned"
     - Button: "Add All to Transactions" (saves to database)
   - **Workflow**:
     1. User selects account and pastes statement
     2. Click "Parse Transactions"
     3. Show progress through 3 steps
     4. Display results table with color-coded categorizations
     5. User reviews, edits if needed (especially yellow "needs_review")
     6. Click "Add All" → saves all transactions
     7. Success message: "Added 45 transactions to your account"
   - **Smart defaults**:
     - Auto-detect account type (credit card vs. checking) from statement format
     - Suggest account if only one matches detected type
5. Add StatementParser to TransactionInputPage.tsx:
   - New tab: "Import from Statement"
   - Prominent placement (should be main way to add transactions)
6. Handle edge cases:
   - Very large statements (> 200 transactions): warn user, process in chunks
   - Malformed statements: show specific parsing errors, suggest fixes
   - All transactions are duplicates: show message, don't add any
   - Mixed statement types in one paste: try to detect and handle

**Deliverables**:

- Working statement parser with AI extraction
- Preview and edit interface before saving
- Integration with existing categorization logic
- Duplicate detection

**Testing**:

- Paste various statement formats (credit card, bank statement)
- Verify transactions extracted correctly
- Verify categorization applied (lookup + AI)
- Edit subcategories in preview table
- Save transactions → verify they appear in transaction history
- Test with malformed text → verify error handling
- Test with duplicate transactions → verify detection
- Test with very long statement → verify performance

---

### Phase 9: AI Chatbot Side Panel

**Goal**: Build conversational AI assistant as a persistent side panel (VS Code-style)

**Tasks**:

1. Database tables already defined in Phase 1:
   - `chat_sessions`: stores chat session metadata
   - `chat_messages`: stores individual messages per session
2. Create Vercel Serverless Function (`/api/chat.ts`):
   - Accepts: user message, user_id, session_id, current_page (optional context)
   - **Process**:
     1. Fetch or create chat session
     2. Fetch user's accounts, recent transactions, categories, goals
     3. Fetch user's AI personality preference
     4. Fetch session chat history (last 20 messages)
     5. Build system prompt:
        - Personality directive based on user preference
        - User data summary
        - Current page context (e.g., "User is viewing Dashboard")
        - Available actions (via function calling):
          - create_account, create_category, create_subcategory
          - add_transaction, update_goal, get_spending_summary
          - parse_statement, categorize_transaction
        - Instructions on how to be helpful
     6. Call Gemini API with function calling enabled
     7. If function called, execute action and return result
     8. Stream response back to client
   - Save user message and assistant response to database with session_id
   - Update session's last_message_at timestamp
3. Create chat service (`/src/services/chat.ts`):
   - sendMessage(message, sessionId): calls /api/chat with streaming
   - getSessions(): fetches all user's chat sessions
   - getSessionMessages(sessionId): fetches messages for specific session
   - createSession(title?): creates new chat session
   - deleteSession(sessionId): deletes session and its messages
   - renameSession(sessionId, newTitle): updates session title
4. Create useChatPanel hook (`/src/hooks/useChatPanel.ts`):
   - Manages panel open/closed state
   - Persists state in localStorage
   - Manages current session
   - Handles panel width (resizable)
5. Build ChatSidePanel.tsx component:
   - **Panel Structure**:
     - Slide-in from right (overlay or push content)
     - Resizable width (drag handle on left edge)
     - Collapsible (toggle button)
     - Z-index to appear above page content
   - **Panel Header**:
     - "AI Assistant" title + personality indicator badge
     - Session dropdown/menu to switch between sessions
     - "New Session" button
     - Close/minimize button
   - **Quick Actions Bar** (below header):
     - Icon buttons for common actions:
       - "Categorize Statement"
       - "Add Transaction"
       - "Review Spending"
       - "Set Goal"
     - Clicking inserts prompt template into input
   - **Message Area** (scrollable):
     - User messages (right-aligned, blue bubble)
     - Assistant messages (left-aligned, gray bubble)
     - Function call indicators ("🔄 Creating account...")
     - Markdown rendering (bold, lists, code blocks)
     - Timestamp on hover
     - Auto-scroll to latest message
   - **Input Area** (bottom):
     - Textarea with auto-resize
     - Send button (or Enter to send, Shift+Enter for newline)
     - Character count (if near limit)
     - Suggested prompts for new/empty sessions
   - **Features**:
     - Streaming responses with typing indicator
     - Loading state while function executing
     - Error handling with retry option
     - Copy message button
     - Regenerate response button
6. Build ChatSessionList.tsx component:
   - Dropdown menu showing all sessions
   - Each session shows:
     - Auto-generated title (from first message)
     - Timestamp (relative: "2 hours ago")
     - Preview of last message
   - Actions per session:
     - Rename (inline edit)
     - Delete (confirmation)
   - Active session highlighted
   - Search/filter sessions (if many)
7. Integrate panel into App.tsx:
   - Add toggle button in app header (AI sparkle icon)
   - Render ChatSidePanel as overlay
   - Pass current page/route context to panel
   - Panel persists across navigation
8. Add personality selector to SettingsPage.tsx:
   - Radio buttons: Professional, Friendly, Stern
   - Description of each personality
   - Auto-save on change
   - Preview example responses
9. Implement function calling in chat endpoint:
   - Define function schemas for Gemini
   - Execute functions server-side (create DB records)
   - Return results to user in natural language
   - Show success confirmation in chat
10. Add keyboard shortcuts:
    - `Ctrl+K` or `Cmd+K`: Toggle chat panel
    - `/`: Focus chat input (if panel open)
    - `Esc`: Close panel

**Deliverables**:

- Working chat side panel with VS Code-style UX
- Panel toggles from all pages in the app
- Multiple chat sessions with history
- Session management (create, rename, delete, switch)
- AI assistant can answer questions about user's finances
- AI can perform actions (create accounts, add transactions, etc.)
- Quick action buttons for common tasks
- Personality customization
- Chat history persistence per session
- Resizable panel width
- Keyboard shortcuts

**Testing**:

- Toggle panel open/closed from different pages
- Verify panel persists when navigating between pages
- Resize panel width → verify persists on refresh
- Create new session → verify appears in session list
- Switch between sessions → verify correct message history loads
- Rename session → verify title updates
- Delete session → verify messages removed from database
- Send message in session → verify saves to correct session
- Send various messages, verify responses make sense
- Ask about spending patterns → verify AI accesses user data correctly
- Request AI to create account → verify account created in database
- Request AI to add transaction → verify transaction added
- Use quick action buttons → verify prompt templates insert correctly
- Change personality setting → verify tone changes in new messages
- Test streaming responses with typing indicator
- Test error handling (API failures, invalid function calls)
- Test with brand new user (no data) → verify helpful onboarding
- Test keyboard shortcuts (Ctrl+K to toggle, Esc to close)
- Test markdown rendering in responses
- Test function call indicators display correctly
- Verify current page context passed to AI (check AI references current page)

---

### Phase 10: Budget Goals & Tracking

**Goal**: Implement spending goals and saving goals with tracking

**Tasks**:

1. Create goals service (`/src/services/goals.ts`):
   - createSpendingGoal(subcategoryId, amount, period, startDate, endDate)
   - updateSpendingGoal(id, data)
   - deleteSpendingGoal(id)
   - getSpendingGoals()
   - getSpendingProgress(goalId, startDate, endDate)
   - createSavingGoal(name, targetAmount, targetDate, accountId)
   - updateSavingGoal(id, data)
   - deleteSavingGoal(id)
   - getSavingGoals()
   - getSavingProgress(goalId)
2. Create useGoals hook (`/src/hooks/useGoals.ts`):
   - Fetch and manage goals
   - Calculate progress metrics
3. Update SetupPage.tsx (Step 3: Subcategories):
   - Add optional "Set Spending Goal" fields:
     - Amount (dollar)
     - Period (dropdown: weekly, monthly, quarterly, annual)
     - Start date (optional)
     - End date (optional, for time-bound goals)
4. Build GoalsPage.tsx (new page):
   - **Spending Goals Section**:
     - Table of all spending goals:
       - Subcategory, Amount, Period, Progress (current spending), Status
       - Progress bar (green if under, red if over)
       - Edit/Delete buttons
     - "Add Spending Goal" button → modal form
   - **Saving Goals Section**:
     - Cards or list of saving goals:
       - Goal name, Target amount, Target date, Current progress
       - Progress bar showing current vs. target
       - Estimated completion date (based on recent savings rate)
       - Edit/Delete buttons
     - "Add Saving Goal" button → modal form
5. Update CategorySummary.tsx in Dashboard:
   - Show goals alongside actual spending
   - Color coding: green if meeting goal, red if exceeding
   - Progress indicators
6. Update ChatBot with goal-related functions:
   - AI can help user set goals
   - AI can report on goal progress

**Deliverables**:

- Spending goals per subcategory with period flexibility
- Saving goals with amount/date targets
- Goals page for management
- Goal progress visible in dashboard
- AI chatbot can help with goals

**Testing**:

- Create spending goal → verify appears in goals page and dashboard
- Spend within budget → verify shows green
- Spend over budget → verify shows red
- Create saving goal (amount only) → verify progress calculates
- Create saving goal (date only) → verify timeline shows
- Create saving goal (both) → verify both tracked
- Edit/delete goals → verify changes persist
- Link saving goal to account → verify tracks that account's balance
- Ask chatbot about goals → verify accurate responses

---

### Phase 11: Financial Health Score

**Goal**: Calculate and display financial health score on dashboard

**Tasks**:

1. Create scoring service (`/src/services/scoring.ts`):
   - calculateFinancialHealthScore(userId, startDate, endDate): returns 0-100 score
   - **Scoring Algorithm** (recommended):

     ```
     Spending vs. Goals (40 points max):
     - For each spending goal, calculate: (goal - actual) / goal
     - Average across all goals
     - Convert to 0-40 scale (0% = 0 pts, 100% = 40 pts)
     - If no goals set, give 20 points (neutral)

     Savings Rate (30 points max):
     - Calculate: (income - expenses) / income
     - Convert to 0-30 scale
     - Thresholds: <0% = 0, 0-10% = 10, 10-20% = 20, >20% = 30

     Saving Goals Progress (20 points max):
     - For each saving goal, calculate progress %
     - Average across all goals
     - Convert to 0-20 scale
     - If no goals set, give 10 points (neutral)

     Net Worth Trend (10 points max):
     - Compare net worth at start vs. end of period
     - Positive change: 10 points
     - No change: 5 points
     - Negative change: 0-5 points (scaled by % change)
     ```

   - getScoreBreakdown(userId, startDate, endDate): returns detailed breakdown
   - getScoreHistory(userId): returns historical scores (monthly)

2. Build FinancialHealthScore.tsx component:
   - **Main Display**:
     - Large circular progress indicator (0-100)
     - Color coding:
       - 0-40: Red
       - 41-70: Yellow
       - 71-100: Green
     - Score number in center
     - Label: "Financial Health Score"
   - **Breakdown Panel** (expandable):
     - Each factor with sub-score:
       - "Spending vs. Goals: 35/40"
       - "Savings Rate: 22/30"
       - "Saving Goals: 15/20"
       - "Net Worth Trend: 8/10"
     - Brief explanation of each factor
     - Tips for improvement (if score low)
   - **Historical Chart**:
     - Line chart of score over past 6-12 months
     - Shows trend
3. Integrate into DashboardPage.tsx:
   - Place prominently near top
   - Updates based on date range filter
4. Add score calculation to dashboard service

**Deliverables**:

- Financial health score calculation
- Visual score display on dashboard
- Breakdown showing contributing factors
- Historical trend chart
- Tips for improvement

**Testing**:

- New user (no data) → verify shows neutral/default score
- User meeting all goals → verify shows high score
- User overspending → verify shows lower spending score component
- User with high savings rate → verify reflected in score
- User with positive net worth trend → verify bonus points
- Change date range → verify score recalculates
- View score breakdown → verify math is correct
- Check historical trend → verify past scores accurate

---

### Phase 12: Polish, Testing & Deployment

**Goal**: Final touches, comprehensive testing, and production deployment

**Tasks**:

#### 12.1: UI/UX Polish

- Review all pages for consistent styling
- Ensure responsive design on mobile/tablet/desktop
- Add loading states for all async operations
- Improve error messages (user-friendly, actionable)
- Add empty states (e.g., "No transactions yet" with CTA)
- Add success notifications/toasts for user actions
- Keyboard shortcuts (e.g., "/" to focus search)
- Accessibility audit:
  - Semantic HTML
  - ARIA labels
  - Keyboard navigation
  - Screen reader testing
- **Dark mode verification**: Ensure dark theme is consistently applied
  - All components follow dark theme palette
  - Proper contrast ratios for readability
  - Interactive elements have visible hover states
  - Loading states and animations work well in dark mode

#### 12.2: Performance Optimization

- Code splitting (lazy load routes)
- Image optimization
- Bundle size analysis and reduction
- Database query optimization:
  - Add indexes where needed
  - Review N+1 query issues
- Caching strategy:
  - Cache static data (categories, accounts)
  - Consider React Query or SWR for data fetching
- Debounce/throttle expensive operations
- Pagination for large transaction lists

#### 12.3: Unit Testing

- Test utilities and helper functions
- Test services (mock Supabase calls)
- Test custom hooks
- Test form validation logic
- Target: >70% coverage for critical paths

#### 12.4: Integration Testing

- Test authentication flows end-to-end
- Test transaction CRUD operations
- Test AI categorization (mock API responses)
- Test goal tracking calculations
- Test financial health score calculation
- Use testing library: Vitest + React Testing Library

#### 12.5: End-to-End Testing

- Test complete user journeys:
  - New user signup → setup → add transactions → view dashboard
  - Import statement → categorize → view in history
  - Set goals → track progress → view score
  - Chat with AI → perform actions
- Use E2E framework: Playwright or Cypress
- Test on multiple browsers (Chrome, Firefox, Safari)

#### 12.6: Security Review

- Review RLS policies (ensure no data leaks)
- Audit environment variables (no secrets in client code)
- CSRF protection on forms
- Rate limiting on API endpoints (especially AI endpoints)
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)
- XSS prevention
- Review authentication flow for vulnerabilities

#### 12.7: Documentation

- Update README.md:
  - Project overview
  - Setup instructions (local development)
  - Environment variables guide
  - Tech stack details
  - Contribution guidelines
- Add code comments for complex logic
- Document API endpoints (consider OpenAPI spec)
- Create user guide or help docs (can be in-app tooltips)

#### 12.8: Error Monitoring & Logging

- **Refer to [logging-guide.md](logging-guide.md) for logging preferences and standards**
- Set up error tracking (Sentry or similar)
- Add logging to API endpoints
- Set up alerts for critical errors
- Analytics (optional): Plausible or similar privacy-focused analytics

#### 12.9: Deployment

- **Vercel**:
  - Connect GitHub repo to Vercel
  - Configure environment variables in Vercel dashboard
  - Set up preview deployments for PRs
  - Deploy to production
- **Supabase**:
  - Review and finalize database migrations
  - Set up production environment (if using separate staging)
  - Configure connection pooling if needed
- **Custom Domain** (if applicable):
  - Purchase domain
  - Configure DNS
  - Set up SSL certificate (automatic with Vercel)
- **CI/CD**:
  - GitHub Actions workflow:
    - Run tests on PR
    - Lint and type-check
    - Auto-deploy to Vercel on merge to main

#### 12.10: Beta Testing

- Invite small group of users (5-10)
- Provide feedback form
- Monitor for errors and usability issues
- Iterate based on feedback

#### 12.11: Launch Checklist

- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Error monitoring active
- [ ] Documentation complete
- [ ] Responsive design verified
- [ ] Accessibility verified
- [ ] Beta feedback addressed
- [ ] Backup strategy in place (Supabase automatic backups enabled)
- [ ] Legal: Terms of Service, Privacy Policy (if collecting data beyond email)

**Deliverables**:

- Production-ready application deployed to Vercel
- Comprehensive test suite
- Documentation
- Monitoring and error tracking
- Beta feedback incorporated

**Testing**:

- Run full test suite (unit, integration, E2E)
- Manual testing on production environment
- Performance testing (Lighthouse score >90)
- Security testing (basic penetration testing)
- User acceptance testing with beta users

---

## Future Enhancements (Not in Initial Phases)

These features are noted but not part of the MVP development plan:

1. **Multi-Currency Support**
   - Add currency field to accounts
   - Exchange rate handling
   - Currency conversion in dashboard

2. **CSV Import/Export & Data Downloads**
   - Import transactions from CSV file upload
   - Export all transaction data to CSV
   - Export account/category data to CSV
   - Download charts and visualizations as PNG/SVG images
   - Bulk export (all data + visuals in ZIP file)

3. **PDF Statement Parsing**
   - OCR integration for PDF statements
   - Support for various bank statement formats

4. **Recurring Transactions**
   - Detect recurring patterns (subscriptions, rent)
   - Auto-suggest adding recurring transactions
   - Reminders for expected recurring transactions

5. **Multi-User/Family Accounts**
   - Share accounts/budgets with family members
   - Role-based permissions
   - Individual vs. shared views

6. **Better Auth Migration**
   - Evaluate Better Auth as alternative to Supabase Auth
   - Migration guide if switching

7. **Bank Account Linking**
   - Plaid integration for automatic transaction syncing
   - Link bank accounts, credit cards, investment accounts
   - Auto-import transactions daily
   - Balance reconciliation with live bank data
   - Handle auth/re-auth flows

8. **Mobile App**
   - React Native version
   - Camera receipt scanning
   - Push notifications for budget alerts

9. **MCP Server Integration**
   - Build Model Context Protocol (MCP) server
   - Expose budget app data and functions to external AI tools
   - Allow AI assistants (Claude, ChatGPT) to access user's financial data
   - Enable transaction input via external chat interfaces
   - Secure authentication and authorization for MCP clients

10. **User Analytics & Data Collection**
    - Anonymous usage analytics (privacy-focused)
    - Feature adoption tracking
    - Error monitoring and crash reporting
    - User feedback collection system
    - A/B testing framework for UX improvements
    - Aggregate spending insights (anonymized, opt-in)

11. **Investment Tracking**
    - Track stock/crypto holdings
    - Portfolio visualization
    - ROI calculations

12. **Tax Preparation**
    - Export tax-relevant transactions
    - Categorize for tax purposes
    - Generate tax reports

13. **Bill Reminders & Recurring Payments**
    - Set up bill due dates
    - Push/email/in-app notifications
    - Mark bills as paid automatically or manually
    - Link reminders to specific transactions
    - Detect and suggest recurring payment patterns
    - Calendar integration for bill due dates

14. **Financial Projections** (High Priority Future Feature)
    - **Overview**: Project account balances and net worth into the future
    - **Time Horizons**: Support various projection periods (months, years, decades)
    - **Projection Models**:
      - **Baseline Model**: Assume user adheres to current budget/spending patterns
      - **Budget-Based**: Project based on user's set spending goals for each subcategory
      - **Custom Scenarios**: Allow user to define specific assumptions
    - **Variable Inputs**:
      - **Rate Changes** (static or year-over-year):
        - Expense increases (e.g., "expenses will increase 3% annually")
        - Income changes (e.g., "income will increase 5% at year 2")
        - Subcategory-specific rates (e.g., "rent increases 2% YoY")
      - **Lump Sum Events**:
        - One-time expenses (e.g., "$50K house down payment in 2028")
        - Windfalls (e.g., "$20K bonus in Q4 2027")
        - Major purchases or life events
      - **Account Growth Rates**:
        - Savings account interest rates (e.g., 4.5% APY)
        - Investment account returns (e.g., 7% annually)
        - Debt payoff schedules (e.g., mortgage amortization)
    - **Inflation Adjustment**:
      - Toggle between nominal and real (inflation-adjusted) terms
      - User-configurable inflation rate
      - Default: use historical/current inflation data
    - **Visualization**:
      - Multi-line chart showing projected balances over time
      - Scenario comparison (baseline vs. optimistic vs. conservative)
      - Highlight key milestones (e.g., "Savings goal reached in 3.2 years")
    - **What-If Analysis**:
      - Interactive sliders to adjust assumptions in real-time
      - See immediate impact of changes on projections
      - Compare multiple scenarios side-by-side
    - **Goal Integration**:
      - Show when saving goals will be reached under current trajectory
      - Suggest adjustments to meet goals by target date
      - Alert if goals become unrealistic based on spending patterns
    - **Implementation Notes**:
      - Build after core features are stable (Phase 13+)
      - Use compound growth formulas for investment accounts
      - Consider Monte Carlo simulation for probability ranges (advanced)
      - Export projection reports as PDF

---

## Key Recommendations

### AI Implementation Best Practices

- **Context is crucial**: Always send user's past transaction patterns to LLM for better categorization
- **Feedback loop**: Store user corrections and include in future prompts
- **Fallback gracefully**: Always have "Unassigned" as fallback if AI fails
- **Cost management**: Cache common categorizations to reduce API calls
- **Prompt engineering**: Iterate on prompts based on real-world accuracy
- **Model choice**: Start with Gemini 2.5 Flash for balance of accuracy/cost; upgrade to Pro if needed

#### AI Categorization Optimization Factors

Key variables to tune for optimal performance, cost, and accuracy:

1. **Batch Size** (transactions per API call)
   - **Recommendation**: 20-50 transactions per batch for statement parsing
   - **Tradeoffs**:
     - Smaller batches (1-10): Higher cost, more API calls, but faster failure recovery
     - Larger batches (50-100): Lower cost, but risk losing entire batch on API failure
     - Very large batches (100+): May hit token limits, slower response time
   - **Implementation**: For single transaction input, use individual calls. For statement parsing, use batches.
   - **Testing**: Monitor success rate per batch size to find optimal point

2. **Context Window Size** (historical transactions included)
   - **Recommendation**: Last 50-100 user transactions with categories
   - **Tradeoffs**:
     - More context (100-200): Better accuracy for ambiguous cases, but higher token cost
     - Less context (20-50): Lower cost, faster, but may miss patterns
     - Too much context (500+): Diminishing returns, risk hitting token limits
   - **Implementation**: Start with 50, increase if accuracy is poor
   - **Optimization**: Include only distinct transaction names (deduplicate)

3. **AI Corrections History**
   - **Recommendation**: Include all corrections where AI was wrong (up to 50 most recent)
   - **Purpose**: Direct feedback loop - "I was wrong about X, it's actually Y"
   - **Tradeoffs**:
     - Including corrections: Significantly improves accuracy on previously-failed cases
     - Excluding corrections: Saves tokens but AI repeats same mistakes
   - **Implementation**: Query ai_corrections table, include in dedicated prompt section

4. **Model Selection**
   - **Gemini 2.5 Flash** (recommended starting point):
     - Speed: Very fast (~1-2 seconds)
     - Cost: $0.075 per 1M input tokens, $0.30 per 1M output tokens
     - Accuracy: Good for straightforward categorization
     - Context window: 1M tokens
   - **Gemini 1.5 Pro** (upgrade if needed):
     - Speed: Slower (~3-5 seconds)
     - Cost: $1.25 per 1M input tokens, $5.00 per 1M output tokens (16x more expensive)
     - Accuracy: Better for ambiguous cases, nuanced categories
     - Context window: 2M tokens
   - **When to upgrade**: If Flash accuracy < 85% after prompt optimization

5. **Prompt Engineering**
   - **Structure**: System role + context + task + output format
   - **Optimization techniques**:
     - Use few-shot examples (include 3-5 example categorizations in prompt)
     - Be explicit about edge cases ("Amazon" could be shopping, books, AWS, etc.)
     - Request structured output (JSON schema reduces parsing errors)
     - Emphasize "If uncertain, use Unassigned" to prevent guessing
   - **Testing**: A/B test prompt variations, track accuracy

6. **Caching Strategy**
   - **Lookup cache** (database):
     - Check transactions table: same name + account → use previous category
     - Effectiveness: ~60-80% of transactions are recurring
     - Cost: Free (database query)
   - **API response cache** (optional):
     - Cache Gemini responses for identical inputs
     - Use Redis or Vercel KV for 30-day TTL
     - Effectiveness: Low (transaction names vary slightly)
     - Cost: Minimal storage cost

7. **Rate Limiting & Throttling**
   - **User-level limits**: Prevent abuse (e.g., 100 AI categorizations per day for free tier)
   - **API request batching**: Queue individual categorization requests, batch every 5 seconds
   - **Graceful degradation**: If rate limit hit, fall back to "Unassigned"

8. **Monitoring & Metrics**
   - Track per API call:
     - Token usage (input + output)
     - Response time
     - Success rate (valid JSON returned)
     - Accuracy (% of suggestions accepted by user)
   - Track aggregate:
     - Daily API cost
     - Average accuracy by category
     - Lookup hit rate (% transactions categorized without AI)
   - Use metrics to optimize: If accuracy drops, investigate prompt or increase context

9. **Error Handling & Fallbacks**
   - **API failures**: Always return "Unassigned", never block user workflow
   - **Invalid JSON**: Use Gemini's JSON mode if available, or add retry with "ensure valid JSON" prompt
   - **Token limit exceeded**: Reduce context window automatically and retry
   - **Rate limit exceeded**: Queue request or show user-friendly message

10. **Cost Estimation** (example with Gemini 2.5 Flash)
    - **Single transaction**:
      - Input: ~500 tokens (context + transaction)
      - Output: ~10 tokens (JSON response)
      - Cost: ~$0.000037 per transaction (~$0.04 per 1,000 transactions)
    - **Batch of 50 transactions**:
      - Input: ~1,500 tokens (context + 50 transactions)
      - Output: ~100 tokens (JSON array)
      - Cost: ~$0.00014 per batch (~$0.003 per 1,000 transactions)
      - **Savings**: ~93% cost reduction vs. individual calls
    - **Monthly estimate** (1,000 transactions/month, 70% lookup hit rate, 30% AI):
      - AI calls needed: 300 transactions
      - Using batches (statement parsing): ~$0.001
      - Using individual calls: ~$0.01
      - **Recommendation**: Negligible cost - prioritize accuracy over cost optimization

### Data Management Best Practices

- **Soft deletes**: Use `deleted_at` field instead of hard deletes for accounts/categories (maintains transaction history integrity)
- **Balance calculations**: Always calculate from transactions, never store running balances (source of truth)
  - Formula: `running_balance = account.initial_balance + SUM(transactions WHERE account_id = X AND date <= transaction.date ORDER BY date, created_at)`
  - Calculate on-the-fly when displaying transactions
  - Ensures editing initial balance or any transaction automatically updates all dependent balances
  - Use database window functions for efficient calculation: `SUM() OVER (PARTITION BY account_id ORDER BY date, created_at)`
- **Reconciliation**: Provide manual adjustment feature for when calculated balance doesn't match real-world balance
- **Archival**: Consider archiving very old transactions (>2 years) to separate table for performance

### UX Best Practices

- **AI chatbot as core feature**: The side panel chat should be prominent and accessible from all pages via a visible toggle button in the header
- **Chat persistence**: Chat panel state and session should persist across page navigation for continuity
- **Auto-save everything**: Reduces friction, prevents data loss
- **Progressive disclosure**: Don't overwhelm users with all features at once (wizard-based setup)
- **Instant feedback**: Show loading states, success/error messages immediately
- **Keyboard shortcuts**: Power users will appreciate them (especially Ctrl+K/Cmd+K for chat)
- **Empty states**: Always show helpful CTAs when no data exists
- **Responsive tables**: On mobile, consider card-based layouts instead of tables
- **Side panel UX**: Follow VS Code patterns - resizable, collapsible, maintains context

### Performance Considerations

- **Pagination**: Essential for transaction history (users may have thousands of transactions)
- **Lazy loading**: Only load data when needed (e.g., chart data only when viewing charts)
- **Debouncing**: Especially for auto-save and search functionality
- **Optimistic updates**: Update UI immediately, sync to DB in background
- **Caching**: Cache user's categories/accounts/goals (rarely change)

### Security Considerations

- **RLS is critical**: All tables must have proper Row Level Security policies
- **API rate limiting**: Prevent abuse of AI endpoints (costly)
- **Input validation**: Both client-side and server-side
- **Sensitive data**: Never log transaction details or user financial data
- **API keys**: Use environment variables, never commit to Git
- **Encryption & Privacy** (Privacy-First Approach):
  - **At Rest**: Supabase encrypts all data at rest by default
  - **In Transit**: HTTPS/TLS for all API communication
  - **Client-Side Encryption** (consider for future):
    - Encrypt sensitive transaction data before sending to database
    - User holds encryption key (zero-knowledge architecture)
    - Trade-off: Limits server-side aggregation and AI analysis
  - **Data Minimization**: Only collect essential financial data
  - **User Data Control**:
    - Full data export functionality
    - Complete account deletion (including all transactions)
    - Transparency about what data is stored and how it's used
  - **AI Privacy**:
    - Transaction data sent to AI is anonymized where possible
    - No long-term storage of raw transactions by AI provider
    - User consent for AI processing
  - **Third-Party Audits**: Consider SOC 2 compliance (if scaling)
- **Computation Strategy**:
  - **Client-Side** (Browser):
    - UI rendering and interactions
    - Form validation
    - Simple calculations (running balances for display)
    - Chart data transformation
    - Local caching and state management
  - **Server-Side** (Vercel Functions + Supabase):
    - Authentication
    - Database queries and aggregations
    - AI categorization calls
    - Complex financial calculations (health score, projections)
    - Batch processing (statement parsing)
  - **Rules of Thumb**:
    - Sensitive operations: server-side (security)
    - Expensive operations: server-side (performance, especially for large datasets)
    - Interactive UX: client-side when possible (responsiveness)
    - Data aggregation: prefer database/server-side (efficiency)
    - Balance between: Offload heavy computation to server, but keep UI responsive with optimistic updates

### Name Constraints

#### Naming Rules

- **Unique names constraint**: Accounts, categories, and subcategories must all have unique names from each other within a user's data
  - An account CANNOT have the same name as a category
  - An account CANNOT have the same name as a subcategory
  - Two subcategories (even under different categories) CANNOT have the same name
  - This ensures unambiguous reference and prevents user confusion

#### Renaming Behavior

- **Merge on rename**: When renaming an account, category, or subcategory to the same name as an existing one, the system will merge them together
  - Show warning dialog before merge: "An [account/category/subcategory] with this name already exists. Renaming will merge these items together. Do you want to proceed?"
  - For subcategories: If the subcategories belong to different parent categories, include this in the warning: "This subcategory exists under a different category ([CategoryName]). Merging will combine transactions from both subcategories."
  - After merge, all transactions referencing the old item will automatically reference the merged item

#### Deletion Rules

- **Deleting an account or subcategory**:
  1. Show popup/dialog with two options:
     - "Delete all associated transactions"
     - "Leave transactions unassigned"
  2. After user selects an option, show confirmation warning:
     - "Are you sure you want to delete [name]? This action cannot be undone."
     - Include count of affected transactions in the warning
  3. If "Delete all associated transactions" is selected, soft delete the transactions
  4. If "Leave unassigned" is selected, set `subcategory_id` to the system "Unassigned" subcategory (for transactions), or `account_id` to null (mark for user to reassign)

- **Deleting a category**:
  1. Check if category has any subcategories
  2. If it has subcategories: Show error message "Cannot delete category with subcategories. Please delete all subcategories first."
  3. If no subcategories: Show confirmation dialog "Are you sure you want to delete [category name]? This action cannot be undone."
  4. Only proceed with soft deletion after user confirms

---

## Success Metrics

After launch, track these metrics to measure success:

- **User Engagement**:
  - Daily/weekly active users
  - Average session duration
  - Transactions added per user per month
  - AI chatbot usage rate

- **Feature Adoption**:
  - % of users using statement parsing
  - % of users with budget goals set
  - % of transactions auto-categorized by AI
  - Financial health score views

- **AI Performance**:
  - Categorization accuracy (% of AI suggestions accepted)
  - Average AI response time
  - Cost per categorization
  - User correction rate

- **Technical Health**:
  - API error rate (<1%)
  - Average page load time (<2s)
  - Database query performance
  - Uptime (target: 99.9%)

---

## Questions & Decisions

### Answered

- ✅ Auth: Supabase Auth with Google OAuth
- ✅ Goals: Support both spending (time-based) and saving goals (time/amount)
- ✅ Categories: "Unassigned" mandatory and cannot be edited
- ✅ Save behavior: Auto-save everything
- ✅ AI personality: Toggles for professional/friendly/stern
- ✅ Statement parsing: Text paste initially, file upload later
- ✅ Balances: Calculated from transactions with manual reconciliation
- ✅ Currency: USD only initially
- ✅ Sharing: Single-user for now
- ✅ LLM: Gemini, prioritize accuracy > speed > cost
- ✅ Testing: Unit, integration, and E2E
- ✅ Error handling: Leave category blank if AI fails

### Deferred (for future phases)

- Multi-currency support
- Better Auth migration
- CSV import
- PDF parsing
- Recurring transaction detection
- Multi-user accounts

---

## Development Tips for AI Agents

When implementing each phase:

1. **Start with types**: Define TypeScript interfaces first
2. **Test as you go**: Write tests alongside implementation
3. **Commit frequently**: Small, atomic commits with clear messages
4. **Read before writing**: Review existing code structure before adding
5. **Error handling**: Handle errors at every layer (UI, service, API)
6. **Logging**: Add console logs for debugging (remove before production)
7. **Comments**: Add comments for complex logic, especially calculations
8. **Consistency**: Follow existing patterns and naming conventions
9. **Mobile-first**: Design responsive layouts from the start
10. **Accessibility**: Add ARIA labels and semantic HTML as you build

---

## Phase Completion Checklist

Before marking a phase as complete:

- [ ] All tasks in phase completed
- [ ] Code follows project conventions
- [ ] TypeScript types defined for new features
- [ ] Auto-save implemented (if applicable)
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Responsive design verified
- [ ] Tests written (unit/integration as applicable)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Git commits made with clear messages
- [ ] README updated (if needed)
- [ ] Phase deliverables achieved
- [ ] Phase testing checklist passed

---

**Ready to start Phase 0!** 🚀

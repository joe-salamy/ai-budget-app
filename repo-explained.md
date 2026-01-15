# Repository Structure Guide

This guide explains every folder and file in this AI-powered budget application, ordered for optimal learning. Read files in the order presented below.

## Table of Contents

- [Overview](#overview)
- [Part 0: JavaScript/TypeScript Fundamentals](#part-0-javascripttypescript-fundamentals) — Essential syntax
- [Part 1: Configuration Files](#part-1-configuration-files-tooling-setup) — Tooling setup
- [Part 2: Entry Point & Core React Architecture](#part-2-entry-point--core-react-architecture) — App startup flow
- [Part 3: Type Definitions](#part-3-type-definitions-understanding-the-data) — Data structures
- [Part 4: Core Infrastructure](#part-4-core-infrastructure) — Utilities & database client
- [Part 5: Services](#part-5-services-business-logic-layer) — Business logic
- [Part 6: Hooks](#part-6-hooks-react-state-management) — State management
- [Part 7: UI Components](#part-7-ui-components-reusable-building-blocks) — Building blocks
- [Part 8: Feature Components](#part-8-feature-components-complex-components) — Complex components
- [Part 9: Pages](#part-9-pages-top-level-views) — Full-screen views
- [Part 10: API](#part-10-api-serverless-functions) — Serverless functions
- [Part 11: Database](#part-11-database-supabase-migrations) — SQL migrations
- [Part 12: Documentation](#part-12-documentation--guides) — Docs & guides
- [Part 13: Development Tooling](#part-13-development-tooling) — VS Code & CLI config
- [Key Concepts for Python Developers](#key-concepts-for-python-developers) — Bridge from Python
- [Suggested Reading Order](#suggested-reading-order)
- [Glossary](#glossary)

---

## Overview

This is a **Single Page Application (SPA)** built with React that runs entirely in the browser. The frontend communicates with:

- **Supabase** (PostgreSQL database + authentication)
- **Vercel Serverless Functions** (AI features that run server-side)

---

## Part 0: JavaScript/TypeScript Fundamentals

Before diving into the codebase, you need to understand JavaScript/TypeScript syntax that appears everywhere. This section covers patterns you'll encounter on nearly every line.

### Arrow Functions

JavaScript has multiple ways to define functions. This codebase uses **arrow functions** almost exclusively:

```typescript
// Arrow function (most common in this codebase)
const handleClick = () => {
  console.log('clicked');
};

// Arrow function with parameters
const add = (a: number, b: number) => {
  return a + b;
};

// Implicit return (no braces = automatic return)
const multiply = (a: number, b: number) => a * b;

// Python equivalent:
# def handle_click():
#     print('clicked')
# add = lambda a, b: a + b
```

Arrow functions are used as **callbacks** constantly:

```typescript
// Filter array (like Python's filter())
const activeUsers = users.filter((user) => user.active);
// Python: active_users = [u for u in users if u.active]

// Transform array (like Python's map())
const names = users.map((user) => user.name);
// Python: names = [u.name for u in users]

// Find single item
const admin = users.find((user) => user.role === "admin");
// Python: admin = next((u for u in users if u.role == 'admin'), None)
```

### Destructuring

**Destructuring** extracts values from objects and arrays into variables. Used on almost every line in React:

```typescript
// Object destructuring - extract properties into variables
const user = { name: "Alice", age: 30, email: "alice@example.com" };
const { name, age } = user; // name = 'Alice', age = 30
// Python equivalent: name, age = user['name'], user['age']

// Destructuring with renaming
const { data: userData } = response; // Extracts 'data' but names it 'userData'

// Nested destructuring
const {
  data: { session },
} = response; // Extracts response.data.session

// Default values
const { name, role = "user" } = user; // If role missing, defaults to 'user'

// Array destructuring (used with useState!)
const [first, second] = ["a", "b"]; // first = 'a', second = 'b'
// Python equivalent: first, second = ['a', 'b']

// This is why useState looks like this:
const [count, setCount] = useState(0); // Returns [value, setterFunction]
```

### Spread Operator (`...`)

The spread operator copies/merges objects and arrays:

```typescript
// Copy object with modifications (immutable update)
const updatedUser = { ...user, name: "Bob" };
// Python: updated_user = {**user, 'name': 'Bob'}

// Merge objects
const merged = { ...defaults, ...userSettings };
// Python: merged = {**defaults, **user_settings}

// Copy arrays
const newArray = [...oldArray, newItem];
// Python: new_array = [*old_array, new_item]

// Pass array as function arguments
Math.max(...numbers);
// Python: max(*numbers)
```

### Template Literals

String interpolation uses backticks and `${}`:

```typescript
const message = `Hello, ${name}! You have ${count} messages.`;
// Python: message = f"Hello, {name}! You have {count} messages."

// Multi-line strings (no need for triple quotes)
const html = `
  <div>
    <h1>${title}</h1>
  </div>
`;
```

### Optional Chaining (`?.`) and Nullish Coalescing (`??`)

Handle null/undefined values safely:

```typescript
// Optional chaining - returns undefined if any part is null/undefined
const city = user?.address?.city;
// Python: city = user.address.city if user and user.address else None

// Without optional chaining (old way):
const city = user && user.address && user.address.city;

// Nullish coalescing - provide default for null/undefined
const name = user?.name ?? "Anonymous";
// Python: name = user.name if user and user.name is not None else 'Anonymous'

// Difference from || (or):
const count = data.count ?? 0; // Only replaces null/undefined
const count = data.count || 0; // Also replaces 0, '', false (usually wrong!)
```

### Async/Await and Promises

JavaScript handles asynchronous operations with **Promises** and **async/await**:

```typescript
// async function returns a Promise
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);  // Pauses until complete
  const data = await response.json();                // Pauses again
  return data;
}

// Calling async functions
const user = await fetchUser('123');  // Must be in async context

// Error handling
async function loadData() {
  try {
    const data = await fetchSomething();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Python equivalent:
# async def fetch_user(id: str) -> User:
#     response = await fetch(f"/api/users/{id}")
#     data = await response.json()
#     return data
```

**Promise** is like Python's `Future` - represents a value that will exist later:

```typescript
// Older .then() syntax (you'll see this in some code)
fetch("/api/data")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

// Equivalent async/await (preferred)
try {
  const response = await fetch("/api/data");
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

### Export and Import

JavaScript modules use `export` and `import` (not Python's `import`):

```typescript
// Named exports - can have multiple per file
export function useAuth() { ... }
export const API_URL = 'https://...';
export interface User { ... }

// Importing named exports (must use exact names, with braces)
import { useAuth, API_URL } from './auth';
import { useAuth as useAuthentication } from './auth';  // Rename with 'as'

// Default export - one per file, importable with any name
export default function App() { ... }

// Importing default export (no braces, any name works)
import App from './App';
import MyApp from './App';  // Same thing, different name

// Mixed import
import React, { useState, useEffect } from 'react';
// 'React' is the default export, useState/useEffect are named exports
```

### Type Imports

TypeScript requires separating **type** imports from **value** imports (enforced in this project):

```typescript
// Values (functions, classes, variables) - used at runtime
import { useState } from "react";
import { Button } from "./Button";

// Types (interfaces, type aliases) - erased at runtime
import type { ReactNode } from "react";
import type { User, Transaction } from "./types";

// WRONG - will cause build errors in this project:
import { useState, ReactNode } from "react"; // ReactNode is a type!

// Why? Types don't exist in JavaScript, only TypeScript. The compiler
// erases them, so they must be imported separately.
```

### TypeScript Generics

Generics let you create reusable types (like Python's `Generic[T]`):

```typescript
// Generic function
function first<T>(array: T[]): T | undefined {
  return array[0];
}
const num = first([1, 2, 3]);      // TypeScript infers: number
const str = first(['a', 'b']);     // TypeScript infers: string

// Generic types you'll see constantly:
const [user, setUser] = useState<User | null>(null);  // State can be User or null
const users: User[] = [];                              // Array of User objects
async function fetch(): Promise<Data> { ... }          // Returns Promise resolving to Data

// Python equivalents:
# from typing import TypeVar, Generic, Optional, List
# T = TypeVar('T')
# def first(array: List[T]) -> Optional[T]: ...
# user: Optional[User] = None
# users: List[User] = []
```

### Ternary Operator and Logical Expressions

Conditional expressions used heavily in JSX:

```typescript
// Ternary operator (condition ? ifTrue : ifFalse)
const message = isLoggedIn ? 'Welcome back!' : 'Please log in';
// Python: message = 'Welcome back!' if is_logged_in else 'Please log in'

// Used in JSX for conditional rendering
return (
  <div>
    {isLoading ? <Spinner /> : <Content />}
  </div>
);

// Logical AND for conditional rendering (render only if true)
return (
  <div>
    {error && <ErrorMessage text={error} />}
  </div>
);
// Only renders ErrorMessage if error is truthy
```

### Equality Operators

JavaScript has two equality operators - always use `===`:

```typescript
// === (strict equality) - checks value AND type
1 === 1; // true
1 === "1"; // false (number vs string)

// == (loose equality) - converts types first (AVOID!)
1 == "1"; // true (dangerous!)

// Always use === and !== in this codebase
```

---

## Part 1: Configuration Files (Tooling Setup)

These files configure your development environment. They tell various tools how to process your code.

### 📄 `package.json`

**What it does:** Like Python's `requirements.txt` + `setup.py` combined

- Lists all dependencies (libraries) the project needs
- Defines npm scripts (like `npm run dev` to start the dev server)
- Uses `"type": "module"` to enable ES6 module syntax (import/export)

### 📄 `tsconfig.app.json`

**What it does:** Configures the TypeScript compiler

- `verbatimModuleSyntax: true` - Forces strict separation of type imports (see CLAUDE.md)
- `"@/*": ["./src/*"]` - Path alias so you can write `import { foo } from '@/lib/utils'` instead of `'../../lib/utils'`
- `strict: true` - Enables all strict type-checking options

### 📄 `vite.config.ts`

**What it does:** Configures Vite (the build tool/dev server)

- Like Python's Flask dev server, but also bundles your code for production
- Handles hot module replacement (instant updates when you save files)
- Sets up the `@/` path alias to match TypeScript config

### 📄 `tailwind.config.js`

**What it does:** Configures Tailwind CSS

- Tailwind is a utility-first CSS framework (you style with class names like `bg-blue-500` instead of writing CSS)
- This file customizes the design system (colors, fonts, spacing)

### 📄 `postcss.config.js`

**What it does:** Configures PostCSS (CSS preprocessor)

- Tailwind runs through PostCSS to transform utility classes into actual CSS
- Like a build step for your styles

### 📄 `eslint.config.js`

**What it does:** Configures ESLint (code linter)

- Like Python's `pylint` or `flake8`
- Enforces code quality and catches common mistakes

### 📄 `.prettierrc` + `.prettierignore`

**What it does:** Configures Prettier (code formatter)

- Like Python's `black`
- Auto-formats code to enforce consistent style

### 📄 `.gitignore`

**What it does:** Tells Git which files to ignore

- Standard: `node_modules/`, `dist/`, `.env.local`

### 📄 `.env.local.example`

**What it does:** Template for environment variables

- Your actual `.env.local` contains secrets (API keys, database URLs)
- Never commit `.env.local` to Git!

### 📄 `components.json`

**What it does:** Configuration for shadcn/ui component library

- Tells the CLI where to install components and which style system to use

### 📄 `vercel.json`

**What it does:** Configuration for Vercel deployment

- Tells Vercel how to build and serve your app
- `rewrites` routes `/api/*` requests to serverless functions in the `api/` folder
- This is how your frontend can call `/api/chat` and reach the serverless function

---

## Part 2: Entry Point & Core React Architecture

**React application flow:** Browser loads `index.html` → runs `main.tsx` → mounts `<App />` → `<Router />` determines which page to show

### 📄 `index.html`

**What it does:** The single HTML file for this SPA

- Contains `<div id="root"></div>` where React injects the app
- Loads `src/main.tsx` via `<script type="module">`
- In Python terms: This is like Flask's base template, but there's only one page

**Note on file extensions:**

- `.ts` = TypeScript file (no JSX/HTML)
- `.tsx` = TypeScript file with JSX (React components)
- `.js` / `.jsx` = JavaScript equivalents (not used in this project)

### 📄 `src/main.tsx`

**What it does:** The JavaScript entry point (runs first)

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

- Finds the `#root` div in `index.html`
- Mounts the `<App />` component into it
- The `!` is a TypeScript assertion saying "this won't be null"
- In Python terms: Like `if __name__ == '__main__': app.run()`

### 📄 `src/App.tsx`

**What it does:** The root component of your entire application

```typescript
function App() {
  return (
    <AuthProvider>           {/* Provides authentication state to all children */}
      <TooltipProvider>      {/* Provides tooltip functionality */}
        <Router />           {/* Handles which page to show based on URL */}
        <Toaster />          {/* Renders toast notifications */}
      </TooltipProvider>
    </AuthProvider>
  );
}
```

- Wraps everything in **providers** (components that provide context to children)
- Order matters: AuthProvider must wrap Router so routes can access auth state
- Think of it as the top-level coordinator

### 📄 `src/Router.tsx`

**What it does:** Defines all routes/pages in your app

```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>        {/* Wrapper that checks auth */}
        <DashboardPage />
      </ProtectedRoute>
    } />
  </Routes>
</BrowserRouter>
```

- Uses React Router for **client-side routing** (no page reloads!)
- `<ProtectedRoute>` redirects to `/login` if user isn't authenticated
- The URL changes but the page doesn't reload—JavaScript swaps the content
- In Python terms: Like Flask's `@app.route()` decorators, but declarative

### 📄 `src/index.css`

**What it does:** Global CSS styles

```css
@tailwind base; /* Tailwind's reset styles */
@tailwind components; /* Tailwind's component classes */
@tailwind utilities; /* Tailwind's utility classes like bg-blue-500 */

:root {
  --background: 0 0% 100%; /* CSS custom properties for theming */
}

.dark {
  --background: 222.2 84% 4.9%; /* Dark mode overrides */
}
```

- Imports Tailwind CSS base styles
- Defines CSS custom properties (variables) for theming
- Sets up dark mode color scheme

---

## Part 3: Type Definitions (Understanding the Data)

Before reading the rest of the code, understand the data structures.

### 📄 `src/types/index.ts`

**What it does:** Defines all TypeScript types/interfaces

- Like Python `dataclasses` or `TypedDict`
- Defines: `User`, `Account`, `Transaction`, `Category`, `Goal`, etc.
- These types flow through your entire application

```typescript
// Interface defines the shape of an object
interface User {
  id: string;
  email: string;
  created_at: string;
}

// Type alias can define unions, primitives, or object shapes
type AccountType = 'asset' | 'liability';  // Union of literal strings

interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;           // Must be 'asset' or 'liability'
  initial_balance: number;
  created_at: string;
  deleted_at: string | null;   // Can be string OR null
}

// Python equivalent using TypedDict:
# class User(TypedDict):
#     id: str
#     email: str
#     created_at: str
#
# AccountType = Literal['asset', 'liability']
```

**Interface vs Type:**

- `interface` is for object shapes (preferred for objects)
- `type` is for unions, primitives, and complex types
- Both work similarly for objects; `interface` can be extended, `type` cannot

**Key concept:** TypeScript adds static typing to JavaScript. Types are erased at runtime (like Python type hints), but provide IDE autocomplete and catch errors during development.

---

## Part 4: Core Infrastructure

These files provide foundational utilities used everywhere.

### 📄 `src/lib/supabaseClient.ts`

**What it does:** Creates the Supabase client instance

```typescript
import { createClient } from "@supabase/supabase-js";

// Environment variables (set in .env.local, never committed to git)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single client instance (singleton pattern)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- **Supabase** is a hosted PostgreSQL database with a JavaScript SDK
- Provides authentication (login, signup) and database queries
- `import.meta.env.VITE_*` reads environment variables (Vite requires `VITE_` prefix)
- The client is created once and imported everywhere—never create multiple clients

**Environment variables:** Secrets like API keys are stored in `.env.local`:

```bash
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 📄 `src/lib/utils.ts`

**What it does:** Utility functions

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() = "class names" - merges Tailwind classes intelligently
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage:
cn("bg-red-500", "bg-blue-500"); // → 'bg-blue-500' (later wins)
cn("p-4", isLarge && "p-8"); // → 'p-4' or 'p-8' based on condition
cn("text-sm", className); // → merges with passed-in classes
```

### 📄 `src/lib/toast.ts`

**What it does:** Toast notification helper

```typescript
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  // ...
};

// Usage anywhere:
toast.success("Transaction saved!");
toast.error("Failed to load data");
```

- Uses `sonner` library to show temporary pop-up messages
- Like Flask's `flash()` messages, but appears without page reload

### 📄 `src/lib/statementParser.ts`

**What it does:** Parses bank statement files

- Extracts transactions from uploaded CSV/PDF files
- Uses regex and text processing

### 📄 `src/config/constants.ts`

**What it does:** Application-wide constants

- Like a Python `config.py` file
- Defines default categories, colors, etc.

---

## Part 5: Services (Business Logic Layer)

Services contain the core business logic. They're like Python modules with functions that do specific tasks.

**Architecture pattern:** Components call hooks → hooks call services → services call Supabase

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Component     │ --> │    Hook     │ --> │   Service    │ --> │   Supabase   │
│ (TransactionForm)│    │(useTransactions)│  │(transactions.ts)│  │  (Database)  │
└─────────────────┘     └─────────────┘     └──────────────┘     └──────────────┘
```

**Why this pattern?**

- **Components** only care about UI
- **Hooks** manage React state and lifecycle
- **Services** are pure functions—easy to test, no React dependency

### Supabase Query Examples

Services use the Supabase client to query the database:

```typescript
import { supabase } from "../lib/supabaseClient";

// SELECT * FROM accounts WHERE deleted_at IS NULL
const { data, error } = await supabase.from("accounts").select("*").is("deleted_at", null);

// SELECT with specific columns and filtering
const { data, error } = await supabase
  .from("transactions")
  .select("id, name, amount, date")
  .eq("account_id", accountId) // WHERE account_id = ?
  .gte("date", startDate) // WHERE date >= ?
  .order("date", { ascending: false }) // ORDER BY date DESC
  .limit(10); // LIMIT 10

// INSERT
const { data, error } = await supabase
  .from("transactions")
  .insert({ name: "Groceries", amount: -50.0, account_id: "..." })
  .select() // Return the inserted row
  .single(); // Return one object instead of array

// UPDATE
const { error } = await supabase
  .from("transactions")
  .update({ name: "Updated Name" })
  .eq("id", transactionId);

// Soft delete (set deleted_at instead of actually deleting)
const { error } = await supabase
  .from("accounts")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", accountId);
```

### 📄 `src/services/auth.ts`

**What it does:** Authentication logic

```typescript
// Sign up a new user
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

// Sign in existing user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
```

### 📄 `src/services/accounts.ts`

**What it does:** Bank account CRUD operations

- Create, read, update, delete accounts
- Fetches account data from Supabase

### 📄 `src/services/categories.ts`

**What it does:** Category/subcategory management

- CRUD operations for budget categories
- Handles category hierarchy

### 📄 `src/services/transactions.ts`

**What it does:** Transaction management

- CRUD operations for financial transactions
- Filtering, sorting, aggregation

### 📄 `src/services/goals.ts`

**What it does:** Saving/spending goal management

- Track progress toward financial goals
- Calculate goal completion percentages

### 📄 `src/services/dashboard.ts`

**What it does:** Dashboard data aggregation

- Combines data from multiple services
- Calculates summary statistics

### 📄 `src/services/charts.ts`

**What it does:** Chart data preparation

- Transforms raw data into chart-ready formats
- Used by visualization components

### 📄 `src/services/scoring.ts`

**What it does:** Financial health score calculation

- Analyzes spending patterns and account health
- Generates a score + recommendations

### 📄 `src/services/ai.ts`

**What it does:** AI feature orchestration

- Calls Vercel serverless functions for AI features
- Handles transaction categorization and chat

### 📄 `src/services/statements.ts`

**What it does:** Bank statement processing

- Uploads and parses statement files
- Extracts transactions

### 📄 `src/services/chat.ts`

**What it does:** AI chat functionality

- Manages chat sessions and messages
- Communicates with AI backend

---

## Part 6: Hooks (React State Management)

**Hooks** are React's way of managing state and side effects. They're like Python context managers or decorators that add functionality to components.

**Key hooks to know:**

- `useState` - Store a value that persists across renders
- `useEffect` - Run side effects (like fetching data)
- `useContext` - Access global state
- `useCallback` - Memoize a function to prevent re-creation
- `useMemo` - Memoize a computed value
- `useRef` - Store a mutable value that doesn't trigger re-renders

### Custom Hook Pattern

Custom hooks encapsulate reusable stateful logic. They always start with `use`:

```typescript
// Custom hook: useTransactions
// Encapsulates all transaction-related state and operations
function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (data: CreateTransactionData) => {
    const result = await createTransaction(data);
    if (result.success) {
      await loadTransactions(); // Refresh the list
    }
    return result;
  };

  // Return everything components need
  return {
    transactions,
    loading,
    error,
    refresh: loadTransactions,
    addTransaction,
  };
}

// Usage in a component:
function TransactionList() {
  const { transactions, loading, addTransaction } = useTransactions();
  // Component only deals with UI, not data fetching logic
}
```

### 📄 `src/hooks/useAuth.tsx`

**What it does:** Authentication state management

```typescript
// Provides authentication context to entire app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // ... signIn, signOut methods ...

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, ... }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth in any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

- Provides current user, login status
- Used by all components that need auth info
- Uses React Context (global state)

### 📄 `src/hooks/useAccounts.ts`

**What it does:** Account data fetching and caching

- Loads accounts from database
- Provides CRUD operations
- Manages loading/error states

### 📄 `src/hooks/useCategories.ts`

**What it does:** Category data management

- Similar pattern to useAccounts

### 📄 `src/hooks/useTransactions.ts`

**What it does:** Transaction data management

- Handles filtering, pagination
- Bulk operations

### 📄 `src/hooks/useGoals.ts`

**What it does:** Goal tracking

- Manages saving/spending goals

### 📄 `src/hooks/useDashboard.ts`

**What it does:** Dashboard data orchestration

- Combines data from multiple hooks

### 📄 `src/hooks/useAutoSave.ts`

**What it does:** Auto-save functionality

```typescript
// Debouncing: Wait until user stops typing before saving
function useAutoSave(data: FormData, onSave: (data: FormData) => void) {
  useEffect(() => {
    // Set a timer to save after 500ms of no changes
    const timer = setTimeout(() => {
      onSave(data);
    }, 500);

    // If data changes before 500ms, clear old timer and start new one
    return () => clearTimeout(timer);
  }, [data]); // Re-run whenever data changes
}
```

- Debounced saving (waits for user to stop typing)

### 📄 `src/hooks/useChatPanel.tsx`

**What it does:** Chat UI state management

- Controls chat panel visibility and state

---

## Part 7: UI Components (Reusable Building Blocks)

These are basic UI components you compose to build pages. They're styled with Tailwind CSS and designed to be reusable.

**Located in:** `src/components/ui/`

### Component Variants Pattern

Components use `class-variance-authority` (cva) to support multiple visual styles:

```typescript
import { cva } from 'class-variance-authority';

// Define all possible variants
const buttonVariants = cva(
  // Base classes applied to ALL buttons
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      // Variant: visual style
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        ghost: "hover:bg-gray-100",
      },
      // Size variant
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    // Default values
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Usage:
<Button variant="destructive" size="sm">Delete</Button>
<Button>Default Primary Medium</Button>
```

### 📄 `Button.tsx`

**What it does:** Reusable button component

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

function Button({ variant, size, isLoading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={isLoading}
      {...props}  // Spread remaining props (onClick, type, etc.)
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

- Variants: primary, secondary, ghost, destructive
- `...props` spread passes all standard button attributes through

### 📄 `Input.tsx`

**What it does:** Text input field

- Styled consistently with the design system
- Handles focus states, error states

### 📄 `Select.tsx`

**What it does:** Dropdown select menu

- Uses **Radix UI** for accessibility (keyboard navigation, screen readers)
- Radix provides unstyled, accessible primitives; we add Tailwind styles

### 📄 `Card.tsx`

**What it does:** Container component with shadow/border

```typescript
function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

// Usage:
<Card>
  <h2>Card Title</h2>
  <p>Card content...</p>
</Card>
```

- Used to group related content

### 📄 `Modal.tsx`

**What it does:** Modal dialog overlay

- Blocks interaction with page behind it
- Focus trap (keyboard stays inside modal)

### 📄 `dialog.tsx`

**What it does:** Dialog component from shadcn/ui

- Uses Radix UI primitives for accessibility
- Compound component pattern (Dialog, DialogTrigger, DialogContent, etc.)

### 📄 `tooltip.tsx`

**What it does:** Hover tooltips

- Uses Radix UI for accessibility

---

## Part 8: Feature Components (Complex Components)

These are larger components that combine multiple UI components and contain business logic.

**Located in:** `src/components/features/`

### 📄 `TransactionForm.tsx`

**What it does:** Form for adding/editing transactions

- Multiple input fields, validation
- Calls transaction service on submit

### 📄 `TransactionTable.tsx`

**What it does:** Displays transactions in a table

- Sorting, filtering, pagination
- Click to edit

### 📄 `MultiTransactionTable.tsx`

**What it does:** Table for bulk transaction management

- Select multiple rows, bulk edit

### 📄 `BulkEditModal.tsx`

**What it does:** Modal for editing multiple transactions at once

### 📄 `AccountForm.tsx` + `AccountSummary.tsx`

**What they do:** Account creation/editing and display

### 📄 `CategoryForm.tsx` + `CategorySummary.tsx` + `SubcategoryForm.tsx`

**What they do:** Category management components

### 📄 `SavingGoalForm.tsx` + `SpendingGoalForm.tsx`

**What they do:** Goal creation/editing forms

### 📄 `StatementParser.tsx`

**What it does:** UI for uploading and parsing bank statements

### 📄 `FinancialHealthScore.tsx`

**What it does:** Displays financial health score with breakdown

### 📄 `NetWorthChart.tsx`

**What it does:** Line chart showing net worth over time

- Uses Recharts library

### 📄 `SankeyDiagram.tsx`

**What it does:** Flow diagram showing money movement

- Uses Nivo library

### 📄 `RecentActivityPanel.tsx`

**What it does:** Shows recent transactions

### 📄 `ChatSidePanel.tsx` + `ChatSessionList.tsx`

**What they do:** AI chat interface components

### 📄 `ConfirmDeleteModal.tsx`

**What it does:** Confirmation dialog for destructive actions

### 📄 `AppLayout.tsx`

**What it does:** Layout wrapper for authenticated pages

- Includes navigation, header, sidebar

---

## Part 9: Pages (Top-Level Views)

Each page is a full screen view in your app. They combine feature components and hooks.

**Located in:** `src/pages/`

### 📄 `LandingPage.tsx`

**What it does:** Public homepage (marketing page)

- Shown to unauthenticated users
- Links to login/signup

### 📄 `LoginPage.tsx` + `SignUpPage.tsx`

**What they do:** Authentication pages

- Forms for user login and registration

### 📄 `SetupPage.tsx`

**What it does:** Initial setup wizard for new users

- Create first account, categories

### 📄 `DashboardPage.tsx`

**What it does:** Main dashboard (home screen)

- Shows financial overview, charts, recent activity

### 📄 `TransactionInputPage.tsx`

**What it does:** Manual transaction entry

- Form-based transaction creation

### 📄 `TransactionHistoryPage.tsx`

**What it does:** View all transactions

- Table with filtering and search

### 📄 `GoalsPage.tsx`

**What it does:** Manage financial goals

- Create, edit, track goals

### 📄 `SettingsPage.tsx`

**What it does:** App settings and preferences

- Account management, categories, export data

---

## Part 10: API (Serverless Functions)

These run on Vercel's servers (not in the browser). They're like Python Flask routes that handle AI requests.

**Located in:** `api/`

**Why serverless?**

- AI API keys must be kept secret. You can't put them in browser code or users could steal them.
- Serverless functions are short-lived processes that run on-demand (no server to manage)
- You pay only when they run, not for idle time

### How Serverless Functions Work

```typescript
// api/categorize.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

// This function handles POST /api/categorize
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse request body (like Flask's request.json)
  const { transaction, access_token } = req.body;

  // Access secret API key (stored in Vercel environment variables)
  const apiKey = process.env.GEMINI_API_KEY;

  // Call external AI API
  const result = await callGeminiAPI(transaction, apiKey);

  // Return JSON response
  return res.status(200).json(result);
}
```

**Frontend calls these like regular APIs:**

```typescript
// In src/services/ai.ts
const response = await fetch("/api/categorize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ transaction, access_token }),
});
const result = await response.json();
```

### 📄 `api/categorize.ts`

**What it does:** Categorizes a transaction using AI

- Receives transaction description and account name
- Fetches user's categories from Supabase
- Builds a prompt with context about their categories
- Calls Google Gemini API
- Returns suggested category with confidence score

### 📄 `api/chat.ts`

**What it does:** AI chatbot endpoint

- Receives user message + conversation history
- Fetches user's financial data for context
- Calls Gemini API with system prompt about being a financial advisor
- Returns AI response

### 📄 `api/parse-statement.ts`

**What it does:** Uses AI to parse bank statements

- Extracts transaction data from unstructured text
- Returns structured transaction array

**How they work:** Vercel automatically deploys functions in the `api/` folder as serverless endpoints. Your frontend calls them like: `fetch('/api/chat', { method: 'POST', body: ... })`

---

## Part 11: Database (Supabase Migrations)

SQL files that define your database schema. They run in order to set up your PostgreSQL database.

**Located in:** `supabase/migrations/`

### 📄 `20260108_initial_schema.sql`

**What it does:** Creates all database tables

- Tables: users, accounts, categories, transactions, goals, chat_sessions, chat_messages
- Defines columns, data types, relationships (foreign keys)
- In Python terms: Like SQLAlchemy model definitions, but in SQL

**Key concepts:**

- **Primary key:** Unique identifier for each row (usually `id`)
- **Foreign key:** References another table (e.g., `user_id` references `users.id`)
- **Indexes:** Speed up queries

### 📄 `20260108_rls_policies.sql`

**What it does:** Sets up Row-Level Security (RLS)

- RLS ensures users can only access their own data
- Like adding `WHERE user_id = current_user` to every query automatically
- Security layer in the database itself

### 📄 `20260108_seed_data.sql`

**What it does:** Inserts default data

- Pre-populates default categories for new users
- Like Django fixtures or Flask-Migrate seed data

**Migration workflow:**

1. Write SQL file in `supabase/migrations/`
2. Run migration via Supabase CLI or dashboard
3. Schema changes are applied to database

---

## Part 12: Documentation & Guides

### 📄 `README.md`

**What it does:** Project overview and quick start

- First file visitors see on GitHub

### 📄 `CLAUDE.md`

**What it does:** Instructions for AI coding assistants

- TypeScript import rules
- Code conventions

### 📄 `docs/README.md`

**What it does:** Comprehensive project documentation

### 📄 `docs/SUPABASE_SETUP.md`

**What it does:** Step-by-step database setup

### 📄 `docs/verify-setup.md`

**What it does:** Checklist to verify setup is correct

### 📄 `plan.md`

**What it does:** Development roadmap

- All planned features and phases

### 📄 `progress.md`

**What it does:** Current project status

- What's done, what's next

### 📄 `scratchpad.md`

**What it does:** Working notes and todos

### 📄 `prompts/*.md`

**What they do:** Guidelines for AI agents

- `begin-phase.md` - Starting new work phases
- `logging-guide.md` - Python logging standards
- `session-guide.md` - Progress tracking protocol
- `plan-gen.md` - Plan generation guide

---

## Part 13: Development Tooling

### 📄 `.vscode/settings.json`

**What it does:** VS Code workspace settings

- Auto-format on save, TypeScript settings

### 📄 `.claude/settings.local.json`

**What it does:** Claude Code CLI settings

- Configuration for the AI assistant you're using right now!

---

## Key Concepts for Python Developers

This section bridges your Python knowledge to React/TypeScript patterns used throughout this codebase.

### React vs. Flask/Django: Fundamental Difference

**Flask/Django (Server-Side Rendering):**

```
1. User requests /dashboard
2. Server runs Python code
3. Server generates HTML string
4. Server sends HTML to browser
5. Browser displays static HTML
6. User clicks button → Go to step 1 (full page reload)
```

**React (Client-Side Rendering):**

```
1. User requests any URL
2. Server sends the same index.html + JavaScript bundle
3. Browser runs JavaScript
4. JavaScript generates HTML and injects it into page
5. User clicks button → JavaScript updates HTML (no reload!)
```

React apps feel faster because only data is fetched after the initial load—the page never fully reloads.

### Components: Functions That Return UI

React components are JavaScript functions that return JSX (HTML-like syntax):

```typescript
// A simple component
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

// Using the component
<Greeting name="Alice" />

// Python mental model:
# def greeting(name: str) -> str:
#     return f"<h1>Hello, {name}!</h1>"
```

**Key difference:** React components are called by React, not by you. You describe _what_ you want, React figures out _when_ to render it.

### JSX: HTML in JavaScript

JSX looks like HTML but has differences:

```typescript
// JSX
<div className="container">           {/* className, not class */}
  <label htmlFor="email">Email</label> {/* htmlFor, not for */}
  <input type="email" id="email" />    {/* Self-closing tags required */}
  {user.name}                          {/* JavaScript expressions in braces */}
  {isAdmin && <AdminPanel />}          {/* Conditional rendering */}
  <button onClick={handleClick}>       {/* camelCase events */}
    Click me
  </button>
</div>

// This compiles to:
React.createElement('div', { className: 'container' },
  React.createElement('label', { htmlFor: 'email' }, 'Email'),
  // ... etc
);
```

### Props: Function Parameters for Components

Props are how you pass data to components:

```typescript
// Defining props with TypeScript interface
interface ButtonProps {
  label: string;
  onClick: () => void;    // Function that takes nothing, returns nothing
  variant?: 'primary' | 'secondary';  // Optional prop (note the ?)
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={variant} onClick={onClick}>
      {label}
    </button>
  );
}

// Using the component
<Button label="Submit" onClick={() => console.log('clicked')} />
<Button label="Cancel" onClick={handleCancel} variant="secondary" />
```

### The `children` Prop: Nested Content

Components can wrap other content using the special `children` prop:

```typescript
// Defining a wrapper component
interface CardProps {
  title: string;
  children: ReactNode;  // ReactNode = any valid JSX
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">
        {children}   {/* Whatever is nested inside <Card> appears here */}
      </div>
    </div>
  );
}

// Using it - the <p> and <Button> become "children"
<Card title="Settings">
  <p>Update your preferences below.</p>
  <Button label="Save" onClick={handleSave} />
</Card>
```

This pattern is used extensively for layouts, modals, and context providers.

### State: Data That Triggers Re-renders

**Critical concept:** When state changes, React re-runs your component function and updates the DOM.

```typescript
function Counter() {
  // useState returns [currentValue, setterFunction]
  const [count, setCount] = useState(0);

  // This ENTIRE function runs again when setCount is called!
  console.log('Rendering with count:', count);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

// Click sequence:
// 1. Initial render: "Rendering with count: 0"
// 2. Click button → setCount(1) called
// 3. React re-runs Counter() → "Rendering with count: 1"
// 4. React updates only the changed parts of the DOM
```

**Why not just use regular variables?**

```typescript
function BrokenCounter() {
  let count = 0;  // This resets to 0 on every render!

  return (
    <button onClick={() => count++}>  {/* This does nothing visible */}
      Count: {count}
    </button>
  );
}
```

### useEffect: Side Effects and Lifecycle

`useEffect` runs code _after_ React renders. Use it for:

- Fetching data
- Setting up subscriptions
- Updating document title
- Any "side effect" outside React's control

```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  // useEffect(callback, dependencyArray)
  useEffect(() => {
    // This runs AFTER the component renders
    async function loadUser() {
      const data = await fetchUser(userId);
      setUser(data);
    }
    loadUser();
  }, [userId]);  // <-- Dependency array is CRITICAL

  return <div>{user?.name ?? 'Loading...'}</div>;
}
```

**The Dependency Array (source of many bugs!):**

```typescript
// Empty array [] = Run once when component first appears ("mounts")
useEffect(() => {
  console.log("Component mounted");
}, []);

// [userId] = Run when component mounts AND when userId changes
useEffect(() => {
  loadUser(userId);
}, [userId]);

// [userId, accountId] = Run when either changes
useEffect(() => {
  loadData(userId, accountId);
}, [userId, accountId]);

// NO array = Run on EVERY render (usually a bug!)
useEffect(() => {
  console.log("This runs constantly!"); // Probably not what you want
});
```

**Common mistake:**

```typescript
// BUG: fetchUser uses userId but userId not in dependencies
useEffect(() => {
  fetchUser(userId); // Uses stale userId if it changes!
}, []); // Should be [userId]
```

### Context: Global State Without Prop Drilling

Context solves the problem of passing props through many layers:

```typescript
// Without context (prop drilling nightmare):
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />  {/* Finally uses it! */}
    </Sidebar>
  </Layout>
</App>

// With context:
// 1. Create context
const UserContext = createContext<User | null>(null);

// 2. Provide value at top level
function App() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={user}>
      <Layout />  {/* No need to pass user prop */}
    </UserContext.Provider>
  );
}

// 3. Consume anywhere in the tree
function UserMenu() {
  const user = useContext(UserContext);  // Gets value from nearest Provider
  return <span>{user?.name}</span>;
}
```

This codebase wraps `useContext` in custom hooks like `useAuth()` for cleaner code.

### Event Handling

React uses camelCase event names and passes functions (not strings):

```typescript
function Form() {
  const [email, setEmail] = useState('');

  // Event handler function
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();  // Stop form from reloading page
    console.log('Submitting:', email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}  {/* e.target.value = input's text */}
      />
      <button type="submit">Submit</button>
    </form>
  );
}

// Common events:
// onClick - click
// onChange - input value changes
// onSubmit - form submission
// onFocus / onBlur - focus gained/lost
// onKeyDown / onKeyUp - keyboard
```

### Hooks: Rules You Must Follow

Hooks (`useState`, `useEffect`, custom hooks like `useAuth`) have strict rules:

```typescript
// ✅ CORRECT: Hooks at top level
function MyComponent() {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => { ... }, []);

  return <div>{count}</div>;
}

// ❌ WRONG: Hook inside condition
function MyComponent({ showCount }) {
  if (showCount) {
    const [count, setCount] = useState(0);  // BREAKS!
  }
}

// ❌ WRONG: Hook inside loop
function MyComponent({ items }) {
  for (const item of items) {
    const [selected, setSelected] = useState(false);  // BREAKS!
  }
}

// ❌ WRONG: Hook in nested function
function MyComponent() {
  const handleClick = () => {
    const [count, setCount] = useState(0);  // BREAKS!
  };
}
```

React relies on hooks being called in the same order every render. Breaking this rule causes cryptic bugs.

### forwardRef: Exposing DOM Elements

Sometimes parent components need direct access to a DOM element (for focusing, scrolling, etc.):

```typescript
// Without forwardRef, ref doesn't work on custom components
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Parent can now do this:
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();  // Access the actual <input> DOM element
  };

  return <Input ref={inputRef} />;
}
```

### CSS with Tailwind: Utility Classes

Instead of writing CSS files, Tailwind uses utility classes:

```typescript
// Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">

// What each class does:
// flex          → display: flex
// items-center  → align-items: center
// gap-4         → gap: 1rem (16px)
// p-4           → padding: 1rem
// bg-gray-900   → background-color: rgb(17, 24, 39)
// rounded-lg    → border-radius: 0.5rem

// Responsive prefixes (mobile-first)
<div className="w-full md:w-1/2 lg:w-1/3">
// w-full on mobile, w-1/2 on medium screens, w-1/3 on large screens

// State variants
<button className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
// Blue background, darker on hover, faded when disabled
```

The `cn()` utility function merges classes and handles conflicts:

```typescript
import { cn } from "@/lib/utils";

// Merge classes, later ones override earlier ones
cn("bg-red-500", "bg-blue-500"); // Result: 'bg-blue-500'
cn("p-4", isLarge && "p-8"); // Conditional classes
```

### Common Patterns in This Codebase

**Service + Hook pattern:**

```typescript
// Service: Pure functions that talk to database (src/services/*)
async function getTransactions(filters: Filters): Promise<Transaction[]> {
  const { data, error } = await supabase.from('transactions').select('*');
  if (error) throw error;
  return data;
}

// Hook: Connects service to React state (src/hooks/*)
function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions({}).then(setTransactions).finally(() => setLoading(false));
  }, []);

  return { transactions, loading };
}

// Component: Uses hook, doesn't know about database
function TransactionList() {
  const { transactions, loading } = useTransactions();
  if (loading) return <Spinner />;
  return <ul>{transactions.map(t => <li key={t.id}>{t.name}</li>)}</ul>;
}
```

**Result object pattern (like Rust's Result):**

```typescript
// Services return { success, data?, error? } instead of throwing
async function createTransaction(data: CreateData): Promise<{
  success: boolean;
  data?: Transaction;
  error?: string;
}> {
  try {
    const transaction = await insert(data);
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Caller checks success
const result = await createTransaction(formData);
if (result.success) {
  toast.success("Created!");
  navigate("/transactions");
} else {
  toast.error(result.error);
}
```

### Key Differences Summary

| Python              | TypeScript/React                                |
| ------------------- | ----------------------------------------------- |
| `def func():`       | `function func() {}` or `const func = () => {}` |
| `f"Hello {name}"`   | `` `Hello ${name}` ``                           |
| `dict(a=1, b=2)`    | `{ a: 1, b: 2 }`                                |
| `{**d1, **d2}`      | `{ ...d1, ...d2 }`                              |
| `[*l1, *l2]`        | `[...l1, ...l2]`                                |
| `x if cond else y`  | `cond ? x : y`                                  |
| `None`              | `null` or `undefined`                           |
| `Optional[User]`    | `User \| null`                                  |
| `List[User]`        | `User[]`                                        |
| `async def / await` | `async function / await`                        |
| `from x import y`   | `import { y } from 'x'`                         |
| Class decorators    | Higher-order components / Hooks                 |
| `@dataclass`        | `interface` or `type`                           |

---

## Suggested Reading Order

1. **Part 0: JavaScript/TypeScript Fundamentals** (essential syntax)
2. **Config files** (understand the tooling)
3. **index.html → main.tsx → App.tsx → Router.tsx** (follow the app startup)
4. **types/index.ts** (learn the data structures)
5. **lib/supabaseClient.ts** (understand database connection)
6. **services/\*.ts** (business logic layer)
7. **hooks/\*.ts** (state management patterns)
8. **components/ui/\*.tsx** (basic UI building blocks)
9. **components/features/\*.tsx** (complex feature components)
10. **pages/\*.tsx** (full page views)
11. **api/\*.ts** (serverless AI functions)
12. **supabase/migrations/\*.sql** (database schema)

---

## Glossary

Quick reference for terms used throughout the codebase:

| Term            | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| **SPA**         | Single Page Application - one HTML page, JavaScript handles navigation |
| **Component**   | A function that returns JSX (UI description)                           |
| **JSX**         | HTML-like syntax in JavaScript that describes UI                       |
| **Props**       | Input data passed to a component                                       |
| **State**       | Data that, when changed, causes a re-render                            |
| **Hook**        | Function starting with `use` that adds features to components          |
| **Context**     | Way to share data without passing props through every level            |
| **Render**      | React running your component function and updating the DOM             |
| **Mount**       | Component appearing in the DOM for the first time                      |
| **Unmount**     | Component being removed from the DOM                                   |
| **Side Effect** | Anything outside React (API calls, timers, DOM manipulation)           |
| **Callback**    | A function passed to another function to be called later               |
| **Promise**     | Object representing a future value (like Python's Future)              |
| **DOM**         | Document Object Model - the browser's tree of HTML elements            |
| **Bundle**      | All JavaScript combined into one or few files for production           |
| **SSR**         | Server-Side Rendering - rendering React on server (not used here)      |
| **RLS**         | Row-Level Security - database restricts rows based on user             |

---

Take your time with each file. React has a learning curve, but the patterns repeat throughout the codebase. Once you understand the fundamentals in Part 0 and the React concepts in "Key Concepts for Python Developers," the rest will make sense. Good luck!

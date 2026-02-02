// TypeScript types and interfaces for the application

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export type AccountType = "asset" | "liability";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Subcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  monthly_goal: number | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  name: string;
  amount: number;
  subcategory_id: string | null;
  comment: string | null;
  is_initial_balance: boolean;
  ai_suggested: boolean;
  user_corrected: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type GoalPeriod = "weekly" | "monthly" | "quarterly" | "annual";

export interface SpendingGoal {
  id: string;
  user_id: string;
  subcategory_id: string;
  amount: number;
  period: GoalPeriod;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | null;
  target_date: string | null;
  current_amount: number;
  account_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  completed_at: string | null;
}

export interface AICorrection {
  id: string;
  user_id: string;
  transaction_name: string;
  account_id: string;
  ai_suggested_subcategory_id: string | null;
  user_corrected_subcategory_id: string;
  created_at: string;
}

export type AIPersonality = "professional" | "friendly" | "stern";

export interface UserPreferences {
  id: string;
  user_id: string;
  ai_personality: AIPersonality;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  function_calls: object | null;
  created_at: string;
}

// App configuration constants (not secrets)
export const APP_NAME = "AI Budget App";
export const APP_VERSION = "0.1.0";

// Date formats
export const DATE_FORMAT = "yyyy-MM-dd";
export const DISPLAY_DATE_FORMAT = "MMM d, yyyy";

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// Transaction defaults
export const DEFAULT_DATE_RANGE_DAYS = 90;

// System Categories (UUIDs from seed data)
// These are read-only categories available to all users
export const SYSTEM_CATEGORIES = {
  INCOME_UNASSIGNED: "00000000-0000-0000-0000-000000000001",
  EXPENSE_UNASSIGNED: "00000000-0000-0000-0000-000000000002",
} as const;

// System Subcategories (UUIDs from seed data)
// These are read-only subcategories available to all users
export const SYSTEM_SUBCATEGORIES = {
  INCOME_UNASSIGNED: "00000000-0000-0000-0000-000000000003",
  EXPENSE_UNASSIGNED: "00000000-0000-0000-0000-000000000004",
} as const;

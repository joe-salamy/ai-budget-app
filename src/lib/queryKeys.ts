import type { TransactionFilters } from "../services/transactions";

// Centralized query key factory for type safety
export const queryKeys = {
  accounts: {
    all: ["accounts"] as const,
    list: () => [...queryKeys.accounts.all, "list"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    subcategories: {
      all: ["subcategories"] as const,
      list: () => [...queryKeys.categories.subcategories.all, "list"] as const,
    },
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters?: TransactionFilters) =>
      [...queryKeys.transactions.all, "list", filters] as const,
    recentActivity: () => [...queryKeys.transactions.all, "recent-activity"] as const,
  },
  goals: {
    spending: {
      all: ["spending-goals"] as const,
      list: () => [...queryKeys.goals.spending.all, "list"] as const,
    },
  },
  dashboard: {
    all: ["dashboard"] as const,
    accountSummary: (startDate: string, endDate: string) =>
      [...queryKeys.dashboard.all, "account-summary", startDate, endDate] as const,
    categorySummary: (startDate: string, endDate: string) =>
      [...queryKeys.dashboard.all, "category-summary", startDate, endDate] as const,
    metrics: (startDate: string, endDate: string) =>
      [...queryKeys.dashboard.all, "metrics", startDate, endDate] as const,
    charts: {
      netWorth: (startDate: string, endDate: string) =>
        [...queryKeys.dashboard.all, "charts", "net-worth", startDate, endDate] as const,
      sankey: (startDate: string, endDate: string) =>
        [...queryKeys.dashboard.all, "charts", "sankey", startDate, endDate] as const,
    },
  },
} as const;

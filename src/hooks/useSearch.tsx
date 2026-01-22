import { useState, useEffect, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { DollarSign, Target } from "lucide-react";
import { getTransactionsWithDetails } from "@/services/transactions";
import { getSavingGoalsWithDetails } from "@/services/goals";

// ============== TYPES ==============

export interface SearchResult {
  id: string;
  type: "transaction" | "goal";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path: string;
}

// ============== HOOK ==============

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce query - update debounced value after 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      // Clear results if query is empty
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const searchResults: SearchResult[] = [];

        // Search transactions
        const transactionsResponse = await getTransactionsWithDetails({
          searchQuery: debouncedQuery,
          limit: 5,
        });

        if (transactionsResponse.success && transactionsResponse.data) {
          const transactionResults = transactionsResponse.data.map((txn) => ({
            id: txn.id,
            type: "transaction" as const,
            title: txn.name,
            subtitle: `${txn.account_name || "Unknown"} • $${Math.abs(txn.amount).toFixed(2)} • ${new Date(txn.date).toLocaleDateString()}`,
            icon: DollarSign,
            path: "/transactions/history",
          }));
          searchResults.push(...transactionResults);
        }

        // Search saving goals
        const goalsResponse = await getSavingGoalsWithDetails();

        if (goalsResponse.success && goalsResponse.data) {
          const filteredGoals = goalsResponse.data
            .filter((goal) => goal.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
            .slice(0, 5);

          const goalResults = filteredGoals.map((goal) => {
            const targetAmount = goal.target_amount
              ? `Target: $${goal.target_amount.toFixed(2)}`
              : "No target";
            const currentAmount = `Current: $${(goal.current_amount || 0).toFixed(2)}`;

            return {
              id: goal.id,
              type: "goal" as const,
              title: goal.name,
              subtitle: `${targetAmount} • ${currentAmount}`,
              icon: Target,
              path: "/goals",
            };
          });
          searchResults.push(...goalResults);
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
}

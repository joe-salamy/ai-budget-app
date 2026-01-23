import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - budget data doesn't change frequently
      gcTime: 10 * 60 * 1000, // 10 min - keep cached data longer
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Retry failed requests once
      refetchOnMount: "stale", // Only refetch if data is stale
      refetchOnReconnect: "stale", // Only refetch on reconnect if stale
      enabled: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

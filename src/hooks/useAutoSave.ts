// useAutoSave hook - Debounced auto-save utility
import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds (default: 1000)
  onSave: () => void | Promise<void>; // Save function to call
  dependencies: unknown[]; // Values to watch for changes
  enabled?: boolean; // Whether auto-save is enabled (default: true)
}

/**
 * Auto-save hook with debouncing
 *
 * Usage:
 * ```tsx
 * useAutoSave({
 *   delay: 1000,
 *   onSave: async () => {
 *     await saveAccount(accountData);
 *   },
 *   dependencies: [accountData.name, accountData.type],
 *   enabled: accountData.name.length > 0
 * });
 * ```
 */
export function useAutoSave({
  delay = 1000,
  onSave,
  dependencies,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  // Memoize the save callback to prevent unnecessary re-runs
  const saveCallback = useCallback(onSave, [onSave]);

  useEffect(() => {
    // Skip on first render (don't save initial values)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveCallback();
    }, delay);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [...dependencies, delay, enabled, saveCallback]);
}

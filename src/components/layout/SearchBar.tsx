import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const navigate = useNavigate();
  const { query, setQuery, results, isSearching, clearSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show dropdown when there are results or searching
  useEffect(() => {
    setIsOpen((results.length > 0 || isSearching) && query.length > 0);
  }, [results, isSearching, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: { id: string; path: string }) => {
    navigate(result.path);
    clearSearch();
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Group results by type
  const transactionResults = results.filter((r) => r.type === "transaction");
  const goalResults = results.filter((r) => r.type === "goal");

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search transactions, goals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || isSearching) {
              setIsOpen(true);
            }
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-10 text-sm text-white placeholder-white/50 backdrop-blur-sm focus:border-foreground/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={
            selectedIndex >= 0 ? `search-result-${results[selectedIndex]?.id}` : undefined
          }
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-foreground" />
        )}
        {query && !isSearching && (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            id="search-results"
            role="listbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-2xl backdrop-blur-xl"
          >
            <div className="max-h-96 overflow-y-auto p-2">
              {/* No results */}
              {!isSearching && results.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {/* Transaction results */}
              {transactionResults.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Transactions
                  </div>
                  {transactionResults.map((result) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        id={`search-result-${result.id}`}
                        role="option"
                        aria-selected={selectedIndex === globalIndex}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left border border-transparent hover:border-white/20",
                          selectedIndex === globalIndex
                            ? "bg-foreground/20 text-white"
                            : "text-foreground hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{result.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Goal results */}
              {goalResults.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Goals
                  </div>
                  {goalResults.map((result) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        id={`search-result-${result.id}`}
                        role="option"
                        aria-selected={selectedIndex === globalIndex}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left border border-transparent hover:border-white/20",
                          selectedIndex === globalIndex
                            ? "bg-foreground/20 text-white"
                            : "text-foreground hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{result.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results count for screen readers */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Bot } from "lucide-react";
import { ChatSidePanel } from "./features/ChatSidePanel";
import { useChatPanel } from "@/hooks/useChatPanel";

function AppLayout() {
  const { isOpen, togglePanel, closePanel, panelWidth } = useChatPanel();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K to toggle panel
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        togglePanel();
      }

      // Escape to close panel
      if (e.key === "Escape" && isOpen) {
        closePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, togglePanel, closePanel]);

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-foreground">AI Budget App</h1>
            <nav className="flex gap-4">
              <a
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/setup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Setup
              </a>
              <a
                href="/transactions/input"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Add Transactions
              </a>
              <a
                href="/transactions/history"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </a>
              <a
                href="/goals"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Goals
              </a>
              <a
                href="/settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </a>
            </nav>
          </div>

          {/* AI Chat Toggle Button */}
          <button
            onClick={togglePanel}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isOpen
                ? "bg-blue-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            aria-label="Toggle AI Assistant (Ctrl+K)"
            title="Toggle AI Assistant (Ctrl+K)"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </button>
        </div>
      </header>

      {/* Main Content - adjusts width when panel is open */}
      <main
        className="container mx-auto p-4 transition-all duration-200"
        style={{
          marginRight: isOpen ? `${panelWidth}px` : undefined,
        }}
      >
        <Outlet />
      </main>

      {/* Chat Side Panel */}
      <ChatSidePanel />
    </div>
  );
}

export default AppLayout;

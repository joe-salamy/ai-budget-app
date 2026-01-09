import { Outlet } from "react-router-dom";
import { Bot } from "lucide-react";

function AppLayout() {
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
                href="/settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </a>
            </nav>
          </div>

          {/* AI Chat Toggle Button */}
          <button
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label="Toggle AI Assistant"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;

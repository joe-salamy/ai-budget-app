import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ChatSidePanel } from "./features/ChatSidePanel";
import { useChatPanel } from "@/hooks/useChatPanel";
import { Navbar } from "./layout/Navbar";

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
      <Navbar />

      {/* Main Content - adjusts width when panel is open */}
      <main
        className="container mx-auto p-4"
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

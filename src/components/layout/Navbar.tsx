import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  DollarSign,
  History,
  Wrench,
  Bot,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatPanel } from "@/hooks/useChatPanel";
import { UserProfileMenu } from "./UserProfileMenu";
import { MobileMenu } from "./MobileMenu";

// ============== TYPES ==============

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

// ============== CONSTANTS ==============

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/setup", label: "Setup", icon: Wrench },
  { path: "/transactions/input", label: "Add Transactions", icon: DollarSign },
  { path: "/transactions/history", label: "History", icon: History },
];

// ============== COMPONENT ==============

export function Navbar() {
  const location = useLocation();
  const { isOpen: chatPanelOpen, togglePanel } = useChatPanel();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-6">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h1 className="whitespace-nowrap text-2xl font-bold text-foreground">
              AI Budget App
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden flex-1 justify-center gap-2 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground border-transparent hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side: AI Assistant, User Profile */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={togglePanel}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                chatPanelOpen
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground hover:bg-muted border-border"
              )}
              aria-label="Toggle AI Assistant (Ctrl+K)"
              title="Toggle AI Assistant (Ctrl+K)"
              aria-pressed={chatPanelOpen}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* User Profile Menu */}
            <UserProfileMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-2 text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

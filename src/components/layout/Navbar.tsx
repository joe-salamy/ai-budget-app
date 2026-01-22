import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  DollarSign,
  History,
  Target,
  Wrench,
  Bot,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChatPanel } from "@/hooks/useChatPanel";
import { SearchBar } from "./SearchBar";
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
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/settings", label: "Settings", icon: Settings },
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
      <header className="border-b border-border/50 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 shadow-2xl shadow-blue-900/50 backdrop-blur-lg">
        <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-6">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900 rounded-md"
          >
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              AI Budget App
            </motion.h1>
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
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                    active
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 animate-neon"
                      : "text-white/80 hover:bg-white/10 hover:text-white hover:scale-105"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Search, AI Assistant, User Profile */}
          <div className="flex items-center gap-3">
            {/* Search Bar (Desktop Only) */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* AI Assistant Button */}
            <motion.button
              onClick={togglePanel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                chatPanelOpen
                  ? "bg-blue-600 text-white shadow-blue-500/50 animate-neon"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-purple-500/50"
              )}
              aria-label="Toggle AI Assistant (Ctrl+K)"
              title="Toggle AI Assistant (Ctrl+K)"
              aria-pressed={chatPanelOpen}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </motion.button>

            {/* User Profile Menu */}
            <UserProfileMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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

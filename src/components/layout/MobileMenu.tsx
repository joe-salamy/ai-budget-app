import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Settings, DollarSign, History, Target, Wrench, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============== TYPES ==============

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap - focus first link when menu opens
  useEffect(() => {
    if (isOpen) {
      const firstLink = document.querySelector<HTMLAnchorElement>('[data-mobile-menu-link]');
      firstLink?.focus();
    }
  }, [isOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-bold text-foreground">
                AI Budget App
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-foreground/70 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    data-mobile-menu-link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-base font-medium border",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground border-transparent hover:border-border"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-background" : "text-foreground/70"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
              <p className="text-center text-xs text-muted-foreground">
                Press <kbd className="rounded bg-muted px-1.5 py-0.5">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

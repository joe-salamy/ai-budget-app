// Hook for managing the chat panel state
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { ChatSession, ChatMessage } from "@/types";
import * as chatService from "@/services/chat";
import { useLocation } from "react-router-dom";

// ============== TYPES ==============

interface ChatPanelContextType {
  // Panel state
  isOpen: boolean;
  panelWidth: number;

  // Session state
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];

  // Loading states
  sessionsLoading: boolean;
  messagesLoading: boolean;
  sendingMessage: boolean;

  // Error state
  error: string | null;

  // Actions
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setPanelWidth: (width: number) => void;

  // Session actions
  loadSessions: () => Promise<void>;
  selectSession: (session: ChatSession) => Promise<void>;
  createNewSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;

  // Message actions
  sendMessage: (message: string) => Promise<void>;

  // Quick actions
  insertQuickAction: (prompt: string) => void;
  pendingQuickAction: string | null;
  clearPendingQuickAction: () => void;

  // Clear error
  clearError: () => void;
}

const ChatPanelContext = createContext<ChatPanelContextType | undefined>(undefined);

// ============== STORAGE KEYS ==============

const STORAGE_KEYS = {
  IS_OPEN: "chat_panel_open",
  WIDTH: "chat_panel_width",
  CURRENT_SESSION: "chat_current_session",
};

const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;

// ============== PROVIDER ==============

interface ChatPanelProviderProps {
  children: ReactNode;
}

export function ChatPanelProvider({ children }: ChatPanelProviderProps) {
  const location = useLocation();

  // Panel state
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.IS_OPEN);
    return stored === "true";
  });

  const [panelWidth, setPanelWidthState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WIDTH);
    const width = stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
  });

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Loading states
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Quick action state
  const [pendingQuickAction, setPendingQuickAction] = useState<string | null>(null);

  // Persist panel open state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_OPEN, String(isOpen));
  }, [isOpen]);

  // Persist panel width
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WIDTH, String(panelWidth));
  }, [panelWidth]);

  // Load sessions when panel opens
  useEffect(() => {
    if (isOpen && sessions.length === 0 && !sessionsLoading) {
      loadSessions();
    }
  }, [isOpen]);

  // Get current page name for context
  const getCurrentPageName = useCallback(() => {
    const path = location.pathname;
    const pageNames: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/setup": "Setup Wizard",
      "/transactions/input": "Add Transactions",
      "/transactions/history": "Transaction History",
      "/settings": "Settings",
    };
    return pageNames[path] || "Unknown Page";
  }, [location.pathname]);

  // ============== PANEL ACTIONS ==============

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setPanelWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    setPanelWidthState(clampedWidth);
  }, []);

  // ============== SESSION ACTIONS ==============

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setError(null);

    try {
      const response = await chatService.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);

        // If no current session but sessions exist, select the most recent
        if (!currentSession && response.data.length > 0) {
          const mostRecent = response.data[0];
          setCurrentSession(mostRecent);

          // Load messages for this session
          const messagesResponse = await chatService.getSessionMessages(mostRecent.id);
          if (messagesResponse.success && messagesResponse.data) {
            setMessages(messagesResponse.data);
          }
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, [currentSession]);

  const selectSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session);
    setMessagesLoading(true);
    setError(null);

    try {
      const response = await chatService.getSessionMessages(session.id);
      if (response.success && response.data) {
        setMessages(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const createNewSession = useCallback(async () => {
    setError(null);

    // Clear current session and messages to start fresh
    setCurrentSession(null);
    setMessages([]);
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      setError(null);

      try {
        const response = await chatService.deleteSession(sessionId);
        if (response.success) {
          // Remove from local state
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));

          // If this was the current session, clear it
          if (currentSession?.id === sessionId) {
            setCurrentSession(null);
            setMessages([]);
          }
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete session");
      }
    },
    [currentSession]
  );

  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      setError(null);

      try {
        const response = await chatService.renameSession(sessionId, newTitle);
        if (response.success && response.data) {
          // Update local state
          setSessions((prev) => prev.map((s) => (s.id === sessionId ? response.data! : s)));

          // Update current session if it's the one being renamed
          if (currentSession?.id === sessionId) {
            setCurrentSession(response.data);
          }
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename session");
      }
    },
    [currentSession]
  );

  // ============== MESSAGE ACTIONS ==============

  const sendMessage = useCallback(
    async (message: string) => {
      setSendingMessage(true);
      setError(null);

      // Optimistically add user message to UI
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: currentSession?.id || "",
        user_id: "",
        role: "user",
        content: message,
        function_calls: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        const currentPage = getCurrentPageName();
        const response = await chatService.sendMessage(message, currentSession?.id, currentPage);

        if (response.success && response.data) {
          // If this created a new session, update state
          if (!currentSession || currentSession.id !== response.data.session_id) {
            const newSession: ChatSession = {
              id: response.data.session_id,
              user_id: "",
              title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_message_at: new Date().toISOString(),
            };
            setCurrentSession(newSession);
            setSessions((prev) => [newSession, ...prev]);
          }

          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            session_id: response.data.session_id,
            user_id: "",
            role: "assistant",
            content: response.data.message,
            function_calls: response.data.function_calls || null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else if (response.error) {
          setError(response.error);
          // Remove the optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        // Remove the optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      } finally {
        setSendingMessage(false);
      }
    },
    [currentSession, getCurrentPageName]
  );

  // ============== QUICK ACTIONS ==============

  const insertQuickAction = useCallback(
    (prompt: string) => {
      setPendingQuickAction(prompt);
      openPanel();
    },
    [openPanel]
  );

  const clearPendingQuickAction = useCallback(() => {
    setPendingQuickAction(null);
  }, []);

  // ============== UTILITY ==============

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ChatPanelContextType = {
    isOpen,
    panelWidth,
    sessions,
    currentSession,
    messages,
    sessionsLoading,
    messagesLoading,
    sendingMessage,
    error,
    togglePanel,
    openPanel,
    closePanel,
    setPanelWidth,
    loadSessions,
    selectSession,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    insertQuickAction,
    pendingQuickAction,
    clearPendingQuickAction,
    clearError,
  };

  return <ChatPanelContext.Provider value={value}>{children}</ChatPanelContext.Provider>;
}

// ============== HOOK ==============

export function useChatPanel(): ChatPanelContextType {
  const context = useContext(ChatPanelContext);

  if (context === undefined) {
    throw new Error("useChatPanel must be used within a ChatPanelProvider");
  }

  return context;
}

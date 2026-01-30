// AI Chat Side Panel Component
// A VS Code-style resizable side panel for AI assistant chat

import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import {
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Receipt,
  PiggyBank,
  Target,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatSessionList } from "./ChatSessionList";
import { useChatPanel } from "@/hooks/useChatPanel";

// ============== QUICK ACTIONS ==============

const QUICK_ACTIONS = [
  {
    icon: Receipt,
    label: "Categorize",
    prompt: "Help me categorize my recent transactions",
  },
  {
    icon: PlusCircle,
    label: "Add Transaction",
    prompt: "I want to add a new transaction",
  },
  {
    icon: PiggyBank,
    label: "Review Spending",
    prompt: "Give me a summary of my spending this month",
  },
  {
    icon: Target,
    label: "Set Goal",
    prompt: "Help me set a spending goal",
  },
];

// ============== MAIN COMPONENT ==============

export function ChatSidePanel() {
  const {
    isOpen,
    panelWidth,
    sessions,
    currentSession,
    messages,
    sessionsLoading,
    messagesLoading,
    sendingMessage,
    error,
    closePanel,
    setPanelWidth,
    selectSession,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    pendingQuickAction,
    clearPendingQuickAction,
    clearError,
  } = useChatPanel();

  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle pending quick action
  useEffect(() => {
    if (pendingQuickAction) {
      setInputValue(pendingQuickAction);
      clearPendingQuickAction();
      textareaRef.current?.focus();
    }
  }, [pendingQuickAction, clearPendingQuickAction]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setPanelWidth]);

  // Handle form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !sendingMessage) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  // Handle keyboard shortcuts in textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  // Copy message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closePanel} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full bg-background border-l border-border z-50 flex flex-col shadow-2xl"
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize handle */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-foreground ${
            isResizing ? "bg-foreground" : "bg-transparent"
          }`}
          onMouseDown={handleResizeStart}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-white">AI Assistant</span>
            </div>
            <ChatSessionList
              sessions={sessions}
              currentSession={currentSession}
              loading={sessionsLoading}
              onSelectSession={selectSession}
              onCreateSession={createNewSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
            />
          </div>
          <button
            onClick={closePanel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-muted"
            title="Close panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50 overflow-x-auto">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted text-foreground hover:text-white text-xs font-medium whitespace-nowrap border border-transparent hover:border-border"
              title={action.prompt}
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-foreground/30 border-b border-foreground text-foreground text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="p-1 hover:text-foreground" title="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Sparkles className="w-12 h-12 text-foreground mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">How can I help you today?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                I can help you manage your budget, track spending, add transactions, and more.
              </p>
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Try asking:
                </p>
                {[
                  "What's my spending this month?",
                  "Add a $50 grocery expense",
                  "Create a new savings account",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickAction(suggestion)}
                    className="block w-full text-left px-3 py-2 rounded-lg bg-card hover:bg-muted text-foreground hover:text-white text-sm border border-transparent hover:border-border"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-foreground" />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-[85%] rounded-lg px-4 py-2.5 ${
                      message.role === "user" ? "bg-foreground text-white" : "bg-card text-gray-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Copy button for assistant messages */}
                    {message.role === "assistant" && (
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Sending indicator */}
              {sendingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="bg-card rounded-lg px-4 py-2.5 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full px-4 py-2.5 pr-12 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-foreground resize-none min-h-[44px] max-h-[150px]"
                rows={1}
                disabled={sendingMessage}
              />
              {inputValue.length > 0 && (
                <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
                  {inputValue.length}/2000
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!inputValue.trim() || sendingMessage}
              className="self-end h-[44px] px-4"
            >
              {sendingMessage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}

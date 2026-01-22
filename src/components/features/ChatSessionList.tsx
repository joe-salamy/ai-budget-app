// Chat session list component
// Displays a dropdown/list of chat sessions with management options

import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Trash2, Pencil, Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ChatSession } from "@/types";

interface ChatSessionListProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  loading: boolean;
  onSelectSession: (session: ChatSession) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export function ChatSessionList({
  sessions,
  currentSession,
  loading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}: ChatSessionListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this chat session?")) {
      onDeleteSession(sessionId);
    }
  };

  const handleNewChat = () => {
    onCreateSession();
    setIsOpen(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current session button / dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-200 max-w-[200px] border border-transparent hover:border-gray-600"
        title={currentSession?.title || "Select a session"}
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{currentSession?.title || "New Chat"}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* New chat button */}
          <div className="p-2 border-b border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="w-full justify-start gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Sessions list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No chat sessions yet</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 p-2 cursor-pointer ${
                    currentSession?.id === session.id ? "bg-blue-900/30" : "hover:bg-gray-700"
                  }`}
                  onClick={() => handleSelectSession(session)}
                >
                  {editingId === session.id ? (
                    <form
                      onSubmit={handleSaveEdit}
                      className="flex-1 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                        maxLength={50}
                      />
                      <button
                        type="submit"
                        className="p-1 text-green-400 hover:text-green-300"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-300"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{session.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(session.last_message_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => handleStartEdit(session, e)}
                          className="p-1 text-gray-400 hover:text-blue-400"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

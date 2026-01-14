// Chat service - Client-side interface for AI chatbot
import { supabase } from "../lib/supabaseClient";
import type { ChatSession, ChatMessage, AIPersonality } from "../types";

// ============== TYPES ==============

export interface SendMessageResponse {
  success: boolean;
  data?: {
    session_id: string;
    message: string;
    function_calls?: Array<{
      success: boolean;
      message: string;
      data?: unknown;
    }>;
  };
  error?: string;
}

export interface SessionsResponse {
  success: boolean;
  data?: ChatSession[];
  error?: string;
}

export interface MessagesResponse {
  success: boolean;
  data?: ChatMessage[];
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  data?: ChatSession;
  error?: string;
}

export interface PreferencesResponse {
  success: boolean;
  data?: {
    ai_personality: AIPersonality;
  };
  error?: string;
}

// ============== CHAT MESSAGES ==============

/**
 * Send a message to the AI chatbot
 */
export async function sendMessage(
  message: string,
  sessionId?: string,
  currentPage?: string
): Promise<SendMessageResponse> {
  try {
    // Get the current session for the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "User not authenticated" };
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        current_page: currentPage,
        access_token: session.access_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== SESSIONS ==============

/**
 * Get all chat sessions for the current user
 */
export async function getSessions(): Promise<SessionsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ChatSession[] };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get messages for a specific session
 */
export async function getSessionMessages(sessionId: string): Promise<MessagesResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ChatMessage[] };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Create a new chat session
 */
export async function createSession(title?: string): Promise<SessionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: title || "New Chat",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ChatSession };
  } catch (error) {
    console.error("Error creating session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete a chat session and its messages
 */
export async function deleteSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Delete messages first (cascade should handle this, but being explicit)
    await supabase
      .from("chat_messages")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    // Delete the session
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Rename a chat session
 */
export async function renameSession(sessionId: string, newTitle: string): Promise<SessionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title: newTitle })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ChatSession };
  } catch (error) {
    console.error("Error renaming session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== USER PREFERENCES ==============

/**
 * Get user's AI personality preference
 */
export async function getAIPersonality(): Promise<PreferencesResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("ai_personality")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // If no preferences exist, return default
      if (error.code === "PGRST116") {
        return { success: true, data: { ai_personality: "friendly" } };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { ai_personality: data.ai_personality as AIPersonality },
    };
  } catch (error) {
    console.error("Error fetching AI personality:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update user's AI personality preference
 */
export async function updateAIPersonality(
  personality: AIPersonality
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("user_preferences")
      .update({ ai_personality: personality })
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating AI personality:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

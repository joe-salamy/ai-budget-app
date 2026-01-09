import { supabase } from '@/lib/supabaseClient';
import type { User, AuthError } from '@supabase/supabase-js';

/**
 * Authentication service for managing user authentication with Supabase
 * All functions return standardized response objects with data or error
 */

export interface AuthResponse<T = User> {
  data: T | null;
  error: AuthError | Error | null;
}

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password (min 6 characters)
 * @returns Promise with user data or error
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation can be enabled in Supabase dashboard
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during sign up'),
    };
  }
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with user data or error
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during sign in'),
    };
  }
}

/**
 * Sign in with Google OAuth
 * Redirects user to Google consent screen
 * @returns Promise with error if redirect fails
 */
export async function signInWithGoogle(): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        // Request additional scopes if needed
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { data: null, error };
    }

    // OAuth redirect will happen, so we return success
    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during Google sign in'),
    };
  }
}

/**
 * Sign out the current user
 * Clears session from local storage
 * @returns Promise with error if sign out fails
 */
export async function signOut(): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during sign out'),
    };
  }
}

/**
 * Get the currently authenticated user
 * @returns Promise with user data or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error getting current user'),
    };
  }
}

/**
 * Send a password reset email to the user
 * @param email - User's email address
 * @returns Promise with error if sending fails
 */
export async function resetPassword(email: string): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error sending password reset'),
    };
  }
}

/**
 * Update user password (must be authenticated)
 * @param newPassword - New password (min 6 characters)
 * @returns Promise with user data or error
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error updating password'),
    };
  }
}

/**
 * Delete the current user's account
 * Warning: This is irreversible and will soft-delete all user data
 * @returns Promise with error if deletion fails
 */
export async function deleteAccount(): Promise<AuthResponse<null>> {
  try {
    // First, get current user ID
    const { data: userData, error: userError } = await getCurrentUser();

    if (userError || !userData) {
      return { data: null, error: userError || new Error('No user found') };
    }

    // Note: Supabase doesn't have a built-in delete user method from client
    // We'll need to create a serverless function for this in future phases
    // For now, we'll just sign out and return an error message

    return {
      data: null,
      error: new Error(
        'Account deletion requires server-side implementation. This feature will be available in a future update.'
      ),
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error deleting account'),
    };
  }
}

/**
 * Check if user is currently authenticated
 * @returns Promise with boolean indicating auth status
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

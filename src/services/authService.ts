import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser } from '../types/admin';

const DEMO_ADMIN_STORAGE_KEY = 'urdupdfbooks_admin_session';

export const authService = {
  /**
   * Log in using Supabase Auth or Local Admin Sandbox mode
   */
  async login(email: string, password: string): Promise<{ user: AdminUser | null; error: string | null }> {
    const client = getSupabase();

    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          return {
            user: {
              id: data.user.id,
              email: data.user.email || email,
              role: 'admin',
            },
            error: null,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Supabase Auth connection error';
        return { user: null, error: msg };
      }
    }

    // Local Sandbox Admin Mode (when Supabase credentials are not yet entered in .env)
    // Allows testing and configuring the entire dashboard immediately
    if (email && password.length >= 6) {
      const sandboxUser: AdminUser = {
        id: 'sandbox-admin-01',
        email: email.trim(),
        role: 'admin',
      };
      localStorage.setItem(DEMO_ADMIN_STORAGE_KEY, JSON.stringify(sandboxUser));
      return { user: sandboxUser, error: null };
    }

    return {
      user: null,
      error: 'Please enter a valid email and a password of at least 6 characters.',
    };
  },

  /**
   * Check current authenticated session
   */
  async getSession(): Promise<AdminUser | null> {
    const client = getSupabase();

    if (client && isSupabaseConfigured()) {
      try {
        const { data } = await client.auth.getSession();
        if (data.session?.user) {
          return {
            id: data.session.user.id,
            email: data.session.user.email || '',
            role: 'admin',
          };
        }
      } catch (err) {
        console.warn('Error checking Supabase session:', err);
      }
    }

    // Check Sandbox session
    const saved = localStorage.getItem(DEMO_ADMIN_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AdminUser;
      } catch {
        localStorage.removeItem(DEMO_ADMIN_STORAGE_KEY);
      }
    }

    return null;
  },

  /**
   * Log out current admin
   */
  async logout(): Promise<void> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('Error during Supabase signOut:', err);
      }
    }
    localStorage.removeItem(DEMO_ADMIN_STORAGE_KEY);
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return {
          success: true,
          message: 'Password reset instructions have been sent to your email.',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error sending reset email';
        return { success: false, message: msg };
      }
    }

    return {
      success: true,
      message: 'In Sandbox mode: To enable real email password resets, connect Supabase in .env.',
    };
  },
};

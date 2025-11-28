import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('Auth state changed', { event, userId: session?.user?.id });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log important auth events
        if (event === 'SIGNED_IN') {
          logger.info('User signed in successfully', { 
            userId: session?.user?.id,
            email: session?.user?.email,
            emailConfirmed: !!session?.user?.email_confirmed_at
          });
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out');
        } else if (event === 'USER_UPDATED') {
          logger.debug('User updated', { 
            userId: session?.user?.id,
            emailConfirmed: !!session?.user?.email_confirmed_at
          });
        } else if (event === 'TOKEN_REFRESHED') {
          logger.debug('Token refreshed successfully');
        }

        // Defer any additional data fetching to prevent deadlocks
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            // Any additional user data fetching can go here
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.debug('Retrieved existing session', { userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      logger.info('User signing out');
      
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        logger.warn('Sign out failed, but continuing with cleanup', { error: err });
      }

      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      logger.error('Error during sign out', { error });
      // Force redirect even if sign out fails
      window.location.href = '/auth';
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};
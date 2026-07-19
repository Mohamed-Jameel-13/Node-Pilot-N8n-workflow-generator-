/**
 * Authentication Guard Hook
 * Ensures user is authenticated before accessing protected pages
 * 
 * SECURITY: Prevents unauthorized access to dashboard pages
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UseRequireAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
}

/**
 * Hook that redirects to login if user is not authenticated
 * Usage: Add to any protected page component
 * 
 * @param redirectTo Path to redirect to if not authenticated (default: '/auth/login')
 * @returns Loading state, auth status, and user object
 */
export function useRequireAuth(redirectTo: string = '/auth/login'): UseRequireAuthReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error || !session) {
          console.warn('[Auth Guard] No valid session, redirecting to login');
          setIsAuthenticated(false);
          setUser(null);
          router.push(redirectTo);
        } else {
          setIsAuthenticated(true);
          setUser(session.user);
        }
      } catch (error) {
        console.error('[Auth Guard] Failed to check auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          router.push(redirectTo);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth changes (logout, session expired, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUser(null);
        router.push(redirectTo);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(true);
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  return { isLoading, isAuthenticated, user };
}

/**
 * Lightweight auth check without redirect
 * Useful for conditional rendering without navigation
 */
export function useAuth(): UseRequireAuthReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        setIsAuthenticated(!!session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('[Auth] Failed to check auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isLoading, isAuthenticated, user };
}

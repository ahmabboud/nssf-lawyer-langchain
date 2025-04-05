"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';
import { getUserRole } from '../utils/userManagement';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Cache for role checks to minimize DB queries
const userRoleCache = new Map<string, {role: string, timestamp: number}>();
const ROLE_CACHE_TTL = 60000; // 1 minute TTL

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Removed toast.info for checking session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError.message);
          if (mounted) {
            setAuthenticated(false);
            router.replace('/auth');
          }
          return;
        }

        if (!session) {
          if (mounted) {
            setAuthenticated(false);
            router.replace('/auth');
          }
          return;
        }

        if (mounted) setAuthenticated(true);

        // Check role-based access for admin routes
        if (pathname?.startsWith('/admin')) {
          try {
            // Check cache first
            const userId = session.user.id;
            const cachedRole = userRoleCache.get(userId);
            
            if (cachedRole && (Date.now() - cachedRole.timestamp < ROLE_CACHE_TTL)) {
              // Use cached role if it's recent
              if (mounted) {
                setAuthorized(cachedRole.role === 'admin');
                setLoading(false);
                if (cachedRole.role !== 'admin') {
                  router.replace('/');
                }
              }
              return;
            }
            
            // No cache or expired, get from DB with timeout
            const userRole = await Promise.race([
              getUserRole(session.user.id),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Role check timed out')), 5000)
              )
            ]);
            
            // Update cache
            userRoleCache.set(userId, {
              role: userRole, 
              timestamp: Date.now()
            });
            
            if (mounted) {
              setAuthorized(userRole === 'admin');
              if (userRole !== 'admin') {
                router.replace('/');
              }
            }
          } catch (roleError) {
            console.error('Role check error:', roleError);
            toast.error('Failed to verify admin access');
            if (mounted) {
              setAuthorized(false);
              router.replace('/');
            }
            return;
          }
        } else {
          // Non-admin routes are authorized for authenticated users
          if (mounted) setAuthorized(true);
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        router.replace('/auth');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event);
      
      if (!session) {
        // Only show error toast for explicit sign out events
        if (_event === 'SIGNED_OUT') {
          toast.error('Session ended');
        }
        if (mounted) {
          setAuthenticated(false);
          setAuthorized(false);
          router.replace('/auth');
        }
      } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        // Don't do full re-auth checks on token refresh, just update the session state
        if (mounted) {
          setAuthenticated(true);
          // For admin routes, we'll recheck authorization later in checkAuth
        }
      }
    });

    checkAuth();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-pulse text-lg">Loading authentication...</div>
    </div>;
  }

  if (!isClient) {
    return null;
  }

  if (!authenticated || !authorized) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
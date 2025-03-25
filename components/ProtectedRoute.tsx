"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';
import { getUserRole } from '../utils/userManagement';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

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
        toast.info('Checking session...'); // Updated to English
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          toast.error('Session error: ' + sessionError.message); // Updated to English
          throw new Error(sessionError.message);
        }

        if (!session) {
          toast.error('No active session found'); // Updated to English
          router.replace('/auth');
          return;
        }

        toast.success('Session verified successfully'); // Updated to English
        if (mounted) setAuthenticated(true);

        // Check role-based access for admin routes
        if (pathname?.startsWith('/admin')) {
          toast.info('Verifying admin permissions...'); // Updated to English
          try {
            const userRole = await getUserRole(session.user.id);
            toast.info(`Current user role: ${userRole}`); // Updated to English
            
            if (userRole !== 'admin') {
              toast.error('Access denied: Admin permissions required'); // Updated to English
              router.replace('/');
              return;
            }
            if (mounted) setAuthorized(true);
            toast.success('Admin permissions granted'); // Updated to English
          } catch (roleError) {
            console.error('Error verifying permissions:', roleError); // Updated to English
            toast.error('Failed to verify admin permissions'); // Updated to English
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
        console.error('Authentication error:', error); // Updated to English
        toast.error('Authentication failed'); // Updated to English
        router.replace('/auth');
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event); // Updated to English
      
      if (!session) {
        toast.error('Session expired'); // Updated to English
        router.replace('/auth');
        setAuthenticated(false);
        setAuthorized(false);
      } else {
        setAuthenticated(true);
        if (pathname?.startsWith('/admin')) {
          try {
            const userRole = await getUserRole(session.user.id);
            if (mounted) {
              setAuthorized(userRole === 'admin');
              if (userRole !== 'admin') {
                toast.error('Access denied: Admin permissions required'); // Updated to English
                router.replace('/');
              } else {
                toast.success('Admin permissions verified'); // Updated to English
              }
            }
          } catch (error) {
            console.error('Error verifying permissions:', error); // Updated to English
            toast.error('Failed to verify admin permissions'); // Updated to English
            if (mounted) {
              setAuthorized(false);
              router.replace('/');
            }
          }
        } else {
          // Non-admin routes are authorized for authenticated users
          if (mounted) setAuthorized(true);
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
    return <div>Loading...</div>; // Updated to English
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
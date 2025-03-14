"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/auth');
        } else {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/auth');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
      }
    });

    checkAuth();
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  // Only show content when authenticated
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
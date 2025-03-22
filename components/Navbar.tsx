"use client";

import { cn } from "@/utils/cn";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { supabase } from "@/utils/supabaseClient";
import { LogOutIcon, FileTextIcon } from "lucide-react";

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <Link
      href={props.href}
      className={cn(
        "px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all",
        pathname === props.href && "bg-primary text-primary-foreground",
      )}
    >
      {props.children}
    </Link>
  );
};

export const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // Check if user has admin role (you would need to implement this based on your user model)
      if (session) {
        // This is a simplified check - implement proper role checking based on your database schema
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && userData && userData.role === 'admin') {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      
      if (!session) {
        setIsAdmin(false);
      } else {
        // Same admin check as above on auth state change
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && userData && userData.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear any stored session data
      window.localStorage.removeItem('supabase.auth.token');
      // Force router navigation
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Don't show navbar on auth page
  if (pathname === '/auth') {
    return null;
  }

  return (
    <nav className="flex items-center justify-between py-2 px-4">
      <div className="flex items-center space-x-2">
        <ActiveLink href="/">
          Home
        </ActiveLink>
        
        {isAdmin && (
          <ActiveLink href="/admin/documents">
            <FileTextIcon size={16} />
            <span>Documents</span>
          </ActiveLink>
        )}
      </div>
      
      {isAuthenticated && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOutIcon size={16} />
          Sign Out
        </Button>
      )}
    </nav>
  );
};

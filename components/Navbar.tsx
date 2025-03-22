"use client";

import { cn } from "@/utils/cn";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { supabase } from "@/utils/supabaseClient";
import { LogOutIcon } from "lucide-react";

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <Link
      href={props.href}
      className={cn(
        "px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all",
        pathname === props.href && "bg-primary text-primary-foreground"
      )}
      dir="rtl" // Ensure RTL layout
    >
      {props.children}
    </Link>
  );
};

export const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear any stored session data
      window.localStorage.removeItem("supabase.auth.token");
      // Force router navigation
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't show sign out button on auth page
  if (pathname === "/auth") {
    return null;
  }

  return (
    <nav dir="rtl" className="flex items-center justify-between p-4">
      {isAuthenticated ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOutIcon size={16} />
          تسجيل الخروج {/* Updated text to Arabic */}
        </Button>
      ) : null}
    </nav>
  );
};
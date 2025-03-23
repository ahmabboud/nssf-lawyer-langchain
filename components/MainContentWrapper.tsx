"use client";
import { usePathname } from 'next/navigation';
import ProtectedRoute from './ProtectedRoute';
import { useEffect, useState } from 'react';

export default function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent content flash during hydration
  }

  const isAuthPage = pathname === '/auth';
  return (
    <div dir="rtl"> {/* Ensure RTL layout */}
      {isAuthPage ? <>{children}</> : <ProtectedRoute>{children}</ProtectedRoute>}
    </div>
  );
}
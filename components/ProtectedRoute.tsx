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
        toast.info('جاري التحقق من الجلسة...'); // Updated text to Arabic
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          toast.error('خطأ في الجلسة: ' + sessionError.message); // Updated text to Arabic
          throw new Error(sessionError.message);
        }

        if (!session) {
          toast.error('لم يتم العثور على جلسة نشطة'); // Updated text to Arabic
          router.replace('/auth');
          return;
        }

        toast.success('تم التحقق من الجلسة بنجاح'); // Updated text to Arabic
        if (mounted) setAuthenticated(true);

        // Check role-based access for admin routes
        if (pathname?.startsWith('/admin')) {
          toast.info('جاري التحقق من صلاحيات المدير...'); // Updated text to Arabic
          try {
            const userRole = await getUserRole(session.user.id);
            toast.info(`صلاحية المستخدم الحالي: ${userRole}`); // Updated text to Arabic
            
            if (userRole !== 'admin') {
              toast.error('تم الرفض: صلاحيات المدير مطلوبة'); // Updated text to Arabic
              router.replace('/');
              return;
            }
            if (mounted) setAuthorized(true);
            toast.success('تم منح صلاحيات المدير'); // Updated text to Arabic
          } catch (roleError) {
            console.error('خطأ في التحقق من الصلاحية:', roleError); // Updated text to Arabic
            toast.error('فشل التحقق من صلاحيات المدير'); // Updated text to Arabic
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
        console.error('خطأ في المصادقة:', error); // Updated text to Arabic
        toast.error('فشل المصادقة'); // Updated text to Arabic
        router.replace('/auth');
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('تغير حالة المصادقة:', _event); // Updated text to Arabic
      
      if (!session) {
        toast.error('انتهت الجلسة'); // Updated text to Arabic
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
                toast.error('تم الرفض: صلاحيات المدير مطلوبة'); // Updated text to Arabic
                router.replace('/');
              } else {
                toast.success('تم التحقق من صلاحيات المدير'); // Updated text to Arabic
              }
            }
          } catch (error) {
            console.error('خطأ في التحقق من الصلاحية:', error); // Updated text to Arabic
            toast.error('فشل التحقق من صلاحيات المدير'); // Updated text to Arabic
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
    return <div>جاري التحميل...</div>; // Updated text to Arabic
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
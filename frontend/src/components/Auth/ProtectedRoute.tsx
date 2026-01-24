import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';

type Role = 'teacher' | 'admin' | 'super-admin';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/'
}: ProtectedRouteProps) => {
  const { session, loading: authLoading } = useTeacherAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        // First check teacher_profiles for role
        const { data: profile, error: profileError } = await supabase
          .from('teacher_profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.log('Profile query error (role column may not exist):', profileError.message);
        }

        // Also check user_metadata
        const metadataRole = session.user.user_metadata?.role;
        
        console.log('ProtectedRoute - Profile role:', profile?.role, 'Metadata role:', metadataRole);

        // Use metadata role first (set during signup), then profile role, then default to 'teacher'
        // This prioritizes the role set during account creation
        const role = (metadataRole || profile?.role || 'teacher') as Role;
        console.log('ProtectedRoute - Final determined role:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // On error, check metadata as fallback
        const metadataRole = session.user.user_metadata?.role;
        setUserRole((metadataRole || 'teacher') as Role);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserRole();
    }
  }, [session, authLoading]);

  // Show loading spinner while checking auth and role
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!session) {
    // Determine which login to redirect to based on the current path
    const loginPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin')
      ? '/admin/login'
      : '/';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If user role is not in allowed roles, redirect
  if (userRole && !allowedRoles.includes(userRole)) {
    console.log(`Access denied. User role: ${userRole}, Allowed: ${allowedRoles.join(', ')}`);
    
    // Redirect based on user's actual role
    if (userRole === 'admin' || userRole === 'super-admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/teacher/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Convenience components for common role checks
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'super-admin']} redirectTo="/">
    {children}
  </ProtectedRoute>
);

export const TeacherRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['teacher']} redirectTo="/admin/dashboard">
    {children}
  </ProtectedRoute>
);

export const SuperAdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['super-admin']} redirectTo="/admin/dashboard">
    {children}
  </ProtectedRoute>
);

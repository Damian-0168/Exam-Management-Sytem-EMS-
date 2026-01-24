import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'teacher' | 'super-admin';

export const useUserRole = () => {
  return useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // First try to get role from teacher_profiles
      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        return profile.role as UserRole;
      }

      // Fallback to user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role) {
        return roleData.role as UserRole;
      }

      // Check user metadata
      const metadataRole = user.user_metadata?.role;
      if (metadataRole) {
        return metadataRole as UserRole;
      }

      // Default to teacher
      return 'teacher' as UserRole;
    }
  });
};

export const useIsAdmin = () => {
  const { data: role } = useUserRole();
  return role === 'admin' || role === 'super-admin';
};

export const useIsSuperAdmin = () => {
  const { data: role } = useUserRole();
  return role === 'super-admin';
};

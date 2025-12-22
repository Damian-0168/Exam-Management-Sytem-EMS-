import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherProfile {
  id: string;
  school_id: string;
  name: string;
  department?: string;
  subjects: string[];
  created_at: string;
  updated_at: string;
}

export const useTeacherProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['teacher-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as TeacherProfile | null;
    },
    enabled: !!userId
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassSection {
  class_name: string;
  section: string;
}

export const useClassesSections = () => {
  return useQuery({
    queryKey: ['classes-sections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.school_id) {
        // Return empty data if no school found
        return [] as ClassSection[];
      }

      const { data: students, error } = await supabase
        .from('students')
        .select('class, section')
        .eq('school_id', profile.school_id);

      if (error) throw error;

      // Get unique class-section combinations
      const uniqueCombos = new Map<string, ClassSection>();
      students?.forEach(s => {
        if (s.class && s.section) {
          const key = `${s.class}-${s.section}`;
          if (!uniqueCombos.has(key)) {
            uniqueCombos.set(key, { class_name: s.class, section: s.section });
          }
        }
      });

      return Array.from(uniqueCombos.values()).sort((a, b) => 
        a.class_name.localeCompare(b.class_name) || a.section.localeCompare(b.section)
      );
    }
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTeacherSubjects = () => {
  return useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          subject_id,
          classes,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq('teacher_id', user.id);

      if (error) throw error;
      return data;
    }
  });
};

export const useCanEditSubject = (subjectId: string, examClass: string) => {
  const { data: teacherSubjects, isLoading } = useTeacherSubjects();
  
  if (isLoading || !teacherSubjects) return false;
  
  return teacherSubjects.some(
    ts => ts.subject_id === subjectId && ts.classes.includes(examClass)
  );
};

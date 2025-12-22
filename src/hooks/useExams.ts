import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Exam {
  id: string;
  name: string;
  academic_year: string;
  section: string;
  class: string;
  exam_date: string;
  term: 'first' | 'second';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type: 'test' | 'practical' | 'full-examination';
  created_at: string;
  created_by?: string;
  pdf_file_path?: string;
  is_visible: boolean;
}

export interface ExamWithSubjects extends Exam {
  exam_subjects: {
    id: string;
    subject_id: string;
    max_marks: number;
    pdf_file_path?: string | null;
    subjects: {
      name: string;
      code: string;
    };
  }[];
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_id: string;
  max_marks: number;
  pdf_file_path?: string | null;
}

export const useExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (!profile?.school_id) throw new Error('School not found');

      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          exam_subjects (
            id,
            subject_id,
            max_marks,
            pdf_file_path,
            subjects (
              name,
              code
            )
          )
        `)
        .is('exam_event_id', null)  // Only standalone exams (tests & practicals)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      return data as ExamWithSubjects[];
    }
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examData: {
      name: string;
      academic_year: string;
      class: string;
      section: string;
      exam_date: string;
      term: 'first' | 'second';
      type: 'test' | 'practical' | 'full-examination';
      status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
      is_visible?: boolean;
      subjects: { subject_id: string; max_marks: number }[];
      exam_event_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { subjects, exam_event_id, ...examInfo } = examData;

      // Insert exam - status defaults to 'upcoming' in database
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({ 
          ...examInfo, 
          teacher_id: user.id,
          exam_event_id: exam_event_id || null
        })
        .select()
        .single();

      if (examError) throw examError;

      // Insert exam subjects
      if (subjects && subjects.length > 0) {
        const examSubjects = subjects.map(subject => ({
          exam_id: exam.id,
          subject_id: subject.subject_id,
          max_marks: subject.max_marks
        }));

        const { error: subjectsError } = await supabase
          .from('exam_subjects')
          .insert(examSubjects);

        if (subjectsError) throw subjectsError;
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: 'Success',
        description: 'Exam created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates,
      subjects
    }: { 
      id: string; 
      updates: Partial<Exam>;
      subjects?: { subject_id: string; max_marks: number }[];
    }) => {
      const { error: examError } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id);

      if (examError) throw examError;

      // Update subjects if provided
      if (subjects) {
        // Delete existing exam subjects
        await supabase
          .from('exam_subjects')
          .delete()
          .eq('exam_id', id);

        // Insert new exam subjects
        if (subjects.length > 0) {
          const examSubjects = subjects.map(subject => ({
            exam_id: id,
            subject_id: subject.subject_id,
            max_marks: subject.max_marks
          }));

          const { error: subjectsError } = await supabase
            .from('exam_subjects')
            .insert(examSubjects);

          if (subjectsError) throw subjectsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: 'Success',
        description: 'Exam updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: 'Success',
        description: 'Exam deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

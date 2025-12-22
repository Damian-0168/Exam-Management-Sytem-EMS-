import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherAuth } from './useTeacherAuth';

export interface SubjectExam {
  id: string;
  examEventId?: string;
  name: string;
  examDate: string;
  class: string;
  section: string;
  academicYear: string;
  term: 'first' | 'second';
  type: 'test' | 'practical' | 'full-examination';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  teacherId?: string;
  pdfFilePath?: string;
  isVisible: boolean;
  createdAt: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  examSubjects?: Array<{
    id: string;
    subjectId: string;
    maxMarks: number;
    pdfFilePath?: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface SubjectExamFormData {
  examEventId?: string;
  subjectId: string;
  examType: 'test' | 'practical' | 'full-examination';
  examName: string;
  examDate: string;
  durationMinutes?: number;
  maxMarks: number;
  passingMarks: number;
  instructions?: string;
  pdfFile?: File;
  status?: 'draft' | 'published' | 'completed';
  class: string;
  section: string;
  academicYear: string;
  term: 'first' | 'second';
}

// Transform database format to app format
const transformExam = (dbExam: any): SubjectExam => ({
  id: dbExam.id,
  examEventId: dbExam.exam_event_id,
  name: dbExam.name,
  examDate: dbExam.exam_date,
  class: dbExam.class,
  section: dbExam.section,
  academicYear: dbExam.academic_year,
  term: dbExam.term,
  type: dbExam.type,
  status: dbExam.status,
  teacherId: dbExam.teacher_id,
  pdfFilePath: dbExam.pdf_file_path,
  isVisible: dbExam.is_visible,
  createdAt: dbExam.created_at,
  examSubjects: dbExam.exam_subjects?.map((es: any) => ({
    id: es.id,
    subjectId: es.subject_id,
    maxMarks: es.max_marks,
    pdfFilePath: es.pdf_file_path,
    subject: es.subjects
  }))
});

// Fetch exams (optionally filtered by teacher)
export const useSubjectExams = (teacherOnly: boolean = false) => {
  const { user } = useTeacherAuth();

  return useQuery({
    queryKey: ['subjectExams', teacherOnly ? user?.id : 'all'],
    queryFn: async () => {
      let query = supabase
        .from('exams')
        .select(`
          *,
          exam_subjects (
            id,
            subject_id,
            max_marks,
            pdf_file_path,
            subjects (
              id,
              name,
              code
            )
          )
        `)
        .order('exam_date', { ascending: false });

      if (teacherOnly && user?.id) {
        query = query.eq('teacher_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(transformExam);
    },
    enabled: !teacherOnly || !!user?.id
  });
};

// Fetch exams by event
export const useSubjectExamsByEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['subjectExams', 'event', eventId],
    queryFn: async () => {
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
              id,
              name,
              code
            )
          )
        `)
        .eq('exam_event_id', eventId);

      if (error) throw error;
      return (data || []).map(transformExam);
    },
    enabled: !!eventId
  });
};

// Create exam (for tests/practicals)
export const useCreateSubjectExam = () => {
  const queryClient = useQueryClient();
  const { user } = useTeacherAuth();

  return useMutation({
    mutationFn: async (formData: SubjectExamFormData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create the exam first
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          exam_event_id: formData.examEventId || null,
          name: formData.examName,
          exam_date: formData.examDate,
          class: formData.class,
          section: formData.section,
          academic_year: formData.academicYear,
          term: formData.term,
          type: formData.examType,
          status: 'upcoming',
          teacher_id: user.id,
          is_visible: true
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create exam_subject entry
      let pdfFilePath: string | undefined;

      if (formData.pdfFile) {
        const fileExt = formData.pdfFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `exams/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('exam-pdfs')
          .upload(filePath, formData.pdfFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('exam-pdfs')
          .getPublicUrl(filePath);

        pdfFilePath = publicUrl;
      }

      const { error: subjectError } = await supabase
        .from('exam_subjects')
        .insert({
          exam_id: examData.id,
          subject_id: formData.subjectId,
          max_marks: formData.maxMarks,
          pdf_file_path: pdfFilePath
        });

      if (subjectError) throw subjectError;

      return transformExam(examData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectExams'] });
      queryClient.invalidateQueries({ queryKey: ['examEvent'] });
    }
  });
};

// Update exam
export const useUpdateSubjectExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubjectExamFormData> }) => {
      const updateData: Record<string, any> = {};

      if (updates.examName) updateData.name = updates.examName;
      if (updates.examDate) updateData.exam_date = updates.examDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.class) updateData.class = updates.class;
      if (updates.section) updateData.section = updates.section;

      const { data, error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformExam(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectExams'] });
      queryClient.invalidateQueries({ queryKey: ['examEvent'] });
    }
  });
};

// Delete exam
export const useDeleteSubjectExam = () => {
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
      queryClient.invalidateQueries({ queryKey: ['subjectExams'] });
      queryClient.invalidateQueries({ queryKey: ['examEvent'] });
    }
  });
};

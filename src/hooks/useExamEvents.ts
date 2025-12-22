import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherAuth } from './useTeacherAuth';

export interface ExamEvent {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  term: 'first' | 'second';
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamEventFormData {
  name: string;
  description?: string;
  academicYear: string;
  term: 'first' | 'second';
  startDate: string;
  endDate: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// Transform database format to app format
const transformExamEvent = (dbEvent: any): ExamEvent => ({
  id: dbEvent.id,
  name: dbEvent.name,
  description: dbEvent.description,
  academicYear: dbEvent.academic_year,
  term: dbEvent.term,
  startDate: dbEvent.start_date,
  endDate: dbEvent.end_date,
  status: dbEvent.status,
  createdBy: dbEvent.created_by,
  createdAt: dbEvent.created_at,
  updatedAt: dbEvent.updated_at
});

// Fetch all exam events
export const useExamEvents = () => {
  return useQuery({
    queryKey: ['examEvents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data?.map(transformExamEvent) || [];
    }
  });
};

// Fetch single exam event with related exams
export const useExamEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['examEvent', eventId],
    queryFn: async () => {
      const { data: eventData, error: eventError } = await supabase
        .from('exam_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Get exams linked to this event
      const { data: examsData, error: examsError } = await supabase
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

      if (examsError) throw examsError;

      return {
        ...transformExamEvent(eventData),
        exams: examsData || []
      };
    },
    enabled: !!eventId
  });
};

// Alias for backwards compatibility
export const useExamEventWithExams = useExamEvent;

// Create exam event
export const useCreateExamEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useTeacherAuth();

  return useMutation({
    mutationFn: async (formData: ExamEventFormData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('exam_events')
        .insert({
          name: formData.name,
          description: formData.description,
          academic_year: formData.academicYear,
          term: formData.term,
          start_date: formData.startDate,
          end_date: formData.endDate,
          status: formData.status || 'upcoming',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return transformExamEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examEvents'] });
    }
  });
};

// Update exam event
export const useUpdateExamEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExamEventFormData> }) => {
      const updateData: Record<string, any> = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.academicYear) updateData.academic_year = updates.academicYear;
      if (updates.term) updateData.term = updates.term;
      if (updates.startDate) updateData.start_date = updates.startDate;
      if (updates.endDate) updateData.end_date = updates.endDate;
      if (updates.status) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('exam_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformExamEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examEvents'] });
      queryClient.invalidateQueries({ queryKey: ['examEvent'] });
    }
  });
};

// Delete exam event
export const useDeleteExamEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examEvents'] });
    }
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUploadSubjectPdf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      examSubjectId,
      pdfFile
    }: {
      examSubjectId: string;
      pdfFile: File;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current exam_subject to check for existing PDF
      const { data: examSubject, error: fetchError } = await supabase
        .from('exam_subjects')
        .select('pdf_file_path')
        .eq('id', examSubjectId)
        .single();

      if (fetchError) throw fetchError;

      // Delete old PDF if exists
      if (examSubject?.pdf_file_path) {
        await supabase.storage
          .from('exam-pdfs')
          .remove([examSubject.pdf_file_path]);
      }

      // Upload new PDF
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `subject-${examSubjectId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('exam-pdfs')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      // Update exam_subject with new PDF path
      const { error: updateError } = await supabase
        .from('exam_subjects')
        .update({ pdf_file_path: fileName })
        .eq('id', examSubjectId);

      if (updateError) throw updateError;

      return { pdf_file_path: fileName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-events'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: 'Success',
        description: 'Subject exam PDF uploaded successfully'
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

export const useDeleteSubjectPdf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examSubjectId: string) => {
      // Get current exam_subject to get PDF path
      const { data: examSubject, error: fetchError } = await supabase
        .from('exam_subjects')
        .select('pdf_file_path')
        .eq('id', examSubjectId)
        .single();

      if (fetchError) throw fetchError;

      // Delete PDF from storage if exists
      if (examSubject?.pdf_file_path) {
        await supabase.storage
          .from('exam-pdfs')
          .remove([examSubject.pdf_file_path]);
      }

      // Update exam_subject to remove PDF path
      const { error: updateError } = await supabase
        .from('exam_subjects')
        .update({ pdf_file_path: null })
        .eq('id', examSubjectId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-events'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: 'Success',
        description: 'Subject exam PDF deleted successfully'
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

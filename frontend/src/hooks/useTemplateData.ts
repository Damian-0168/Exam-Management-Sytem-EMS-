import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateData {
  id: string;
  type: string;
  template_code: string;
  sample_data: any[];
  filename: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTemplateData = (type?: string) => {
  return useQuery({
    queryKey: ['template-data', type],
    queryFn: async () => {
      let query = supabase
        .from('template_data')
        .select('*')
        .eq('is_active', true);
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as TemplateData[];
    }
  });
};

export const useStudentTemplate = () => {
  return useTemplateData('student_import');
};
import { supabase } from '@/integrations/supabase/client';
import apiClient from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';

export interface SignedUrlResponse {
  signed_url: string;
  expires_at: string;
}

/**
 * Generate a signed URL for secure PDF access
 * @param filePath - Path to the file in Supabase storage
 * @param expirationSeconds - URL expiration time (default: 3600 = 1 hour)
 */
export const getSignedPdfUrl = async (
  filePath: string,
  expirationSeconds: number = 3600
): Promise<string> => {
  try {
    // Get current user info for audit logging
    const { data: { user } } = await supabase.auth.getUser();
    
    // Call backend API to generate signed URL and log access
    const response = await apiClient.post('/storage/signed-url', {
      file_path: filePath,
      expiration_seconds: expirationSeconds,
    }, {
      headers: {
        'user-id': user?.id,
        'user-email': user?.email,
        'school-id': user?.user_metadata?.school_id,
      },
    });

    if (response.data.success) {
      return response.data.data.signed_url;
    } else {
      throw new Error(response.data.error || 'Failed to generate signed URL');
    }
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    toast({
      title: 'Error',
      description: 'Failed to load PDF. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

/**
 * Log PDF download event
 */
export const logPdfDownload = async (
  filePath: string,
  examSubjectId: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await apiClient.post('/storage/log-download', {
      file_path: filePath,
      exam_subject_id: examSubjectId,
      user_id: user?.id,
      user_email: user?.email,
      school_id: user?.user_metadata?.school_id,
    });
  } catch (error) {
    console.error('Error logging download:', error);
    // Don't throw - logging failure shouldn't block download
  }
};

/**
 * Get version history for a PDF
 */
export const getPdfVersions = async (examSubjectId: string) => {
  try {
    const response = await apiClient.get(`/storage/file-versions/${examSubjectId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting PDF versions:', error);
    return [];
  }
};

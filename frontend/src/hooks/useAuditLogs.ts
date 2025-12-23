import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { useToast } from './use-toast';
import { auditLogger, AuditLogData } from '@/utils/auditLogger';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  school_id: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  school_id?: string;
  user_id?: string;
  action_type?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch audit logs with filters
 */
export const useAuditLogs = (filters: AuditLogFilters = {}) => {
  return useQuery<AuditLog[]>({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.get(`/audit/logs?${params.toString()}`);
      return response.data.data;
    },
  });
};

/**
 * Hook to get audit log statistics
 */
export const useAuditStats = (schoolId?: string, days: number = 30) => {
  return useQuery({
    queryKey: ['audit-stats', schoolId, days],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      params.append('days', String(days));
      
      const response = await apiClient.get(`/audit/stats?${params.toString()}`);
      return response.data.data;
    },
  });
};

/**
 * Hook to create audit log (use auditLogger utility instead for most cases)
 */
export const useCreateAuditLog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logData: AuditLogData) => {
      await auditLogger.log(logData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
    },
    onError: (error: any) => {
      console.error('Failed to create audit log:', error);
      // Don't show error toast for audit logging failures
    },
  });
};

/**
 * Hook for audit logging actions - convenience wrapper
 */
export const useAuditLogger = () => {
  return {
    logPdfView: auditLogger.logPdfView.bind(auditLogger),
    logPdfDownload: auditLogger.logPdfDownload.bind(auditLogger),
    logLogin: auditLogger.logLogin.bind(auditLogger),
    logLogout: auditLogger.logLogout.bind(auditLogger),
    logStudentCreate: auditLogger.logStudentCreate.bind(auditLogger),
    logExamCreate: auditLogger.logExamCreate.bind(auditLogger),
    logScoreEntry: auditLogger.logScoreEntry.bind(auditLogger),
    logReportExport: auditLogger.logReportExport.bind(auditLogger),
    log: auditLogger.log.bind(auditLogger),
  };
};

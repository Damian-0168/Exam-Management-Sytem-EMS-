import apiClient from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';

export type ActionType = 
  | 'login' 
  | 'logout' 
  | 'upload' 
  | 'view' 
  | 'download' 
  | 'delete' 
  | 'create' 
  | 'update'
  | 'export';

export type ResourceType = 
  | 'pdf' 
  | 'student' 
  | 'exam' 
  | 'score' 
  | 'teacher' 
  | 'report' 
  | 'settings';

export interface AuditLogData {
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, any>;
}

class AuditLoggerService {
  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await apiClient.post('/audit/log', {
        user_id: user?.id,
        user_email: user?.email,
        school_id: user?.user_metadata?.school_id,
        ...data,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break the app
    }
  }

  /**
   * Log PDF view
   */
  async logPdfView(examSubjectId: string, pdfPath: string): Promise<void> {
    await this.log({
      action_type: 'view',
      resource_type: 'pdf',
      resource_id: examSubjectId,
      resource_name: pdfPath,
      details: { file_path: pdfPath },
    });
  }

  /**
   * Log PDF download
   */
  async logPdfDownload(examSubjectId: string, pdfPath: string): Promise<void> {
    await this.log({
      action_type: 'download',
      resource_type: 'pdf',
      resource_id: examSubjectId,
      resource_name: pdfPath,
      details: { file_path: pdfPath },
    });
  }

  /**
   * Log user login
   */
  async logLogin(): Promise<void> {
    await this.log({
      action_type: 'login',
      resource_type: 'teacher',
    });
  }

  /**
   * Log user logout
   */
  async logLogout(): Promise<void> {
    await this.log({
      action_type: 'logout',
      resource_type: 'teacher',
    });
  }

  /**
   * Log student creation
   */
  async logStudentCreate(studentId: string, studentName: string): Promise<void> {
    await this.log({
      action_type: 'create',
      resource_type: 'student',
      resource_id: studentId,
      resource_name: studentName,
    });
  }

  /**
   * Log exam creation
   */
  async logExamCreate(examId: string, examName: string): Promise<void> {
    await this.log({
      action_type: 'create',
      resource_type: 'exam',
      resource_id: examId,
      resource_name: examName,
    });
  }

  /**
   * Log score entry
   */
  async logScoreEntry(scoreId: string, studentName: string, examName: string): Promise<void> {
    await this.log({
      action_type: 'create',
      resource_type: 'score',
      resource_id: scoreId,
      details: { student_name: studentName, exam_name: examName },
    });
  }

  /**
   * Log report export
   */
  async logReportExport(reportType: string, format: string): Promise<void> {
    await this.log({
      action_type: 'export',
      resource_type: 'report',
      resource_name: reportType,
      details: { format },
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerService();

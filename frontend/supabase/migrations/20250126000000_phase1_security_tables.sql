-- ============================================================================
-- PHASE 1: Security & Access Control - Database Schema
-- Migration: 20250126000000_phase1_security_tables.sql
-- ============================================================================

-- ============================================================================
-- 1. Audit Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action_type TEXT NOT NULL, -- login, logout, upload, view, download, delete, create, update
  resource_type TEXT NOT NULL, -- pdf, student, exam, score, teacher, etc.
  resource_id UUID,
  resource_name TEXT,
  details JSONB, -- Additional context about the action
  ip_address TEXT,
  user_agent TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_school_id ON public.audit_logs(school_id);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.role IN ('admin', 'super-admin')
    )
  );

-- System can insert audit logs (bypass RLS for service role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);


-- ============================================================================
-- 2. Permissions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'view_all_exams', 'upload_pdf', 'delete_student'
  description TEXT,
  resource_type TEXT NOT NULL, -- exam, student, score, pdf, report, settings
  action TEXT NOT NULL, -- view, create, update, delete, download, export
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for permissions
CREATE INDEX idx_permissions_resource_type ON public.permissions(resource_type);


-- ============================================================================
-- 3. Role Permissions Mapping Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- super-admin, admin, teacher, viewer
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Create index for role_permissions
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);


-- ============================================================================
-- 4. PDF Version History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exam_file_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Storage path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER, -- Size in bytes
  version_number INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_notes TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for file versions
CREATE INDEX idx_exam_file_versions_exam_subject_id ON public.exam_file_versions(exam_subject_id);
CREATE INDEX idx_exam_file_versions_uploaded_by ON public.exam_file_versions(uploaded_by);
CREATE INDEX idx_exam_file_versions_created_at ON public.exam_file_versions(created_at DESC);

-- Enable RLS on exam_file_versions
ALTER TABLE public.exam_file_versions ENABLE ROW LEVEL SECURITY;

-- Teachers can view version history for their school
CREATE POLICY "Teachers can view file versions"
  ON public.exam_file_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_subjects es
      JOIN public.exams e ON e.id = es.exam_id
      JOIN public.teacher_profiles tp ON tp.school_id = e.school_id
      WHERE es.id = exam_file_versions.exam_subject_id AND tp.id = auth.uid()
    )
  );


-- ============================================================================
-- 5. System Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, config_key)
);

-- Create indexes for system_config
CREATE INDEX idx_system_config_school_id ON public.system_config(school_id);
CREATE INDEX idx_system_config_key ON public.system_config(config_key);

-- Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Teachers can view their school's config
CREATE POLICY "Teachers can view school config"
  ON public.system_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = system_config.school_id
    )
  );

-- Only admins can update config
CREATE POLICY "Admins can update school config"
  ON public.system_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
      AND tp.school_id = system_config.school_id 
      AND tp.role IN ('admin', 'super-admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 6. Insert Default Permissions
-- ============================================================================

-- PDF Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_pdf', 'View exam PDFs', 'pdf', 'view'),
  ('upload_pdf', 'Upload exam PDFs', 'pdf', 'create'),
  ('download_pdf', 'Download exam PDFs', 'pdf', 'download'),
  ('delete_pdf', 'Delete exam PDFs', 'pdf', 'delete'),
  ('view_pdf_versions', 'View PDF version history', 'pdf', 'view');

-- Student Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_students', 'View student records', 'student', 'view'),
  ('create_student', 'Create student records', 'student', 'create'),
  ('update_student', 'Update student records', 'student', 'update'),
  ('delete_student', 'Delete student records', 'student', 'delete'),
  ('import_students', 'Bulk import students', 'student', 'create');

-- Exam Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_exams', 'View exams', 'exam', 'view'),
  ('create_exam', 'Create exams', 'exam', 'create'),
  ('update_exam', 'Update exams', 'exam', 'update'),
  ('delete_exam', 'Delete exams', 'exam', 'delete'),
  ('approve_exam', 'Approve exams', 'exam', 'update');

-- Score Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_scores', 'View scores', 'score', 'view'),
  ('enter_scores', 'Enter/update scores', 'score', 'create'),
  ('approve_scores', 'Approve scores', 'score', 'update'),
  ('delete_scores', 'Delete scores', 'score', 'delete');

-- Report Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_reports', 'View reports', 'report', 'view'),
  ('export_reports', 'Export reports', 'report', 'export'),
  ('generate_reports', 'Generate reports', 'report', 'create');

-- Settings Permissions
INSERT INTO public.permissions (name, description, resource_type, action) VALUES
  ('view_settings', 'View system settings', 'settings', 'view'),
  ('update_settings', 'Update system settings', 'settings', 'update'),
  ('view_audit_logs', 'View audit logs', 'settings', 'view'),
  ('manage_users', 'Manage users and roles', 'settings', 'update');


-- ============================================================================
-- 7. Assign Permissions to Roles
-- ============================================================================

-- Super Admin - All permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super-admin', id FROM public.permissions;

-- Admin - Most permissions except some super-admin only
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE name NOT IN ('manage_users'); -- Example: only super-admin can manage users

-- Teacher - Limited permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'teacher', id FROM public.permissions
WHERE name IN (
  'view_pdf', 'upload_pdf', 'download_pdf', 'view_pdf_versions',
  'view_students', 'create_student', 'update_student',
  'view_exams', 'create_exam', 'update_exam',
  'view_scores', 'enter_scores',
  'view_reports', 'generate_reports', 'export_reports'
);

-- Viewer - Read-only permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer', id FROM public.permissions
WHERE action = 'view';


-- ============================================================================
-- 8. Add school_id to exams table if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exams' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exams ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    CREATE INDEX idx_exams_school_id ON public.exams(school_id);
  END IF;
END $$;


-- ============================================================================
-- 9. Update exam_subjects to add school_id if needed
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_subjects' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exam_subjects ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    CREATE INDEX idx_exam_subjects_school_id ON public.exam_subjects(school_id);
  END IF;
END $$;


-- ============================================================================
-- Migration Complete
-- ============================================================================

-- ============================================================================
-- COMBINED SQL MIGRATIONS FOR SCHOOL MANAGEMENT SYSTEM
-- Generated: 2025-12-12
-- Run these commands in order on your local Supabase instance
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: 20250712105359 - Initial Schema Setup
-- ============================================================================

-- Create enum types for better data consistency
CREATE TYPE public.exam_type as ENUM ('midterm', 'final', 'unit-test', 'assignment', 'practical');
CREATE TYPE public.exam_status as ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE public.term_type as ENUM ('first', 'second', 'third');
CREATE TYPE public.teacher_role as ENUM ('teacher', 'head-teacher', 'admin');

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  max_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 40,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  roll_number TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  date_of_birth DATE,
  guardian TEXT,
  guardian_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT,
  role teacher_role NOT NULL DEFAULT 'teacher',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_subjects junction table
CREATE TABLE public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  classes TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE(teacher_id, subject_id)
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type exam_type NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  term term_type NOT NULL,
  status exam_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.teachers(id)
);

-- Create exam_subjects junction table
CREATE TABLE public.exam_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  max_marks INTEGER NOT NULL DEFAULT 100,
  UNIQUE(exam_id, subject_id)
);

-- Create scores table
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
  max_marks INTEGER NOT NULL DEFAULT 100,
  grade TEXT,
  gpa DECIMAL(3,2),
  remarks TEXT,
  teacher_id UUID REFERENCES public.teachers(id),
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, exam_id, subject_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (you can modify these later for authentication)
-- Subjects policies
CREATE POLICY "Allow all on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- Students policies
CREATE POLICY "Allow all on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- Teachers policies
CREATE POLICY "Allow all on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

-- Teacher subjects policies
CREATE POLICY "Allow all on teacher_subjects" ON public.teacher_subjects FOR ALL USING (true) WITH CHECK (true);

-- Exams policies
CREATE POLICY "Allow all on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

-- Exam subjects policies
CREATE POLICY "Allow all on exam_subjects" ON public.exam_subjects FOR ALL USING (true) WITH CHECK (true);

-- Scores policies
CREATE POLICY "Allow all on scores" ON public.scores FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_students_class_section ON public.students(class, section);
CREATE INDEX idx_students_roll_number ON public.students(roll_number);
CREATE INDEX idx_exams_class_section ON public.exams(class, section);
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_scores_student_exam ON public.scores(student_id, exam_id);
CREATE INDEX idx_scores_exam_subject ON public.scores(exam_id, subject_id);

-- Insert some default subjects
INSERT INTO public.subjects (name, code, max_marks, passing_marks, description) VALUES
('Mathematics', 'MATH', 100, 40, 'Core Mathematics'),
('English', 'ENG', 100, 40, 'English Language and Literature'),
('Science', 'SCI', 100, 40, 'General Science'),
('Social Studies', 'SS', 100, 40, 'Social Studies and History'),
('Computer Science', 'CS', 100, 40, 'Computer Science and Programming');

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON public.scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION 2: 20250718175355 - Clear students
-- ============================================================================

-- Remove all existing students from the database
DELETE FROM public.students;

-- ============================================================================
-- MIGRATION 3: 20250719143723 - Add teacher auth and more subjects
-- ============================================================================

-- Add username field to teachers table for authentication
ALTER TABLE public.teachers ADD COLUMN username text UNIQUE;

-- Ensure we have all required subjects in the subjects table
INSERT INTO public.subjects (name, code, max_marks, passing_marks, description) VALUES
('Physics', 'PHY', 100, 40, 'Physics subject'),
('Biology', 'BIO', 100, 40, 'Biology subject'),
('Chemistry', 'CHE', 100, 40, 'Chemistry subject'),
('Mathematics', 'MAT', 100, 40, 'Mathematics subject'),
('History', 'HIS', 100, 40, 'History subject'),
('Civics', 'CIV', 100, 40, 'Civics subject'),
('Kiswahili', 'KIS', 100, 40, 'Kiswahili subject'),
('English', 'ENG', 100, 40, 'English subject'),
('Geography', 'GEO', 100, 40, 'Geography subject'),
('Commerce', 'COM', 100, 40, 'Commerce subject'),
('Book Keeping', 'BKP', 100, 40, 'Book Keeping subject'),
('Information and Computer Studies(ICT)', 'ICT', 100, 40, 'Information and Computer Studies subject'),
('Agriculture', 'AGR', 100, 40, 'Agriculture subject')
ON CONFLICT (code) DO NOTHING;

-- Create teacher_auth table for storing teacher login credentials
CREATE TABLE public.teacher_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on teacher_auth table
ALTER TABLE public.teacher_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_auth
CREATE POLICY "Teachers can view their own auth" 
ON public.teacher_auth 
FOR SELECT 
USING (teacher_id = auth.uid());   ---- This whole create policy has failed to run in the sql.------------------------------------

CREATE POLICY "Allow teacher auth creation during signup" 
ON public.teacher_auth 
FOR INSERT 
WITH CHECK (true);

-- Add updated_at trigger for teacher_auth
CREATE TRIGGER update_teacher_auth_updated_at
BEFORE UPDATE ON public.teacher_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update students table to make roll_number, guardian, and guardian_contact optional
ALTER TABLE public.students ALTER COLUMN roll_number DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN guardian DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN guardian_contact DROP NOT NULL;

-- ============================================================================
-- MIGRATION 4: 20250721140522 - Update password encoding
-- ============================================================================

-- Update existing teacher auth records to use simple base64 encoding
UPDATE teacher_auth 
SET password_hash = encode('password123'::bytea, 'base64') 
WHERE username IN ('Dame', 'Julius');

-- ============================================================================
-- MIGRATION 5: 20250721142112 - Fix password hash
-- ============================================================================

-- Update existing teacher auth records to use the correct btoa encoding
UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM=' 
WHERE username = 'Dame';

UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM=' 
WHERE username = 'Julius';

-- ============================================================================
-- MIGRATION 6: 20250725155826 - Update password hash lowercase
-- ============================================================================

-- Update the password hash to use Base64 encoding to match frontend
-- Password 'password123' encoded with btoa() = 'cGFzc3dvcmQxMjM='
UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM='
WHERE username = 'dame';

-- ============================================================================
-- MIGRATION 7: 20250805093731 - Add foreign keys and constraints
-- ============================================================================

-- Add missing foreign key constraints for better data integrity

-- Add foreign key constraints for scores table
ALTER TABLE public.scores 
ADD CONSTRAINT scores_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add foreign key constraints for exam_subjects table
ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE; -----------Didn't run----------------------------------

ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;    -----------Didn't run----------------------------------

-- Add foreign key constraints for teacher_subjects table  
ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;  -----------Didn't run----------------------------------

ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;  -----------Didn't run----------------------------------

-- Add foreign key constraint for teacher_auth table
ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE; -----------Didn't run----------------------------------

-- Add foreign key constraint for exams table created_by field
ALTER TABLE public.exams 
ADD CONSTRAINT exams_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.teachers(id) ON DELETE SET NULL;  -----------Didn't run----------------------------------

-- Add triggers for updated_at columns (skip if already exists)
-- CREATE TRIGGER update_students_updated_at ...
-- CREATE TRIGGER update_scores_updated_at ...
-- CREATE TRIGGER update_teacher_auth_updated_at ...

-- Add unique constraints to prevent duplicates
ALTER TABLE public.students 
ADD CONSTRAINT students_roll_number_class_section_unique 
UNIQUE (roll_number, class, section);

ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_code_unique 
UNIQUE (code);

ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_email_unique 
UNIQUE (email);

ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_username_unique 
UNIQUE (username);

ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_teacher_id_unique 
UNIQUE (teacher_id);

-- Add constraint to prevent duplicate teacher-subject assignments
ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_teacher_subject_unique 
UNIQUE (teacher_id, subject_id);

-- Add constraint to prevent duplicate exam-subject assignments  
ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_exam_subject_unique 
UNIQUE (exam_id, subject_id);

-- Add constraint to prevent duplicate score entries
ALTER TABLE public.scores 
ADD CONSTRAINT scores_student_exam_subject_unique 
UNIQUE (student_id, exam_id, subject_id);

-- ============================================================================
-- MIGRATION 8: 20250805093839 - Additional unique constraints and triggers
-- ============================================================================

-- Note: Most of these may fail if already added in migration 7
-- Add unique constraints that are missing
-- ALTER TABLE public.subjects ADD CONSTRAINT subjects_code_unique UNIQUE (code);
-- ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_unique UNIQUE (email);

-- ============================================================================
-- MIGRATION 9: 20250805094127 - Add performance indexes
-- ============================================================================

-- Add performance indexes that are missing
CREATE INDEX IF NOT EXISTS idx_students_class_section 
ON public.students (class, section);

CREATE INDEX IF NOT EXISTS idx_scores_student_id 
ON public.scores (student_id);

CREATE INDEX IF NOT EXISTS idx_scores_exam_id 
ON public.scores (exam_id);

CREATE INDEX IF NOT EXISTS idx_scores_subject_id 
ON public.scores (subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id 
ON public.teacher_subjects (teacher_id);

CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id 
ON public.exam_subjects (exam_id);

CREATE INDEX IF NOT EXISTS idx_exams_class_section 
ON public.exams (class, section);

CREATE INDEX IF NOT EXISTS idx_exams_status 
ON public.exams (status);

CREATE INDEX IF NOT EXISTS idx_exams_start_date 
ON public.exams (start_date);

-- ============================================================================
-- MIGRATION 10: 20250805094257 - Add template_data table
-- ============================================================================

-- Rename date_of_birth to registration_date in students table
ALTER TABLE public.students 
RENAME COLUMN date_of_birth TO registration_date;

-- Create template_data table for storing template download codes and information
CREATE TABLE public.template_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  template_code text NOT NULL UNIQUE,
  sample_data jsonb NOT NULL,
  filename text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on template_data table
ALTER TABLE public.template_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all on template_data" 
ON public.template_data 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert sample template data for student import
INSERT INTO public.template_data (type, template_code, sample_data, filename, description) VALUES 
('student_import', 'STU_TEMPLATE_001', 
'[
  {
    "name": "John Doe",
    "registrationDate": "2024-01-15",
    "class": "Form 1",
    "section": "A",
    "rollNumber": "001",
    "guardian": "Jane Doe",
    "guardianContact": "+1234567890"
  },
  {
    "name": "Mary Smith",
    "registrationDate": "2024-03-22",
    "class": "Form 1",
    "section": "B",
    "rollNumber": "002",
    "guardian": "John Smith",
    "guardianContact": "+1234567891"
  }
]'::jsonb,
'student_template.xlsx',
'Template for importing student data via Excel');

-- Add trigger for updated_at
CREATE TRIGGER update_template_data_updated_at
    BEFORE UPDATE ON public.template_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION 11: 20251001123838 - Add schools table
-- ============================================================================

-- Create schools table
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools policies - teachers can view their own school
CREATE POLICY "Teachers can view their school"
ON public.schools
FOR SELECT
USING (id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));  ----------- Failed to run -------------------------------

-- Add school_id to students table
ALTER TABLE public.students
ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_students_school_id ON public.students(school_id);

-- Update students RLS policies
DROP POLICY IF EXISTS "Allow all on students" ON public.students;

-- Teachers can view students from their school
CREATE POLICY "Teachers can view their school students"
ON public.students
FOR SELECT
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));  ----------- Failed to run -------------------------------

-- Teachers can insert students to their school
CREATE POLICY "Teachers can insert students to their school"
ON public.students
FOR INSERT
WITH CHECK (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));----------- Failed to run -------------------------------

-- Teachers can update students in their school
CREATE POLICY "Teachers can update their school students"
ON public.students
FOR UPDATE
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'))
WITH CHECK (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));----------- Failed to run -------------------------------

-- Teachers can delete students in their school
CREATE POLICY "Teachers can delete their school students"
ON public.students
FOR DELETE
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));----------- Failed to run -------------------------------

-- Add trigger for schools updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample schools
INSERT INTO public.schools (name, code, address, contact_email, contact_phone) VALUES
('Springfield High School', 'SHS001', '123 Main St, Springfield', 'admin@springfield.edu', '+1234567890'),
('Riverside Academy', 'RA002', '456 River Rd, Riverside', 'info@riverside.edu', '+0987654321');

-- ============================================================================
-- MIGRATION 12: 20251001124229 - Add teacher_profiles and security functions
-- ============================================================================

-- Drop the insecure policies first
DROP POLICY IF EXISTS "Teachers can view their school" ON public.schools;
DROP POLICY IF EXISTS "Teachers can view their school students" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students to their school" ON public.students;
DROP POLICY IF EXISTS "Teachers can update their school students" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete their school students" ON public.students;

-- Create teacher_profiles table to store school associations securely
CREATE TABLE public.teacher_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  department text,
  subjects text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);    --------------------- Failed to run ------------------------------------------------------------------------------

-- Enable RLS on teacher_profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY; ------------------- Failed to run --------------------------

-- Teachers can view their own profile
CREATE POLICY "Teachers can view own profile"
ON public.teacher_profiles
FOR SELECT
USING (auth.uid() = id);  ------------------- Failed to run -----------------------------------------------------------------

-- Teachers can insert their own profile during signup
CREATE POLICY "Teachers can insert own profile"
ON public.teacher_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);  ------------------- Failed to run -------------------------------------------------------------

-- Teachers can update their own profile
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles
FOR UPDATE
USING (auth.uid() = id);  ------------------- Failed to run -------------------------------------------------------------------

-- Create index for better performance
CREATE INDEX idx_teacher_profiles_school_id ON public.teacher_profiles(school_id);------------------- Failed to run -------------------------------------------------------------------

-- Create security definer function to get teacher's school_id
CREATE OR REPLACE FUNCTION public.get_teacher_school_id(_teacher_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id 
  FROM public.teacher_profiles 
  WHERE id = _teacher_id;
$$;------------------- Failed to run -------------------------------------------------------------------

-- Create security definer function to check if teacher belongs to same school as student
CREATE OR REPLACE FUNCTION public.teacher_can_access_student(_student_id uuid, _teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.students s
    JOIN public.teacher_profiles tp ON s.school_id = tp.school_id
    WHERE s.id = _student_id AND tp.id = _teacher_id
  );
$$;------------------- Failed to run -------------------------------------------------------------------

-- Now create secure RLS policies using the security definer functions

-- Schools policies
CREATE POLICY "Teachers can view their school"
ON public.schools
FOR SELECT
USING (id = public.get_teacher_school_id(auth.uid()));

-- Students policies
CREATE POLICY "Teachers can view their school students"
ON public.students
FOR SELECT
USING (school_id = public.get_teacher_school_id(auth.uid()));

CREATE POLICY "Teachers can insert students to their school"
ON public.students
FOR INSERT
WITH CHECK (school_id = public.get_teacher_school_id(auth.uid()));

CREATE POLICY "Teachers can update their school students"
ON public.students
FOR UPDATE
USING (school_id = public.get_teacher_school_id(auth.uid()))
WITH CHECK (school_id = public.get_teacher_school_id(auth.uid()));

CREATE POLICY "Teachers can delete their school students"
ON public.students
FOR DELETE
USING (school_id = public.get_teacher_school_id(auth.uid()));

-- Add trigger for teacher_profiles updated_at
CREATE TRIGGER update_teacher_profiles_updated_at
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a trigger to auto-create teacher profile from user_metadata after signup
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teacher_profiles (id, school_id, name, subjects)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::uuid,
    NEW.raw_user_meta_data->>'name',
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subjects'))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_teacher_created
AFTER INSERT ON auth.users
FOR EACH ROW
WHEN (NEW.raw_user_meta_data->>'role' = 'teacher')
EXECUTE FUNCTION public.handle_new_teacher();

-- ============================================================================
-- MIGRATION 13: 20251004105402 - Fix teacher profiles
-- ============================================================================

-- Fix missing teacher profiles for existing users
-- Insert teacher profiles for existing auth users who don't have profiles yet
INSERT INTO public.teacher_profiles (id, school_id, name, department, subjects)
SELECT 
  u.id,
  (SELECT id FROM public.schools LIMIT 1),
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'department',
  CASE 
    WHEN u.raw_user_meta_data->>'subjects' IS NOT NULL 
    THEN ARRAY[u.raw_user_meta_data->>'subjects']
    ELSE '{}'::text[]
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_profiles tp WHERE tp.id = u.id
); ------------------- Until here all of the Above failed to Run ------------------------------------------------------------------------------------------------------

-- Update the trigger function to properly handle school_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teacher_profiles (id, school_id, name, department, subjects)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'department',
    CASE 
      WHEN jsonb_typeof(NEW.raw_user_meta_data->'subjects') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subjects'))
      ELSE '{}'::text[]
    END
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- MIGRATION 14: 20251006145114 - Allow school creation during signup
-- ============================================================================

-- Allow anyone to insert new schools during signup
CREATE POLICY "Anyone can create schools during signup"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (true); ----------------------------------------- Failed to Run ----------------------------------------------------------------------------------------

-- Allow anyone to view all schools (needed for signup dropdown)
DROP POLICY IF EXISTS "Teachers can view their school" ON public.schools;

CREATE POLICY "Anyone can view schools"
ON public.schools
FOR SELECT
TO authenticated
USING (true);    ----------------------------------------- Failed to Run ----------------------------------------------------------------------------------------

-- ============================================================================
-- MIGRATION 15: 20251006150211 - Fix schools policies for public access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create schools during signup" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;

-- Allow unauthenticated users to create schools during signup
CREATE POLICY "Anyone can create schools during signup"
ON public.schools
FOR INSERT
TO public
WITH CHECK (true);

-- Allow everyone to view schools for the signup dropdown
CREATE POLICY "Anyone can view schools"
ON public.schools
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- MIGRATION 16: 20251107100647 - Add exam PDF storage
-- ============================================================================

-- Create storage bucket for exam PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-pdfs', 'exam-pdfs', false); -------------------------------------------------- Failed to run ---------------------------------------------------------------------

-- Add pdf_file_path column to exams table
ALTER TABLE public.exams
ADD COLUMN pdf_file_path text;

-- Create RLS policies for exam-pdfs bucket
CREATE POLICY "Teachers can view exam PDFs from their school"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.teacher_profiles tp ON e.created_by = tp.id
    WHERE 
      tp.id = auth.uid() AND
      storage.filename(storage.objects.name) = e.pdf_file_path
  )
);

CREATE POLICY "Teachers can upload exam PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-pdfs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Teachers can update their exam PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.teacher_profiles tp ON e.created_by = tp.id
    WHERE 
      tp.id = auth.uid() AND
      storage.filename(storage.objects.name) = e.pdf_file_path
  )
);

CREATE POLICY "Teachers can delete their exam PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.teacher_profiles tp ON e.created_by = tp.id
    WHERE 
      tp.id = auth.uid() AND
      storage.filename(storage.objects.name) = e.pdf_file_path
  )
); ------------------------------ From here upward failed to run -------------------------------------------------------------

-- ============================================================================
-- MIGRATION 17: 20251107105227 - Refactor exam types and add exam_date
-- ============================================================================

-- First, add new columns before modifying enums
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Populate exam_date with start_date if it exists
UPDATE public.exams 
SET exam_date = start_date 
WHERE exam_date IS NULL AND start_date IS NOT NULL;

-- Set default for any remaining null values
UPDATE public.exams 
SET exam_date = CURRENT_DATE 
WHERE exam_date IS NULL;

-- Make exam_date NOT NULL
ALTER TABLE public.exams 
  ALTER COLUMN exam_date SET NOT NULL;

-- Create new type enums with different names first
CREATE TYPE exam_term_new AS ENUM ('first', 'second');
CREATE TYPE exam_type_new AS ENUM ('test', 'practical', 'full-examination');

-- Add temporary columns with new types
ALTER TABLE public.exams 
  ADD COLUMN term_new exam_term_new,
  ADD COLUMN type_new exam_type_new;

-- Migrate data to new columns
UPDATE public.exams 
SET term_new = CASE 
  WHEN term::text = 'first' THEN 'first'::exam_term_new
  WHEN term::text = 'second' THEN 'second'::exam_term_new
  WHEN term::text = 'third' THEN 'first'::exam_term_new
END;

UPDATE public.exams 
SET type_new = CASE 
  WHEN type::text IN ('unit-test', 'midterm', 'assignment') THEN 'test'::exam_type_new
  WHEN type::text = 'final' THEN 'full-examination'::exam_type_new
  WHEN type::text = 'practical' THEN 'practical'::exam_type_new
  ELSE 'test'::exam_type_new
END;

-- Drop old columns and enums
ALTER TABLE public.exams 
  DROP COLUMN term,
  DROP COLUMN type,
  DROP COLUMN start_date,
  DROP COLUMN end_date;

DROP TYPE IF EXISTS exam_term CASCADE;
DROP TYPE IF EXISTS exam_type CASCADE;

-- Rename new types to original names
ALTER TYPE exam_term_new RENAME TO exam_term;
ALTER TYPE exam_type_new RENAME TO exam_type;

-- Rename new columns to original names
ALTER TABLE public.exams 
  RENAME COLUMN term_new TO term;
ALTER TABLE public.exams 
  RENAME COLUMN type_new TO type;

-- Make sure the columns are NOT NULL
ALTER TABLE public.exams 
  ALTER COLUMN term SET NOT NULL,
  ALTER COLUMN type SET NOT NULL;

-- ============================================================================
-- MIGRATION 18: 20251121140627 - Add user roles and exam events
-- ============================================================================

-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
); ----------------------------- failed to Run -------------------------------------------------------------------

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create exam_events table
CREATE TABLE public.exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  academic_year TEXT NOT NULL,
  term exam_term NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status exam_status DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on exam_events
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for exam_events
CREATE POLICY "Everyone can view exam events"
  ON public.exam_events
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert exam events"
  ON public.exam_events
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exam events"
  ON public.exam_events
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exam events"
  ON public.exam_events
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add exam_event_id to exams table (nullable for standalone exams)
ALTER TABLE public.exams
ADD COLUMN exam_event_id UUID REFERENCES public.exam_events(id) ON DELETE CASCADE;

-- Add teacher_id to exams table to track who created each exam
ALTER TABLE public.exams
ADD COLUMN teacher_id UUID REFERENCES auth.users(id);

-- Update RLS policies for exams to handle event-based access
DROP POLICY IF EXISTS "Allow all on exams" ON public.exams;

-- Teachers can view their own exams or all exams if admin
CREATE POLICY "Teachers can view own exams or admins view all"
  ON public.exams
  FOR SELECT
  USING (
    teacher_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR exam_event_id IS NOT NULL
  );

-- Teachers can insert their own exams
CREATE POLICY "Teachers can insert exams"
  ON public.exams
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Teachers can update only their own exams, admins can update all
CREATE POLICY "Teachers can update own exams"
  ON public.exams
  FOR UPDATE
  USING (
    teacher_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Teachers can delete only their own exams, admins can delete all
CREATE POLICY "Teachers can delete own exams"
  ON public.exams
  FOR DELETE
  USING (
    teacher_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_exam_events_updated_at
  BEFORE UPDATE ON public.exam_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION 19: 20251124130316 - Fix exam RLS and add exam_subjects PDF support
-- ============================================================================

-- Fix RLS policies for exams table to allow teacher inserts
DROP POLICY IF EXISTS "Teachers can insert exams" ON public.exams;
CREATE POLICY "Teachers can insert exams" 
ON public.exams 
FOR INSERT 
WITH CHECK (
  teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add pdf_file_path column to exam_subjects table
ALTER TABLE public.exam_subjects 
ADD COLUMN IF NOT EXISTS pdf_file_path text;

-- Update exam_subjects RLS policies for subject-specific PDF uploads
DROP POLICY IF EXISTS "Allow all on exam_subjects" ON public.exam_subjects;

-- Teachers can view exam subjects for their exams or admin can view all
CREATE POLICY "Teachers can view exam subjects" 
ON public.exam_subjects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subjects.exam_id 
    AND (exams.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Teachers can insert exam subjects for their exams
CREATE POLICY "Teachers can insert exam subjects" 
ON public.exam_subjects 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subjects.exam_id 
    AND (exams.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Teachers can update exam subjects for their exams
CREATE POLICY "Teachers can update exam subjects" 
ON public.exam_subjects 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subjects.exam_id 
    AND (exams.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Teachers can delete exam subjects for their exams
CREATE POLICY "Teachers can delete exam subjects" 
ON public.exam_subjects 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subjects.exam_id 
    AND (exams.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ============================================================================
-- MIGRATION 20: 20251125062400 - Add teacher_id foreign key to exams
-- ============================================================================

-- Populate teacher_id from created_by if not already set
UPDATE public.exams SET teacher_id = created_by WHERE teacher_id IS NULL AND created_by IS NOT NULL;

-- Add foreign key constraint (if not already exists)
-- ALTER TABLE public.exams 
-- ADD CONSTRAINT exams_teacher_id_fkey 
-- FOREIGN KEY (teacher_id) 
-- REFERENCES public.teachers(id)
-- ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION 21: 20251125062412 - Ensure pdf_file_path on exam_subjects
-- ============================================================================

ALTER TABLE public.exam_subjects 
ADD COLUMN IF NOT EXISTS pdf_file_path text;

-- ============================================================================
-- ADDITIONAL: Create profiles table for user management
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id),
  role text NOT NULL DEFAULT 'teacher',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile."
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile."
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Add students policies using profiles for school access
CREATE POLICY "Teachers can view students from their school."
ON public.students
FOR SELECT
USING (school_id = (SELECT school_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Teachers can insert students into their school."
ON public.students
FOR INSERT
WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Teachers can update students within their school."
ON public.students
FOR UPDATE
USING (school_id = (SELECT school_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Teachers can delete students from their school."
ON public.students
FOR DELETE
USING (school_id = (SELECT school_id FROM profiles WHERE profiles.id = auth.uid())); ---------- Failed to run ----------------------

-- ============================================================================
-- END OF COMBINED MIGRATIONS
-- ============================================================================

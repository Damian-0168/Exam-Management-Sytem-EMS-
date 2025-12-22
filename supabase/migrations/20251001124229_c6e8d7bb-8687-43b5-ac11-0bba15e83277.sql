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
);

-- Enable RLS on teacher_profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own profile
CREATE POLICY "Teachers can view own profile"
ON public.teacher_profiles
FOR SELECT
USING (auth.uid() = id);

-- Teachers can insert their own profile during signup
CREATE POLICY "Teachers can insert own profile"
ON public.teacher_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Teachers can update their own profile
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create index for better performance
CREATE INDEX idx_teacher_profiles_school_id ON public.teacher_profiles(school_id);

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
$$;

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
$$;

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
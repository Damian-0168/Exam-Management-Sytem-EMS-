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
USING (id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));

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
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));

-- Teachers can insert students to their school
CREATE POLICY "Teachers can insert students to their school"
ON public.students
FOR INSERT
WITH CHECK (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));

-- Teachers can update students in their school
CREATE POLICY "Teachers can update their school students"
ON public.students
FOR UPDATE
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'))
WITH CHECK (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));

-- Teachers can delete students in their school
CREATE POLICY "Teachers can delete their school students"
ON public.students
FOR DELETE
USING (school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id'));

-- Add trigger for schools updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample schools
INSERT INTO public.schools (name, code, address, contact_email, contact_phone) VALUES
('Springfield High School', 'SHS001', '123 Main St, Springfield', 'admin@springfield.edu', '+1234567890'),
('Riverside Academy', 'RA002', '456 River Rd, Riverside', 'info@riverside.edu', '+0987654321');
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
USING (teacher_id = auth.uid());

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
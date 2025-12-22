
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
-- For now, allowing all operations for development purposes

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

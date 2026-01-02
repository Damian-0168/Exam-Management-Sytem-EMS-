-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

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
    OR exam_event_id IS NOT NULL  -- Event exams visible to all
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

-- Insert default admin role for existing users (optional - adjust as needed)
-- This can be run manually by the admin to assign roles
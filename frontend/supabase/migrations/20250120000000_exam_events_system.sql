"-- Create Exam Events table (Container for full examinations)
CREATE TABLE IF NOT EXISTS public.exam_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('first', 'second')),
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Subject Exams table (Individual teacher uploads)
CREATE TABLE IF NOT EXISTS public.subject_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_event_id UUID REFERENCES public.exam_events(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('full-examination', 'test', 'practical')),
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  duration_minutes INTEGER,
  max_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 40,
  instructions TEXT,
  pdf_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('first', 'second')),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- For full-examination type, exam_event_id must be set
  -- For test/practical, exam_event_id should be null
  CONSTRAINT exam_event_requirement CHECK (
    (exam_type = 'full-examination' AND exam_event_id IS NOT NULL) OR
    (exam_type IN ('test', 'practical') AND exam_event_id IS NULL)
  ),
  
  -- Unique constraint: one subject exam per teacher per event (for full-examination)
  UNIQUE NULLS NOT DISTINCT (exam_event_id, subject_id, teacher_id)
);

-- Enable Row Level Security
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_events
-- Teachers can view exam events in their school
CREATE POLICY \"Teachers can view exam events in their school\"
  ON public.exam_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = exam_events.school_id
    )
  );

-- Only admins/authorized users can create exam events (will be refined later)
CREATE POLICY \"Allow insert exam events\"
  ON public.exam_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = exam_events.school_id
    )
  );

-- Allow update of own created events
CREATE POLICY \"Allow update exam events\"
  ON public.exam_events FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for subject_exams
-- Teachers can view all subject exams in their school (for preview)
CREATE POLICY \"Teachers can view subject exams in their school\"
  ON public.subject_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = subject_exams.school_id
    )
  );

-- Teachers can insert their own subject exams
CREATE POLICY \"Teachers can insert their own subject exams\"
  ON public.subject_exams FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = subject_exams.school_id
    )
  );

-- Teachers can update their own subject exams
CREATE POLICY \"Teachers can update their own subject exams\"
  ON public.subject_exams FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teachers can delete their own subject exams
CREATE POLICY \"Teachers can delete their own subject exams\"
  ON public.subject_exams FOR DELETE
  USING (teacher_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX idx_exam_events_school_id ON public.exam_events(school_id);
CREATE INDEX idx_exam_events_status ON public.exam_events(status);
CREATE INDEX idx_exam_events_class_section ON public.exam_events(class, section);

CREATE INDEX idx_subject_exams_event_id ON public.subject_exams(exam_event_id);
CREATE INDEX idx_subject_exams_teacher_id ON public.subject_exams(teacher_id);
CREATE INDEX idx_subject_exams_subject_id ON public.subject_exams(subject_id);
CREATE INDEX idx_subject_exams_school_id ON public.subject_exams(school_id);
CREATE INDEX idx_subject_exams_type ON public.subject_exams(exam_type);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_exam_events_updated_at
  BEFORE UPDATE ON public.exam_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_exams_updated_at
  BEFORE UPDATE ON public.subject_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for exam PDFs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-pdfs', 'exam-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exam PDFs
CREATE POLICY \"Teachers can upload exam PDFs\"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exam-pdfs' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY \"Anyone can view exam PDFs\"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exam-pdfs');

CREATE POLICY \"Teachers can update their own exam PDFs\"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exam-pdfs' AND owner = auth.uid());

CREATE POLICY \"Teachers can delete their own exam PDFs\"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exam-pdfs' AND owner = auth.uid());
"
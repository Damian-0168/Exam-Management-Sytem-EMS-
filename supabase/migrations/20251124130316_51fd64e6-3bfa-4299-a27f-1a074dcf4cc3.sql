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
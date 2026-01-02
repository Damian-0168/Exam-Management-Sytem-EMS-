-- Create storage bucket for exam PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-pdfs', 'exam-pdfs', false);

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
);
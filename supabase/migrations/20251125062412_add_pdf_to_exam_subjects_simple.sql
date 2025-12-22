/*
  # Add PDF Support to Exam Subjects

  1. New Columns
    - `pdf_file_path` (text) - Path to the PDF file in storage for each exam subject

  2. Security
    - Teachers can manage PDFs only for exams they created
    - Admins can manage PDFs for all exams
*/

ALTER TABLE public.exam_subjects 
ADD COLUMN IF NOT EXISTS pdf_file_path text;

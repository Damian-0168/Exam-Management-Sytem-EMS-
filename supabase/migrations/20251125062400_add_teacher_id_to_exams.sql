/*
  # Add teacher_id to Exams Table

  1. New Columns
    - `teacher_id` (uuid) - Reference to the teacher who created the exam

  2. Notes
    - Aligns with application code that expects teacher_id
    - Will be populated from created_by during initial migration
*/

ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS teacher_id uuid;

-- Populate teacher_id from created_by if not already set
UPDATE public.exams SET teacher_id = created_by WHERE teacher_id IS NULL AND created_by IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.exams 
ADD CONSTRAINT exams_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES public.teachers(id)
ON DELETE SET NULL;

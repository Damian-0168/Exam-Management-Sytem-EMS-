-- First, add new columns before modifying enums
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Populate exam_date with start_date if it exists
UPDATE public.exams 
SET exam_date = start_date 
WHERE exam_date IS NULL AND start_date IS NOT NULL;

-- Set default for any remaining null values
UPDATE public.exams 
SET exam_date = CURRENT_DATE 
WHERE exam_date IS NULL;

-- Make exam_date NOT NULL
ALTER TABLE public.exams 
  ALTER COLUMN exam_date SET NOT NULL;

-- Create new type enums with different names first
CREATE TYPE exam_term_new AS ENUM ('first', 'second');
CREATE TYPE exam_type_new AS ENUM ('test', 'practical', 'full-examination');

-- Add temporary columns with new types
ALTER TABLE public.exams 
  ADD COLUMN term_new exam_term_new,
  ADD COLUMN type_new exam_type_new;

-- Migrate data to new columns
UPDATE public.exams 
SET term_new = CASE 
  WHEN term::text = 'first' THEN 'first'::exam_term_new
  WHEN term::text = 'second' THEN 'second'::exam_term_new
  WHEN term::text = 'third' THEN 'first'::exam_term_new -- Convert third to first
END;

UPDATE public.exams 
SET type_new = CASE 
  WHEN type::text IN ('unit-test', 'midterm', 'assignment') THEN 'test'::exam_type_new
  WHEN type::text = 'final' THEN 'full-examination'::exam_type_new
  WHEN type::text = 'practical' THEN 'practical'::exam_type_new
  ELSE 'test'::exam_type_new
END;

-- Drop old columns and enums
ALTER TABLE public.exams 
  DROP COLUMN term,
  DROP COLUMN type,
  DROP COLUMN start_date,
  DROP COLUMN end_date;

DROP TYPE IF EXISTS exam_term CASCADE;
DROP TYPE IF EXISTS exam_type CASCADE;

-- Rename new types to original names
ALTER TYPE exam_term_new RENAME TO exam_term;
ALTER TYPE exam_type_new RENAME TO exam_type;

-- Rename new columns to original names
ALTER TABLE public.exams 
  RENAME COLUMN term_new TO term;
ALTER TABLE public.exams 
  RENAME COLUMN type_new TO type;

-- Make sure the columns are NOT NULL
ALTER TABLE public.exams 
  ALTER COLUMN term SET NOT NULL,
  ALTER COLUMN type SET NOT NULL;
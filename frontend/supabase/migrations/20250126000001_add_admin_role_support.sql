-- ============================================================================
-- Admin Role Support Migration
-- Add role field to teacher_profiles and update RLS policies
-- ============================================================================

-- 1. Add role column to teacher_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.teacher_profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'teacher'
    CHECK (role IN ('teacher', 'admin', 'super-admin'));
    
    CREATE INDEX idx_teacher_profiles_role ON public.teacher_profiles(role);
  END IF;
END $$;

-- 2. Update existing RLS policies for teacher_profiles to support admin access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;

-- Create new policies with admin support

-- View policy: Teachers see own profile, Admins see all in their school
CREATE POLICY "Users can view profiles in their school"
  ON public.teacher_profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = teacher_profiles.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );

-- Insert policy: Anyone authenticated can create their profile
CREATE POLICY "Users can insert own profile"
  ON public.teacher_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update policy: Teachers update own, Admins update any in their school
CREATE POLICY "Users can update profiles in their school"
  ON public.teacher_profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = teacher_profiles.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );

-- Delete policy: Only admins can delete users
CREATE POLICY "Admins can delete profiles in their school"
  ON public.teacher_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = teacher_profiles.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );


-- 3. Update RLS policies for exams table

-- Drop existing exam policies
DROP POLICY IF EXISTS "Allow all on exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers can view exams" ON public.exams;

-- Create new exam policies with admin support
CREATE POLICY "Users can view exams in their school"
  ON public.exams FOR SELECT
  USING (
    -- Teachers see all exams in their school
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = exams.school_id
    )
  );

CREATE POLICY "Users can create exams"
  ON public.exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = exams.school_id
    )
  );

CREATE POLICY "Users can update exams in their school"
  ON public.exams FOR UPDATE
  USING (
    -- Teacher can update own exams, Admin can update any in their school
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = exams.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "Users can delete exams in their school"
  ON public.exams FOR DELETE
  USING (
    -- Teacher can delete own exams, Admin can delete any in their school
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = exams.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );


-- 4. Update RLS policies for exam_subjects table

DROP POLICY IF EXISTS "Allow all on exam_subjects" ON public.exam_subjects;

CREATE POLICY "Users can view exam_subjects in their school"
  ON public.exam_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.teacher_profiles tp ON tp.school_id = e.school_id
      WHERE e.id = exam_subjects.exam_id AND tp.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage exam_subjects"
  ON public.exam_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.teacher_profiles tp ON tp.school_id = e.school_id
      WHERE e.id = exam_subjects.exam_id 
        AND tp.id = auth.uid()
        AND (e.created_by = auth.uid() OR tp.role IN ('admin', 'super-admin'))
    )
  );


-- 5. Update RLS policies for exam_events table

DROP POLICY IF EXISTS "Allow insert exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Allow update exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Teachers can view exam events in their school" ON public.exam_events;

CREATE POLICY "Users can view exam events in their school"
  ON public.exam_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.school_id = exam_events.school_id
    )
  );

CREATE POLICY "Users can create exam events"
  ON public.exam_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = exam_events.school_id
        AND tp.role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Users can update exam events in their school"
  ON public.exam_events FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = exam_events.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "Admins can delete exam events"
  ON public.exam_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() 
        AND tp.school_id = exam_events.school_id
        AND tp.role IN ('admin', 'super-admin')
    )
  );


-- 6. Update RLS policies for students table

DROP POLICY IF EXISTS "Allow all on students" ON public.students;

CREATE POLICY "Users can view students in their school"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid()
      -- Assuming students have school_id or we check via class
    )
  );

CREATE POLICY "Users can manage students"
  ON public.students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid()
    )
  );


-- 7. Update RLS policies for scores table

DROP POLICY IF EXISTS "Allow all on scores" ON public.scores;

CREATE POLICY "Users can view scores in their school"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage scores"
  ON public.scores FOR ALL
  USING (
    auth.uid() = teacher_id OR
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.id = auth.uid() AND tp.role IN ('admin', 'super-admin')
    )
  );


-- 8. Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid, check_school_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teacher_profiles
    WHERE id = user_id 
      AND school_id = check_school_id
      AND role IN ('admin', 'super-admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.teacher_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Migration Complete
-- ============================================================================

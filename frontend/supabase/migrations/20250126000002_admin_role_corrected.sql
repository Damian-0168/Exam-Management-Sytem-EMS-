-- ============================================================================
-- CORRECTED: Admin Role Support Migration
-- Fixes circular references, missing columns, and improves security
-- ============================================================================

-- ============================================================================
-- PART 1: Add Missing Columns
-- ============================================================================

-- 1.1 Add role column to teacher_profiles (if not exists)
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

-- 1.2 Add school_id to students table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'school_id'
  ) THEN
    -- First add the column as nullable
    ALTER TABLE public.students ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    
    -- If there's a default school, set it for existing records
    -- Otherwise, you'll need to manually update these
    UPDATE public.students 
    SET school_id = (SELECT id FROM public.schools LIMIT 1)
    WHERE school_id IS NULL;
    
    -- Now make it NOT NULL if we have data
    -- ALTER TABLE public.students ALTER COLUMN school_id SET NOT NULL;
    
    CREATE INDEX idx_students_school_id ON public.students(school_id);
  END IF;
END $$;

-- 1.3 Ensure exam_events has school_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_events' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exam_events ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    CREATE INDEX idx_exam_events_school_id ON public.exam_events(school_id);
  END IF;
END $$;

-- 1.4 Ensure exams has school_id and teacher_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exams' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exams ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    CREATE INDEX idx_exams_school_id ON public.exams(school_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exams' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE public.exams ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX idx_exams_teacher_id ON public.exams(teacher_id);
  END IF;
END $$;


-- ============================================================================
-- PART 2: Create Helper Functions (NO Circular Dependencies)
-- ============================================================================

-- Function to check if a user is an admin in a specific school
CREATE OR REPLACE FUNCTION public.is_school_admin(user_id uuid, check_school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_profiles
    WHERE id = user_id 
      AND school_id = check_school_id
      AND role IN ('admin', 'super-admin')
  );
$$;

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM public.teacher_profiles WHERE id = user_id LIMIT 1;
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(role, 'teacher') FROM public.teacher_profiles WHERE id = user_id LIMIT 1;
$$;


-- ============================================================================
-- PART 3: Update RLS Policies for teacher_profiles
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can update profiles in their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles in their school" ON public.teacher_profiles;

-- Create new policies using helper functions (no circular references)
CREATE POLICY "teacher_profiles_select"
  ON public.teacher_profiles FOR SELECT
  USING (
    -- Users can view their own profile
    id = auth.uid()
    OR
    -- Admins can view all profiles in their school
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "teacher_profiles_insert"
  ON public.teacher_profiles FOR INSERT
  WITH CHECK (
    -- Users can only insert their own profile
    id = auth.uid()
  );

CREATE POLICY "teacher_profiles_update"
  ON public.teacher_profiles FOR UPDATE
  USING (
    -- Users can update their own profile
    id = auth.uid()
    OR
    -- Admins can update profiles in their school
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "teacher_profiles_delete"
  ON public.teacher_profiles FOR DELETE
  USING (
    -- Only admins can delete profiles in their school
    public.is_school_admin(auth.uid(), school_id)
  );


-- ============================================================================
-- PART 4: Update RLS Policies for exams
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on exams" ON public.exams;
DROP POLICY IF EXISTS "Users can view exams in their school" ON public.exams;
DROP POLICY IF EXISTS "Users can create exams" ON public.exams;
DROP POLICY IF EXISTS "Users can update exams in their school" ON public.exams;
DROP POLICY IF EXISTS "Users can delete exams in their school" ON public.exams;

CREATE POLICY "exams_select"
  ON public.exams FOR SELECT
  USING (
    -- Users can view exams in their school
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "exams_insert"
  ON public.exams FOR INSERT
  WITH CHECK (
    -- Users can create exams in their school
    school_id = public.get_user_school_id(auth.uid())
    AND teacher_id = auth.uid()
  );

CREATE POLICY "exams_update"
  ON public.exams FOR UPDATE
  USING (
    -- Teachers can update their own exams
    teacher_id = auth.uid()
    OR
    -- Admins can update any exam in their school
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "exams_delete"
  ON public.exams FOR DELETE
  USING (
    -- Teachers can delete their own exams
    teacher_id = auth.uid()
    OR
    -- Admins can delete any exam in their school
    public.is_school_admin(auth.uid(), school_id)
  );


-- ============================================================================
-- PART 5: Update RLS Policies for exam_subjects
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on exam_subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "Users can view exam_subjects in their school" ON public.exam_subjects;
DROP POLICY IF EXISTS "Users can manage exam_subjects" ON public.exam_subjects;

CREATE POLICY "exam_subjects_select"
  ON public.exam_subjects FOR SELECT
  USING (
    -- Users can view exam_subjects for exams in their school
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND e.school_id = public.get_user_school_id(auth.uid())
    )
  );

CREATE POLICY "exam_subjects_insert"
  ON public.exam_subjects FOR INSERT
  WITH CHECK (
    -- Users can add subjects to exams they own or if they're admin
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND (e.teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), e.school_id))
    )
  );

CREATE POLICY "exam_subjects_update"
  ON public.exam_subjects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND (e.teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), e.school_id))
    )
  );

CREATE POLICY "exam_subjects_delete"
  ON public.exam_subjects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND (e.teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), e.school_id))
    )
  );


-- ============================================================================
-- PART 6: Update RLS Policies for exam_events
-- ============================================================================

DROP POLICY IF EXISTS "Allow insert exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Allow update exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Teachers can view exam events in their school" ON public.exam_events;
DROP POLICY IF EXISTS "Users can view exam events in their school" ON public.exam_events;
DROP POLICY IF EXISTS "Users can create exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Users can update exam events in their school" ON public.exam_events;
DROP POLICY IF EXISTS "Admins can delete exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Everyone can view exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Admins can insert exam events" ON public.exam_events;
DROP POLICY IF EXISTS "Admins can update exam events" ON public.exam_events;

CREATE POLICY "exam_events_select"
  ON public.exam_events FOR SELECT
  USING (
    -- Users can view exam events in their school
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "exam_events_insert"
  ON public.exam_events FOR INSERT
  WITH CHECK (
    -- Users can create exam events in their school
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "exam_events_update"
  ON public.exam_events FOR UPDATE
  USING (
    -- Exam creators or admins can update
    created_by = auth.uid()
    OR
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "exam_events_delete"
  ON public.exam_events FOR DELETE
  USING (
    -- Only admins can delete exam events
    public.is_school_admin(auth.uid(), school_id)
  );


-- ============================================================================
-- PART 7: Update RLS Policies for students
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on students" ON public.students;
DROP POLICY IF EXISTS "Users can view students in their school" ON public.students;
DROP POLICY IF EXISTS "Users can manage students" ON public.students;

CREATE POLICY "students_select"
  ON public.students FOR SELECT
  USING (
    -- Users can view students in their school
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "students_insert"
  ON public.students FOR INSERT
  WITH CHECK (
    -- Users can add students to their school
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "students_update"
  ON public.students FOR UPDATE
  USING (
    -- Teachers can update students in their school
    -- Admins have full access
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "students_delete"
  ON public.students FOR DELETE
  USING (
    -- Only admins can delete students
    public.is_school_admin(auth.uid(), school_id)
  );


-- ============================================================================
-- PART 8: Update RLS Policies for scores
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on scores" ON public.scores;
DROP POLICY IF EXISTS "Users can view scores in their school" ON public.scores;
DROP POLICY IF EXISTS "Users can manage scores" ON public.scores;

CREATE POLICY "scores_select"
  ON public.scores FOR SELECT
  USING (
    -- Users can view scores for exams in their school
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND e.school_id = public.get_user_school_id(auth.uid())
    )
  );

CREATE POLICY "scores_insert"
  ON public.scores FOR INSERT
  WITH CHECK (
    -- Teachers can enter scores, admins can too
    (teacher_id = auth.uid() OR 
     EXISTS (
       SELECT 1 FROM public.exams e
       WHERE e.id = scores.exam_id 
         AND public.is_school_admin(auth.uid(), e.school_id)
     ))
  );

CREATE POLICY "scores_update"
  ON public.scores FOR UPDATE
  USING (
    -- Teachers can update their own scores, admins can update any
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND public.is_school_admin(auth.uid(), e.school_id)
    )
  );

CREATE POLICY "scores_delete"
  ON public.scores FOR DELETE
  USING (
    -- Teachers can delete their own scores, admins can delete any
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND public.is_school_admin(auth.uid(), e.school_id)
    )
  );


-- ============================================================================
-- PART 9: Update RLS Policies for subjects
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on subjects" ON public.subjects;

-- Subjects are generally school-wide resources, so keeping it simple
CREATE POLICY "subjects_select"
  ON public.subjects FOR SELECT
  USING (true); -- Everyone can view subjects

CREATE POLICY "subjects_insert"
  ON public.subjects FOR INSERT
  WITH CHECK (
    -- Only admins can add subjects
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "subjects_update"
  ON public.subjects FOR UPDATE
  USING (
    -- Only admins can update subjects
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "subjects_delete"
  ON public.subjects FOR DELETE
  USING (
    -- Only admins can delete subjects
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );


-- ============================================================================
-- Migration Complete - All circular references removed!
-- ============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_school_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

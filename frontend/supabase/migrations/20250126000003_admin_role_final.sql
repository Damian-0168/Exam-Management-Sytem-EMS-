-- ============================================================================
-- FINAL CORRECTED: Admin Role Support Migration
-- All issues resolved, all edge cases handled
-- ============================================================================

-- ============================================================================
-- PART 0: Verify Prerequisites
-- ============================================================================

-- Check if schools table exists (it should, but let's be sure)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
    RAISE EXCEPTION 'schools table does not exist. Please run base migrations first.';
  END IF;
END $$;


-- ============================================================================
-- PART 1: Add Missing Columns (Safe - only if not exists)
-- ============================================================================

-- 1.1 Add role column to teacher_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'teacher_profiles' 
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.teacher_profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'teacher'
    CHECK (role IN ('teacher', 'admin', 'super-admin'));
    
    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_role ON public.teacher_profiles(role);
    
    RAISE NOTICE 'Added role column to teacher_profiles';
  ELSE
    RAISE NOTICE 'role column already exists in teacher_profiles';
  END IF;
END $$;

-- 1.2 Add school_id to students table (CRITICAL FIX)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'students' 
      AND column_name = 'school_id'
  ) THEN
    -- Add as nullable first
    ALTER TABLE public.students ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    
    -- Try to populate with first available school
    UPDATE public.students 
    SET school_id = (SELECT id FROM public.schools ORDER BY created_at ASC LIMIT 1)
    WHERE school_id IS NULL;
    
    -- If there are students but no schools, warn but don't fail
    IF (SELECT COUNT(*) FROM public.students WHERE school_id IS NULL) > 0 THEN
      RAISE WARNING 'Some students have no school_id. Please create a school first and run: UPDATE students SET school_id = ''<school-id>'' WHERE school_id IS NULL;';
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
    
    RAISE NOTICE 'Added school_id column to students';
  ELSE
    RAISE NOTICE 'school_id column already exists in students';
  END IF;
END $$;

-- 1.3 Add school_id to exam_events (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'exam_events' 
      AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exam_events ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    
    -- Populate with first school
    UPDATE public.exam_events 
    SET school_id = (SELECT id FROM public.schools ORDER BY created_at ASC LIMIT 1)
    WHERE school_id IS NULL;
    
    CREATE INDEX IF NOT EXISTS idx_exam_events_school_id ON public.exam_events(school_id);
    
    RAISE NOTICE 'Added school_id column to exam_events';
  ELSE
    RAISE NOTICE 'school_id column already exists in exam_events';
  END IF;
END $$;

-- 1.4 Add school_id to exams (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'exams' 
      AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.exams ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
    
    -- Populate with first school
    UPDATE public.exams 
    SET school_id = (SELECT id FROM public.schools ORDER BY created_at ASC LIMIT 1)
    WHERE school_id IS NULL;
    
    CREATE INDEX IF NOT EXISTS idx_exams_school_id ON public.exams(school_id);
    
    RAISE NOTICE 'Added school_id column to exams';
  ELSE
    RAISE NOTICE 'school_id column already exists in exams';
  END IF;
END $$;

-- 1.5 Handle teacher_id in exams (might be created_by instead)
DO $$
BEGIN
  -- Check if teacher_id exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'exams' 
      AND column_name = 'teacher_id'
  ) THEN
    -- Add teacher_id column
    ALTER TABLE public.exams ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- If created_by exists, copy data from it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'exams' 
        AND column_name = 'created_by'
    ) THEN
      UPDATE public.exams SET teacher_id = created_by WHERE teacher_id IS NULL;
      RAISE NOTICE 'Copied created_by to teacher_id in exams';
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(teacher_id);
    
    RAISE NOTICE 'Added teacher_id column to exams';
  ELSE
    RAISE NOTICE 'teacher_id column already exists in exams';
  END IF;
END $$;

-- 1.6 Verify created_by exists in exam_events (should exist, but check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'exam_events' 
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.exam_events ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added created_by column to exam_events';
  ELSE
    RAISE NOTICE 'created_by column already exists in exam_events';
  END IF;
END $$;


-- ============================================================================
-- PART 2: Create Helper Functions (SECURITY DEFINER - No Circular Dependencies)
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.is_school_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_school_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Function to check if user is admin in a specific school
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

COMMENT ON FUNCTION public.is_school_admin IS 'Check if user is admin in a specific school. Bypasses RLS to avoid circular dependencies.';

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM public.teacher_profiles WHERE id = user_id LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_school_id IS 'Get user school ID. Bypasses RLS to avoid circular dependencies.';

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(role, 'teacher') FROM public.teacher_profiles WHERE id = user_id LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_role IS 'Get user role. Bypasses RLS to avoid circular dependencies.';


-- ============================================================================
-- PART 3: Update RLS Policies for teacher_profiles
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can update profiles in their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles in their school" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_select" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_insert" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_delete" ON public.teacher_profiles;

-- Create new policies
CREATE POLICY "teacher_profiles_select"
  ON public.teacher_profiles FOR SELECT
  USING (
    id = auth.uid()
    OR
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "teacher_profiles_insert"
  ON public.teacher_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "teacher_profiles_update"
  ON public.teacher_profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "teacher_profiles_delete"
  ON public.teacher_profiles FOR DELETE
  USING (public.is_school_admin(auth.uid(), school_id));


-- ============================================================================
-- PART 4: Update RLS Policies for exams
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on exams" ON public.exams;
DROP POLICY IF EXISTS "Users can view exams in their school" ON public.exams;
DROP POLICY IF EXISTS "Users can create exams" ON public.exams;
DROP POLICY IF EXISTS "Users can update exams in their school" ON public.exams;
DROP POLICY IF EXISTS "Users can delete exams in their school" ON public.exams;
DROP POLICY IF EXISTS "exams_select" ON public.exams;
DROP POLICY IF EXISTS "exams_insert" ON public.exams;
DROP POLICY IF EXISTS "exams_update" ON public.exams;
DROP POLICY IF EXISTS "exams_delete" ON public.exams;

CREATE POLICY "exams_select"
  ON public.exams FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR school_id IS NULL  -- Handle legacy data without school_id
  );

CREATE POLICY "exams_insert"
  ON public.exams FOR INSERT
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
    AND (teacher_id = auth.uid() OR teacher_id IS NULL)
  );

CREATE POLICY "exams_update"
  ON public.exams FOR UPDATE
  USING (
    (teacher_id = auth.uid() OR created_by = auth.uid())  -- Support both columns
    OR
    public.is_school_admin(auth.uid(), school_id)
    OR
    (school_id IS NULL AND auth.uid() IS NOT NULL)  -- Legacy data
  );

CREATE POLICY "exams_delete"
  ON public.exams FOR DELETE
  USING (
    (teacher_id = auth.uid() OR created_by = auth.uid())
    OR
    public.is_school_admin(auth.uid(), school_id)
  );


-- ============================================================================
-- PART 5: Update RLS Policies for exam_subjects
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on exam_subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "Users can view exam_subjects in their school" ON public.exam_subjects;
DROP POLICY IF EXISTS "Users can manage exam_subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "exam_subjects_select" ON public.exam_subjects;
DROP POLICY IF EXISTS "exam_subjects_insert" ON public.exam_subjects;
DROP POLICY IF EXISTS "exam_subjects_update" ON public.exam_subjects;
DROP POLICY IF EXISTS "exam_subjects_delete" ON public.exam_subjects;

CREATE POLICY "exam_subjects_select"
  ON public.exam_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND (e.school_id = public.get_user_school_id(auth.uid()) OR e.school_id IS NULL)
    )
  );

CREATE POLICY "exam_subjects_insert"
  ON public.exam_subjects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND ((e.teacher_id = auth.uid() OR e.created_by = auth.uid()) 
             OR public.is_school_admin(auth.uid(), e.school_id))
    )
  );

CREATE POLICY "exam_subjects_update"
  ON public.exam_subjects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND ((e.teacher_id = auth.uid() OR e.created_by = auth.uid()) 
             OR public.is_school_admin(auth.uid(), e.school_id))
    )
  );

CREATE POLICY "exam_subjects_delete"
  ON public.exam_subjects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id 
        AND ((e.teacher_id = auth.uid() OR e.created_by = auth.uid()) 
             OR public.is_school_admin(auth.uid(), e.school_id))
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
DROP POLICY IF EXISTS "exam_events_select" ON public.exam_events;
DROP POLICY IF EXISTS "exam_events_insert" ON public.exam_events;
DROP POLICY IF EXISTS "exam_events_update" ON public.exam_events;
DROP POLICY IF EXISTS "exam_events_delete" ON public.exam_events;

CREATE POLICY "exam_events_select"
  ON public.exam_events FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR school_id IS NULL
  );

CREATE POLICY "exam_events_insert"
  ON public.exam_events FOR INSERT
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "exam_events_update"
  ON public.exam_events FOR UPDATE
  USING (
    created_by = auth.uid()
    OR
    public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "exam_events_delete"
  ON public.exam_events FOR DELETE
  USING (public.is_school_admin(auth.uid(), school_id));


-- ============================================================================
-- PART 7: Update RLS Policies for students
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on students" ON public.students;
DROP POLICY IF EXISTS "Users can view students in their school" ON public.students;
DROP POLICY IF EXISTS "Users can manage students" ON public.students;
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select"
  ON public.students FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
    OR school_id IS NULL
  );

CREATE POLICY "students_insert"
  ON public.students FOR INSERT
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "students_update"
  ON public.students FOR UPDATE
  USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "students_delete"
  ON public.students FOR DELETE
  USING (public.is_school_admin(auth.uid(), school_id));


-- ============================================================================
-- PART 8: Update RLS Policies for scores
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on scores" ON public.scores;
DROP POLICY IF EXISTS "Users can view scores in their school" ON public.scores;
DROP POLICY IF EXISTS "Users can manage scores" ON public.scores;
DROP POLICY IF EXISTS "scores_select" ON public.scores;
DROP POLICY IF EXISTS "scores_insert" ON public.scores;
DROP POLICY IF EXISTS "scores_update" ON public.scores;
DROP POLICY IF EXISTS "scores_delete" ON public.scores;

CREATE POLICY "scores_select"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND (e.school_id = public.get_user_school_id(auth.uid()) OR e.school_id IS NULL)
    )
  );

CREATE POLICY "scores_insert"
  ON public.scores FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND public.is_school_admin(auth.uid(), e.school_id)
    )
  );

CREATE POLICY "scores_update"
  ON public.scores FOR UPDATE
  USING (
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
    teacher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = scores.exam_id 
        AND public.is_school_admin(auth.uid(), e.school_id)
    )
  );


-- ============================================================================
-- PART 9: Update RLS Policies for subjects (kept simple)
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on subjects" ON public.subjects;
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_insert" ON public.subjects;
DROP POLICY IF EXISTS "subjects_update" ON public.subjects;
DROP POLICY IF EXISTS "subjects_delete" ON public.subjects;

CREATE POLICY "subjects_select"
  ON public.subjects FOR SELECT
  USING (true);

CREATE POLICY "subjects_insert"
  ON public.subjects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "subjects_update"
  ON public.subjects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );

CREATE POLICY "subjects_delete"
  ON public.subjects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    )
  );


-- ============================================================================
-- PART 10: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_school_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;


-- ============================================================================
-- PART 11: Verification Messages
-- ============================================================================

DO $$
DECLARE
  schools_count INT;
  students_without_school INT;
  exams_without_school INT;
BEGIN
  -- Check schools
  SELECT COUNT(*) INTO schools_count FROM public.schools;
  
  -- Check students without school
  SELECT COUNT(*) INTO students_without_school FROM public.students WHERE school_id IS NULL;
  
  -- Check exams without school
  SELECT COUNT(*) INTO exams_without_school FROM public.exams WHERE school_id IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schools in database: %', schools_count;
  RAISE NOTICE 'Students without school_id: %', students_without_school;
  RAISE NOTICE 'Exams without school_id: %', exams_without_school;
  RAISE NOTICE '========================================';
  
  IF students_without_school > 0 OR exams_without_school > 0 THEN
    RAISE WARNING 'Some records are missing school_id. Please run data cleanup:';
    RAISE WARNING 'UPDATE students SET school_id = ''<your-school-id>'' WHERE school_id IS NULL;';
    RAISE WARNING 'UPDATE exams SET school_id = ''<your-school-id>'' WHERE school_id IS NULL;';
  END IF;
END $$;


-- ============================================================================
-- Migration Complete!
-- ============================================================================

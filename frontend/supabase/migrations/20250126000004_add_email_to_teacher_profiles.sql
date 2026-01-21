-- ============================================================================
-- Add email column to teacher_profiles for easier lookups
-- ============================================================================

-- Add email column to teacher_profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'teacher_profiles' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.teacher_profiles 
    ADD COLUMN email TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_email ON public.teacher_profiles(email);
    
    -- Try to populate email from auth.users if possible
    -- This requires the service role, so we wrap in exception handler
    BEGIN
      UPDATE public.teacher_profiles tp
      SET email = au.email
      FROM auth.users au
      WHERE tp.id = au.id AND tp.email IS NULL;
      
      RAISE NOTICE 'Populated email column from auth.users';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not populate email from auth.users - this is normal if running with anon key';
    END;
    
    RAISE NOTICE 'Added email column to teacher_profiles';
  ELSE
    RAISE NOTICE 'email column already exists in teacher_profiles';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete!
-- ============================================================================

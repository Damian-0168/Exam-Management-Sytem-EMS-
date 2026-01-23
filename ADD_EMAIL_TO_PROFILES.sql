-- Add email column to teacher_profiles for easier lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'teacher_profiles' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.teacher_profiles ADD COLUMN email TEXT;
    
    -- Copy emails from auth.users
    UPDATE public.teacher_profiles tp
    SET email = au.email
    FROM auth.users au
    WHERE tp.id = au.id;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_email ON public.teacher_profiles(email);
    
    RAISE NOTICE 'Added email column to teacher_profiles';
  ELSE
    RAISE NOTICE 'email column already exists in teacher_profiles';
  END IF;
END $$;

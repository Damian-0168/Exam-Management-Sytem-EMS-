-- Fix missing teacher profiles for existing users
-- Insert teacher profiles for existing auth users who don't have profiles yet
INSERT INTO public.teacher_profiles (id, school_id, name, department, subjects)
SELECT 
  u.id,
  -- Default to first school for existing users, they can change this later
  (SELECT id FROM public.schools LIMIT 1),
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'department',
  CASE 
    WHEN u.raw_user_meta_data->>'subjects' IS NOT NULL 
    THEN ARRAY[u.raw_user_meta_data->>'subjects']
    ELSE '{}'::text[]
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_profiles tp WHERE tp.id = u.id
);

-- Update the trigger function to properly handle school_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teacher_profiles (id, school_id, name, department, subjects)
  VALUES (
    NEW.id,
    -- Get school_id from user metadata
    (NEW.raw_user_meta_data->>'school_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'department',
    CASE 
      WHEN jsonb_typeof(NEW.raw_user_meta_data->'subjects') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subjects'))
      ELSE '{}'::text[]
    END
  );
  RETURN NEW;
END;
$$;
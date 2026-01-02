-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create schools during signup" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;

-- Allow unauthenticated users to create schools during signup
CREATE POLICY "Anyone can create schools during signup"
ON public.schools
FOR INSERT
TO public
WITH CHECK (true);

-- Allow everyone to view schools for the signup dropdown
CREATE POLICY "Anyone can view schools"
ON public.schools
FOR SELECT
TO public
USING (true);
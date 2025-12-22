-- Allow anyone to insert new schools during signup
CREATE POLICY "Anyone can create schools during signup"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anyone to view all schools (needed for signup dropdown)
DROP POLICY IF EXISTS "Teachers can view their school" ON public.schools;

CREATE POLICY "Anyone can view schools"
ON public.schools
FOR SELECT
TO authenticated
USING (true);
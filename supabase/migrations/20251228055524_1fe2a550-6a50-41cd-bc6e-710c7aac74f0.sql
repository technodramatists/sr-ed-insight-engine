-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on runs" ON public.runs;

-- Create policies that allow all authenticated users to see all data (shared team access)
CREATE POLICY "Authenticated users can read all runs"
ON public.runs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert runs"
ON public.runs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update runs"
ON public.runs FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete runs"
ON public.runs FOR DELETE
TO authenticated
USING (true);
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Recreate the policy
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);
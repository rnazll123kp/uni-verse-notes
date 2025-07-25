-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN role text NOT NULL DEFAULT 'user';

-- Update the is_admin() function to check role instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = (auth.jwt() ->> 'email') AND role = 'admin'
  );
END;
$function$
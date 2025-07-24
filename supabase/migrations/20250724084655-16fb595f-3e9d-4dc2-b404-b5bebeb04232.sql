-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has access
CREATE OR REPLACE FUNCTION public.user_has_access(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = user_email AND access = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin (replace with your admin email)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'admin@example.com'; -- Change this to your admin email
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for users table
CREATE POLICY "Users can view their own record" 
ON public.users FOR SELECT 
USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert their own record" 
ON public.users FOR INSERT 
WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all users" 
ON public.users FOR UPDATE 
USING (public.is_admin());

-- RLS Policies for subjects table
CREATE POLICY "Users with access can view subjects" 
ON public.subjects FOR SELECT 
USING (public.user_has_access(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage subjects" 
ON public.subjects FOR ALL 
USING (public.is_admin());

-- RLS Policies for notes table
CREATE POLICY "Users with access can view notes" 
ON public.notes FOR SELECT 
USING (public.user_has_access(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage notes" 
ON public.notes FOR ALL 
USING (public.is_admin());

-- RLS Policies for videos table
CREATE POLICY "Users with access can view videos" 
ON public.videos FOR SELECT 
USING (public.user_has_access(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage videos" 
ON public.videos FOR ALL 
USING (public.is_admin());

-- Storage policies for PDFs
CREATE POLICY "Anyone can view PDFs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdfs');

CREATE POLICY "Admins can upload PDFs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'pdfs' AND public.is_admin());

CREATE POLICY "Admins can update PDFs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'pdfs' AND public.is_admin());

CREATE POLICY "Admins can delete PDFs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'pdfs' AND public.is_admin());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (email, access)
  VALUES (NEW.email, false)
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
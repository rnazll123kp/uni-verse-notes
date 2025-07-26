-- Add chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add image_url to subjects table
ALTER TABLE public.subjects 
ADD COLUMN image_url TEXT;

-- Update notes table to reference chapters instead of subjects
ALTER TABLE public.notes 
DROP COLUMN subject_id,
ADD COLUMN chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE;

-- Update videos table to reference chapters instead of subjects  
ALTER TABLE public.videos
DROP COLUMN subject_id,
ADD COLUMN chapter_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE;

-- Enable RLS on chapters table
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chapters
CREATE POLICY "Admins can manage chapters" 
ON public.chapters 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users with access can view chapters" 
ON public.chapters 
FOR SELECT 
USING (user_has_access((auth.jwt() ->> 'email'::text)));
-- First, add chapters table
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

-- Create default chapters for existing subjects
INSERT INTO public.chapters (subject_id, title, description)
SELECT id, name || ' - Chapter 1', 'Default chapter for ' || name 
FROM public.subjects;

-- Add chapter_id column as nullable first
ALTER TABLE public.notes 
ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE;

ALTER TABLE public.videos
ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE;

-- Update existing notes and videos to reference the default chapters
UPDATE public.notes 
SET chapter_id = (
  SELECT c.id 
  FROM public.chapters c 
  WHERE c.subject_id = notes.subject_id 
  LIMIT 1
);

UPDATE public.videos 
SET chapter_id = (
  SELECT c.id 
  FROM public.chapters c 
  WHERE c.subject_id = videos.subject_id 
  LIMIT 1
);

-- Now make chapter_id NOT NULL and drop subject_id
ALTER TABLE public.notes 
ALTER COLUMN chapter_id SET NOT NULL,
DROP COLUMN subject_id;

ALTER TABLE public.videos
ALTER COLUMN chapter_id SET NOT NULL,
DROP COLUMN subject_id;
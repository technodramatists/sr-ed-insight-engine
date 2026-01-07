-- Add columns for storing raw output and distinguishing run types
ALTER TABLE public.runs 
ADD COLUMN raw_output text,
ADD COLUMN is_structured boolean DEFAULT true NOT NULL;
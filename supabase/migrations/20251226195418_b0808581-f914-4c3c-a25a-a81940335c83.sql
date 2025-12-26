-- Create table for storing transcript processing runs
CREATE TABLE public.runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Transcript data
  transcript_text TEXT NOT NULL,
  client_name TEXT,
  fiscal_year TEXT,
  meeting_type TEXT,
  
  -- Context pack data
  context_pack_text TEXT NOT NULL,
  context_pack_name TEXT,
  context_pack_version TEXT,
  
  -- Model configuration
  model_used TEXT NOT NULL,
  
  -- Prompt data
  prompt_text TEXT NOT NULL,
  prompt_name TEXT,
  prompt_version TEXT,
  
  -- Structured output (all 5 buckets stored as JSONB)
  output_candidate_projects JSONB,
  output_big_picture JSONB,
  output_work_performed JSONB,
  output_iterations JSONB,
  output_drafting_material JSONB,
  
  -- Evaluation scores (0-2 scale)
  eval_candidate_projects INTEGER CHECK (eval_candidate_projects >= 0 AND eval_candidate_projects <= 2),
  eval_big_picture INTEGER CHECK (eval_big_picture >= 0 AND eval_big_picture <= 2),
  eval_work_performed INTEGER CHECK (eval_work_performed >= 0 AND eval_work_performed <= 2),
  eval_iterations INTEGER CHECK (eval_iterations >= 0 AND eval_iterations <= 2),
  eval_drafting_material INTEGER CHECK (eval_drafting_material >= 0 AND eval_drafting_material <= 2),
  
  -- Evaluation notes
  eval_notes_candidate_projects TEXT,
  eval_notes_big_picture TEXT,
  eval_notes_work_performed TEXT,
  eval_notes_iterations TEXT,
  eval_notes_drafting_material TEXT,
  eval_notes_overall TEXT
);

-- Enable RLS (but allow public access since this is an internal tool without auth)
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (internal tool, no auth required)
CREATE POLICY "Allow all operations on runs"
ON public.runs
FOR ALL
USING (true)
WITH CHECK (true);
export interface Citation {
  quote: string;
  location: string;
}

export interface CandidateProject {
  label: string;
  description: string;
  signals: string;
  confidence: 'High' | 'Medium' | 'Low';
  citations: Citation[];
}

export interface BigPictureItem {
  content: string;
  type: 'goal' | 'constraint' | 'uncertainty';
  citations: Citation[];
}

export interface WorkPerformedItem {
  component: string;
  activity: string;
  issue_addressed: string;
  citations: Citation[];
}

export interface IterationItem {
  initial_approach: string;
  work_done: string;
  observations: string;
  change: string;
  status: 'complete' | 'incomplete' | 'unresolved';
  sequence_cue: string;
  citations: Citation[];
}

export interface DraftingBullet {
  bullet: string;
  status: 'draft-ready' | 'needs-clarification';
  clarification_needed?: string;
  citation: Citation;
}

export interface DraftingMaterial {
  big_picture_232: DraftingBullet[];
  work_performed_244_246: DraftingBullet[];
  iterations_bullets: DraftingBullet[];
  results_outcomes_248: DraftingBullet[];
}

export interface SREDOutput {
  candidate_projects: CandidateProject[];
  big_picture: BigPictureItem[];
  work_performed: WorkPerformedItem[];
  iterations: IterationItem[];
  drafting_material: DraftingMaterial;
}

export interface Run {
  id: string;
  created_at: string;
  transcript_text: string;
  client_name?: string;
  fiscal_year?: string;
  meeting_type?: string;
  context_pack_text: string;
  context_pack_name?: string;
  context_pack_version?: string;
  model_used: string;
  prompt_text: string;
  prompt_name?: string;
  prompt_version?: string;
  output_candidate_projects?: CandidateProject[];
  output_big_picture?: BigPictureItem[];
  output_work_performed?: WorkPerformedItem[];
  output_iterations?: IterationItem[];
  output_drafting_material?: DraftingMaterial;
  eval_candidate_projects?: number;
  eval_big_picture?: number;
  eval_work_performed?: number;
  eval_iterations?: number;
  eval_drafting_material?: number;
  eval_notes_candidate_projects?: string;
  eval_notes_big_picture?: string;
  eval_notes_work_performed?: string;
  eval_notes_iterations?: string;
  eval_notes_drafting_material?: string;
  eval_notes_overall?: string;
  raw_output?: string;
  is_structured: boolean;
}

export type ModelType = 'openai' | 'claude' | 'gemini';

export const DEFAULT_CONTEXT_PACK = `SR&ED Context Pack — Reasoning Guide v0

Purpose: Guide the LLM's reasoning about SR&ED content. Output structure is defined by the tool, not this document.

---

How to extract Big Picture content

Capture the overall technical aim and situation: what they were trying to accomplish, what made it technically difficult, and what was uncertain or unknown at the time. Keep language close to how the speaker describes it. Aims and uncertainties can coexist; do not force artificial separation.

---

How to extract Work Performed content

Identify where work actually happened using the client's vocabulary (components, modules, systems, process areas). Describe concrete technical activity (build, test, integrate, troubleshoot, redesign, measure) and what issue each activity was addressing. Structural elements and concrete actions should both appear naturally.

---

How to extract Iterations

Look for "attempt arcs" where the transcript supports them:
- Initial idea, hypothesis, or approach
- What they tried
- What happened (observations, results)
- What changed next (pivot, refinement, new constraint, abandonment)

Iteration structure should be flexible. Incomplete, messy, or unresolved arcs are valid — represent them as such rather than forcing closure. Include rough sequencing cues (earlier/later, before/after) where available.

---

How to propose Project / Sub-Project groupings

Only propose groupings if the transcript provides clear signals:
- Distinct technical goals
- Distinct systems or components
- Distinct time periods
- Explicit statements like "this was a separate effort"

Assign confidence levels (High / Medium / Low) based on signal strength. When uncertain, surface the ambiguity rather than forcing a clean grouping.

---

How to generate Drafting Raw Material

Distill the most reusable content into concise, factual bullets a human SR&ED writer could copy forward. Organize bullets under these headings:
- Big Picture (232)
- Work Performed (244/246)
- Iterations
- Results / Outcomes (248)

Each bullet should be:
- Specific and concrete
- Traceable to transcript via citation
- Labeled as "draft-ready" or "needs clarification" (with what's missing)

This section re-expresses prior content for reuse; it does not introduce new analysis.

---

Citation requirement

Every bullet or claim must include:
- One or more direct transcript quotes
- A location reference (timestamp, speaker turn, paragraph/line — whatever is available)

Content without citations is invalid.

---

Handling ambiguity

When the transcript is unclear, surface it directly as "Needs clarification" and specify what would resolve it (e.g., missing metric, missing baseline, unclear timeframe, unclear component boundary). Do not invent or assume.

---

Note: This context pack is a testing artifact, not doctrine. It will be revised as we learn what improves usefulness and what causes distortion.`;

export const DEFAULT_SYSTEM_PROMPT = `You are an expert SR&ED technical analyst. Your job is to extract structured, cited information from interview transcripts to support SR&ED claim drafting.

Key principles:
1. Every claim must be directly supported by the transcript
2. Use the client's own language whenever possible
3. Preserve ambiguity rather than inventing certainty
4. Be thorough but honest about what's actually in the transcript
5. Citations are mandatory - no unsupported content`;

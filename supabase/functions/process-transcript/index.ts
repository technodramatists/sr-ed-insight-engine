import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation limits
const MAX_TRANSCRIPT_LENGTH = 500000; // 500KB for long meeting transcripts
const MAX_CONTEXT_LENGTH = 100000; // 100KB
const MAX_PROMPT_LENGTH = 10000; // 10KB
const ALLOWED_MODELS = ['openai', 'claude', 'gemini'];

// Model mapping for Lovable AI Gateway
const MODEL_MAP: Record<string, string> = {
  'openai': 'openai/gpt-5',
  'claude': 'google/gemini-2.5-pro', // Gemini Pro (most capable)
  'gemini': 'google/gemini-2.5-flash', // Gemini Flash (faster)
};

// Model display names for logging
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'openai/gpt-5': 'GPT-5',
  'google/gemini-2.5-pro': 'Gemini Pro',
  'google/gemini-2.5-flash': 'Gemini Flash',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - no token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client and verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated user: ${user.email}`);

    const { transcript, contextPack, model, systemPrompt } = await req.json();
    
    // Input validation - check required fields
    if (!transcript || typeof transcript !== 'string') {
      return new Response(JSON.stringify({ error: 'Transcript is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!contextPack || typeof contextPack !== 'string') {
      return new Response(JSON.stringify({ error: 'Context pack is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation - check lengths
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return new Response(JSON.stringify({ 
        error: `Transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH} characters` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (contextPack.length > MAX_CONTEXT_LENGTH) {
      return new Response(JSON.stringify({ 
        error: `Context pack exceeds maximum length of ${MAX_CONTEXT_LENGTH} characters` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const promptToUse = systemPrompt || '';
    if (promptToUse.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ 
        error: `System prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate model selection
    const modelKey = model || 'gemini';
    if (!ALLOWED_MODELS.includes(modelKey)) {
      return new Response(JSON.stringify({ 
        error: `Invalid model selection. Allowed models: ${ALLOWED_MODELS.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing transcript for user ${user.email} with model: ${modelKey}`);
    console.log(`Transcript length: ${transcript.length} chars`);
    console.log(`Context pack length: ${contextPack.length} chars`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const selectedModel = MODEL_MAP[modelKey] || 'google/gemini-2.5-flash';
    const displayName = MODEL_DISPLAY_NAMES[selectedModel] || selectedModel;
    console.log(`Using model: ${displayName} (${selectedModel})`);

    // Build the full prompt with transcript and context
    const fullPrompt = `
${contextPack}

---

TRANSCRIPT TO ANALYZE:

${transcript}

---

OUTPUT INSTRUCTIONS:

You must return a JSON object with exactly 5 keys corresponding to the SR&ED output buckets. Each bucket should contain an array of items with citations.

Return ONLY valid JSON in this exact structure:

{
  "candidate_projects": [
    {
      "label": "Project/sub-project name using client language",
      "description": "Brief description of what it covers",
      "signals": "Signals supporting the grouping (distinct goal, system, time period)",
      "confidence": "High | Medium | Low",
      "citations": [
        {
          "quote": "Direct quote from transcript",
          "location": "Speaker name and timestamp if available"
        }
      ]
    }
  ],
  "big_picture": [
    {
      "content": "Technical goal, constraint, or uncertainty",
      "type": "goal | constraint | uncertainty",
      "citations": [
        {
          "quote": "Direct quote from transcript",
          "location": "Speaker name and timestamp if available"
        }
      ]
    }
  ],
  "work_performed": [
    {
      "component": "Component, module, system, or process area (client language)",
      "activity": "Concrete technical activity (build, test, debug, etc.)",
      "issue_addressed": "What issue this activity was addressing",
      "citations": [
        {
          "quote": "Direct quote from transcript",
          "location": "Speaker name and timestamp if available"
        }
      ]
    }
  ],
  "iterations": [
    {
      "initial_approach": "Initial idea, hypothesis, or approach",
      "work_done": "What they tried",
      "observations": "What happened (results, learnings)",
      "change": "What changed next (pivot, refinement, abandonment)",
      "status": "complete | incomplete | unresolved",
      "sequence_cue": "Any before/after or timeline indicators",
      "citations": [
        {
          "quote": "Direct quote from transcript",
          "location": "Speaker name and timestamp if available"
        }
      ]
    }
  ],
  "drafting_material": {
    "big_picture_232": [
      {
        "bullet": "Concise, factual bullet for drafting",
        "status": "draft-ready | needs-clarification",
        "clarification_needed": "What's missing (if needs-clarification)",
        "citation": {
          "quote": "Direct quote",
          "location": "Location reference"
        }
      }
    ],
    "work_performed_244_246": [
      {
        "bullet": "Concise, factual bullet for drafting",
        "status": "draft-ready | needs-clarification",
        "clarification_needed": "What's missing (if needs-clarification)",
        "citation": {
          "quote": "Direct quote",
          "location": "Location reference"
        }
      }
    ],
    "iterations_bullets": [
      {
        "bullet": "Concise, factual bullet for drafting",
        "status": "draft-ready | needs-clarification",
        "clarification_needed": "What's missing (if needs-clarification)",
        "citation": {
          "quote": "Direct quote",
          "location": "Location reference"
        }
      }
    ],
    "results_outcomes_248": [
      {
        "bullet": "Concise, factual bullet for drafting",
        "status": "draft-ready | needs-clarification",
        "clarification_needed": "What's missing (if needs-clarification)",
        "citation": {
          "quote": "Direct quote",
          "location": "Location reference"
        }
      }
    ]
  }
}

CRITICAL RULES:
1. Every item MUST have at least one citation with a direct quote from the transcript
2. If something cannot be cited from the transcript, do not include it
3. Return ONLY the JSON object, no markdown, no explanation
4. Use the exact structure shown above
5. All string values must be properly escaped for JSON
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { 
            role: 'system', 
            content: promptToUse || 'You are an expert SR&ED technical analyst. Your job is to extract structured, cited information from interview transcripts to support SR&ED claim drafting. Be thorough but only include content that can be directly cited from the transcript.'
          },
          { role: 'user', content: fullPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('Raw LLM response length:', content?.length || 0);

    // Try to parse the JSON from the response
    let parsedOutput;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      parsedOutput = JSON.parse(cleanedContent);
      console.log('Successfully parsed LLM output');
    } catch (parseError) {
      console.error('Failed to parse LLM output as JSON:', parseError);
      // Return raw content if parsing fails
      return new Response(JSON.stringify({ 
        error: 'Failed to parse LLM output as JSON',
        raw_content: content 
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      output: parsedOutput,
      model_used: selectedModel 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing transcript:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

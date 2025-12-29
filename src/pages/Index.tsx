import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TranscriptForm } from "@/components/TranscriptForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SREDOutput, ModelType } from "@/types/sred";
import { Json } from "@/integrations/supabase/types";
import { History, FlaskConical, LogOut, Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { user, session, loading, signOut } = useRequireAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [results, setResults] = useState<{ output?: SREDOutput; content?: string; modelUsed: string } | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (data: {
    transcript: string;
    clientName?: string;
    fiscalYear?: string;
    meetingType?: string;
    contextPack: string;
    contextPackName?: string;
    contextPackVersion?: string;
    model: ModelType;
    systemPrompt: string;
    promptName?: string;
    promptVersion?: string;
    disableStructuredOutput: boolean;
  }) => {
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please log in to process transcripts.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setLastRunId(null);
    setElapsedSeconds(0);

    // Start elapsed time counter
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Create abort controller with 5 minute timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, 5 * 60 * 1000); // 5 minutes

    try {
      // Call the edge function with authenticated session token
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          transcript: data.transcript,
          contextPack: data.contextPack,
          model: data.model,
          systemPrompt: data.systemPrompt,
          disableStructuredOutput: data.disableStructuredOutput,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const modelUsed = responseData.model_used;

      // Handle unstructured output (raw content)
      if (data.disableStructuredOutput) {
        const content = responseData.content as string;
        setResults({ content, modelUsed });
        toast({
          title: "Run completed",
          description: "Raw output returned (structured output disabled).",
        });
        return;
      }

      // Handle structured output
      const output = responseData.output as SREDOutput;

      // Save the run to the database
      const { data: insertedRun, error: dbError } = await supabase
        .from('runs')
        .insert([{
          transcript_text: data.transcript,
          client_name: data.clientName,
          fiscal_year: data.fiscalYear,
          meeting_type: data.meetingType,
          context_pack_text: data.contextPack,
          context_pack_name: data.contextPackName,
          context_pack_version: data.contextPackVersion,
          model_used: modelUsed,
          prompt_text: data.systemPrompt,
          prompt_name: data.promptName,
          prompt_version: data.promptVersion,
          output_candidate_projects: output.candidate_projects as unknown as Json,
          output_big_picture: output.big_picture as unknown as Json,
          output_work_performed: output.work_performed as unknown as Json,
          output_iterations: output.iterations as unknown as Json,
          output_drafting_material: output.drafting_material as unknown as Json,
        }])
        .select('id')
        .single();

      if (dbError) {
        console.error('Failed to save run:', dbError);
        toast({
          title: "Warning",
          description: "Results processed but failed to save to history.",
          variant: "destructive",
        });
      } else {
        setLastRunId(insertedRun.id);
        toast({
          title: "Run completed",
          description: "Results saved to history.",
        });
      }

      setResults({ output, modelUsed });

    } catch (error) {
      console.error('Processing error:', error);
      
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out after 5 minutes. The transcript may be too long or complex.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">SR&ED Transcript Engine</h1>
              <p className="text-sm text-muted-foreground">Evaluation Environment v0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" onClick={() => navigate('/history')} className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div>
            <TranscriptForm onSubmit={handleSubmit} isProcessing={isProcessing} elapsedSeconds={elapsedSeconds} />
          </div>

          {/* Right Column: Results */}
          <div>
            {results ? (
              results.content ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Raw Output</h2>
                    <span className="text-sm text-muted-foreground">{results.modelUsed}</span>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-4 overflow-auto max-h-[70vh]">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{results.content}</pre>
                  </div>
                </div>
              ) : results.output ? (
                <ResultsDisplay output={results.output} modelUsed={results.modelUsed} />
              ) : null
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No results yet</p>
                  <p className="text-sm">Paste a transcript and run to see results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

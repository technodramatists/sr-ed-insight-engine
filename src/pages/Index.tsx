import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TranscriptForm } from "@/components/TranscriptForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SREDOutput, ModelType } from "@/types/sred";
import { Json } from "@/integrations/supabase/types";
import { History, FlaskConical } from "lucide-react";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ output: SREDOutput; modelUsed: string } | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
  }) => {
    setIsProcessing(true);
    setResults(null);
    setLastRunId(null);

    try {
      // Call the edge function to process the transcript
      const { data: responseData, error: functionError } = await supabase.functions.invoke('process-transcript', {
        body: {
          transcript: data.transcript,
          contextPack: data.contextPack,
          model: data.model,
          systemPrompt: data.systemPrompt,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const output = responseData.output as SREDOutput;
      const modelUsed = responseData.model_used;

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
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
              <h1 className="text-xl font-semibold">SR&ED Transcript Engine - Evaluation Environment</h1>
              <p className="text-sm text-muted-foreground">Test Harness v0</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/history')} className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div>
            <TranscriptForm onSubmit={handleSubmit} isProcessing={isProcessing} />
          </div>

          {/* Right Column: Results */}
          <div>
            {results ? (
              <ResultsDisplay output={results.output} modelUsed={results.modelUsed} />
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

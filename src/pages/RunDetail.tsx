import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { Run, SREDOutput } from "@/types/sred";
import { ArrowLeft, Calendar, User, FlaskConical, FileText, Settings, Download } from "lucide-react";
import { format } from "date-fns";
import { exportAsJSON, exportAsCSV, exportAsHTML } from "@/lib/exportRun";

const RunDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadRun(id);
    }
  }, [id]);

  const loadRun = async (runId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      console.error('Failed to load run:', error);
    } else {
      setRun(data as unknown as Run);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading run...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Run not found</p>
          <Button className="mt-4" onClick={() => navigate('/history')}>
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const output: SREDOutput = {
    candidate_projects: run.output_candidate_projects || [],
    big_picture: run.output_big_picture || [],
    work_performed: run.output_work_performed || [],
    iterations: run.output_iterations || [],
    drafting_material: run.output_drafting_material || {
      big_picture_232: [],
      work_performed_244_246: [],
      iterations_bullets: [],
      results_outcomes_248: [],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <FlaskConical className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Run Details</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(run.created_at), 'MMM d, yyyy HH:mm')}
                </div>
                {run.client_name && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {run.client_name}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {run.model_used}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportAsHTML(run)}>
                  📄 Download Report (HTML)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsJSON(run)}>
                  📦 Download JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsCSV(run)}>
                  📊 Download CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <ResultsDisplay output={output} modelUsed={run.model_used} />
          </TabsContent>

          <TabsContent value="inputs" className="space-y-6">
            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4 text-sm">
                  {run.client_name && (
                    <div>
                      <span className="text-muted-foreground">Client:</span> {run.client_name}
                    </div>
                  )}
                  {run.fiscal_year && (
                    <div>
                      <span className="text-muted-foreground">Fiscal Year:</span> {run.fiscal_year}
                    </div>
                  )}
                  {run.meeting_type && (
                    <div>
                      <span className="text-muted-foreground">Meeting Type:</span> {run.meeting_type}
                    </div>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-[400px] overflow-auto font-mono">
                  {run.transcript_text}
                </pre>
              </CardContent>
            </Card>

            {/* Context Pack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Context Pack
                  {run.context_pack_name && (
                    <Badge variant="secondary" className="ml-2">
                      {run.context_pack_name} {run.context_pack_version && `v${run.context_pack_version}`}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-[400px] overflow-auto font-mono">
                  {run.context_pack_text}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            {/* Model & Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground">Model:</span>{' '}
                  <Badge variant="outline">{run.model_used}</Badge>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">System Prompt</span>
                    {run.prompt_name && (
                      <Badge variant="secondary">
                        {run.prompt_name} {run.prompt_version && `v${run.prompt_version}`}
                      </Badge>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-[300px] overflow-auto font-mono">
                    {run.prompt_text}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RunDetail;

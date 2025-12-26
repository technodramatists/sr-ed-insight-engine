import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Run } from "@/types/sred";
import { ArrowLeft, Calendar, User, Cpu, FlaskConical } from "lucide-react";
import { format } from "date-fns";

const History = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load runs:', error);
    } else {
      // Type assertion needed because Supabase doesn't know our exact types
      setRuns(data as unknown as Run[]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Run History</h1>
              <p className="text-sm text-muted-foreground">{runs.length} runs recorded</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading runs...
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No runs yet</p>
            <p className="text-sm text-muted-foreground">Process a transcript to see it here</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go to Transcript Engine
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <Card 
                key={run.id} 
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/run/${run.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{run.model_used}</Badge>
                        {run.client_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {run.client_name}
                          </div>
                        )}
                        {run.context_pack_name && (
                          <Badge variant="secondary" className="text-xs">
                            {run.context_pack_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {run.transcript_text.slice(0, 200)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(run.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      {(run.output_candidate_projects as unknown[])?.length || 0} projects
                    </span>
                    <span>
                      {(run.output_big_picture as unknown[])?.length || 0} big picture items
                    </span>
                    <span>
                      {(run.output_work_performed as unknown[])?.length || 0} work items
                    </span>
                    <span>
                      {(run.output_iterations as unknown[])?.length || 0} iterations
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;

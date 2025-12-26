import { SREDOutput } from "@/types/sred";
import { OutputBucket, CitationDisplay } from "@/components/OutputBucket";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ResultsDisplayProps {
  output: SREDOutput;
  modelUsed: string;
}

export function ResultsDisplay({ output, modelUsed }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Results</h2>
        <Badge variant="outline">{modelUsed}</Badge>
      </div>

      {/* Bucket 1: Candidate Projects */}
      <OutputBucket
        title="1. Candidate Projects / Sub-Projects"
        description="Pre-drafting sensemaking — proposed groupings of SR&ED efforts"
        itemCount={output.candidate_projects?.length || 0}
        isEmpty={!output.candidate_projects?.length}
      >
        <div className="space-y-4">
          {output.candidate_projects?.map((project, idx) => (
            <Card key={idx} className="p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{project.label}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  {project.signals && (
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">Signals:</span> {project.signals}
                    </p>
                  )}
                </div>
                <Badge 
                  variant={
                    project.confidence === 'High' ? 'default' : 
                    project.confidence === 'Medium' ? 'secondary' : 'outline'
                  }
                >
                  {project.confidence}
                </Badge>
              </div>
              <div className="mt-3">
                <CitationDisplay citations={project.citations} />
              </div>
            </Card>
          ))}
        </div>
      </OutputBucket>

      {/* Bucket 2: Big Picture */}
      <OutputBucket
        title="2. Big Picture (232)"
        description="Why the work existed — technical goals, constraints, uncertainties"
        itemCount={output.big_picture?.length || 0}
        isEmpty={!output.big_picture?.length}
      >
        <div className="space-y-4">
          {output.big_picture?.map((item, idx) => (
            <Card key={idx} className="p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="capitalize shrink-0">
                  {item.type}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm">{item.content}</p>
                  <div className="mt-3">
                    <CitationDisplay citations={item.citations} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </OutputBucket>

      {/* Bucket 3: Work Performed */}
      <OutputBucket
        title="3. Work Performed (244/246)"
        description="Ground truth of activity — components, technical actions, issues addressed"
        itemCount={output.work_performed?.length || 0}
        isEmpty={!output.work_performed?.length}
      >
        <div className="space-y-4">
          {output.work_performed?.map((item, idx) => (
            <Card key={idx} className="p-4 bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.component}</Badge>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Activity:</span> {item.activity}
                </p>
                {item.issue_addressed && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Issue addressed:</span> {item.issue_addressed}
                  </p>
                )}
                <div className="mt-3">
                  <CitationDisplay citations={item.citations} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </OutputBucket>

      {/* Bucket 4: Iterations */}
      <OutputBucket
        title="4. Iterations"
        description="How understanding evolved — attempt arcs with observations and pivots"
        itemCount={output.iterations?.length || 0}
        isEmpty={!output.iterations?.length}
      >
        <div className="space-y-4">
          {output.iterations?.map((item, idx) => (
            <Card key={idx} className="p-4 bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      item.status === 'complete' ? 'default' : 
                      item.status === 'incomplete' ? 'secondary' : 'outline'
                    }
                  >
                    {item.status}
                  </Badge>
                  {item.sequence_cue && (
                    <span className="text-xs text-muted-foreground">({item.sequence_cue})</span>
                  )}
                </div>
                <div className="grid gap-2 text-sm">
                  {item.initial_approach && (
                    <div>
                      <span className="text-muted-foreground">Initial approach:</span>{' '}
                      {item.initial_approach}
                    </div>
                  )}
                  {item.work_done && (
                    <div>
                      <span className="text-muted-foreground">Work done:</span>{' '}
                      {item.work_done}
                    </div>
                  )}
                  {item.observations && (
                    <div>
                      <span className="text-muted-foreground">Observations:</span>{' '}
                      {item.observations}
                    </div>
                  )}
                  {item.change && (
                    <div>
                      <span className="text-muted-foreground">Change/Next:</span>{' '}
                      {item.change}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <CitationDisplay citations={item.citations} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </OutputBucket>

      {/* Bucket 5: Drafting Material */}
      <OutputBucket
        title="5. Drafting Raw Material"
        description="Bridge to human drafting — concise bullets ready for SR&ED claim writing"
        isEmpty={!output.drafting_material}
      >
        {output.drafting_material && (
          <div className="space-y-6">
            {/* Big Picture 232 */}
            {output.drafting_material.big_picture_232?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Big Picture (232)</h4>
                <div className="space-y-3">
                  {output.drafting_material.big_picture_232.map((bullet, idx) => (
                    <DraftingBulletCard key={idx} bullet={bullet} />
                  ))}
                </div>
              </div>
            )}

            {output.drafting_material.big_picture_232?.length > 0 && 
             output.drafting_material.work_performed_244_246?.length > 0 && (
              <Separator />
            )}

            {/* Work Performed 244/246 */}
            {output.drafting_material.work_performed_244_246?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Work Performed (244/246)</h4>
                <div className="space-y-3">
                  {output.drafting_material.work_performed_244_246.map((bullet, idx) => (
                    <DraftingBulletCard key={idx} bullet={bullet} />
                  ))}
                </div>
              </div>
            )}

            {output.drafting_material.work_performed_244_246?.length > 0 && 
             output.drafting_material.iterations_bullets?.length > 0 && (
              <Separator />
            )}

            {/* Iterations */}
            {output.drafting_material.iterations_bullets?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Iterations</h4>
                <div className="space-y-3">
                  {output.drafting_material.iterations_bullets.map((bullet, idx) => (
                    <DraftingBulletCard key={idx} bullet={bullet} />
                  ))}
                </div>
              </div>
            )}

            {output.drafting_material.iterations_bullets?.length > 0 && 
             output.drafting_material.results_outcomes_248?.length > 0 && (
              <Separator />
            )}

            {/* Results/Outcomes 248 */}
            {output.drafting_material.results_outcomes_248?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Results / Outcomes (248)</h4>
                <div className="space-y-3">
                  {output.drafting_material.results_outcomes_248.map((bullet, idx) => (
                    <DraftingBulletCard key={idx} bullet={bullet} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </OutputBucket>
    </div>
  );
}

interface DraftingBulletCardProps {
  bullet: {
    bullet: string;
    status: string;
    clarification_needed?: string;
    citation: { quote: string; location: string };
  };
}

function DraftingBulletCard({ bullet }: DraftingBulletCardProps) {
  const isDraftReady = bullet.status === 'draft-ready';
  
  return (
    <Card className="p-3 bg-muted/30">
      <div className="flex items-start gap-3">
        {isDraftReady ? (
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-2">
          <p className="text-sm">{bullet.bullet}</p>
          {!isDraftReady && bullet.clarification_needed && (
            <p className="text-xs text-amber-600">
              Needs clarification: {bullet.clarification_needed}
            </p>
          )}
          {bullet.citation && (
            <CitationDisplay citations={[bullet.citation]} />
          )}
        </div>
      </div>
    </Card>
  );
}

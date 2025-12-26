import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Quote } from "lucide-react";
import { Citation } from "@/types/sred";

interface CitationDisplayProps {
  citations: Citation[];
}

function CitationDisplay({ citations }: CitationDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Quote className="h-3 w-3" />
          {citations.length} citation{citations.length !== 1 ? 's' : ''}
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {citations.map((citation, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-muted text-sm">
            <p className="italic text-muted-foreground">"{citation.quote}"</p>
            <p className="text-xs text-muted-foreground/70 mt-1">— {citation.location}</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface OutputBucketProps {
  title: string;
  description: string;
  children: ReactNode;
  itemCount?: number;
  isEmpty?: boolean;
}

export function OutputBucket({ title, description, children, itemCount, isEmpty }: OutputBucketProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {itemCount !== undefined && (
            <Badge variant="secondary">{itemCount} item{itemCount !== 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-muted-foreground text-sm italic">No content extracted for this bucket</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export { CitationDisplay };

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Play, Loader2 } from "lucide-react";
import { ModelType, DEFAULT_CONTEXT_PACK, DEFAULT_SYSTEM_PROMPT } from "@/types/sred";

interface TranscriptFormProps {
  onSubmit: (data: {
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
  }) => void;
  isProcessing: boolean;
  elapsedSeconds?: number;
}

const formatElapsedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export function TranscriptForm({ onSubmit, isProcessing, elapsedSeconds = 0 }: TranscriptFormProps) {
  const [transcript, setTranscript] = useState("");
  const [clientName, setClientName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [meetingType, setMeetingType] = useState<string>("");
  
  const [contextPack, setContextPack] = useState(DEFAULT_CONTEXT_PACK);
  const [contextPackName, setContextPackName] = useState("Reasoning Guide v0");
  const [contextPackVersion, setContextPackVersion] = useState("0.1");
  
  const [model, setModel] = useState<ModelType>("gemini");
  
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [promptName, setPromptName] = useState("Default SRED Analyst");
  const [promptVersion, setPromptVersion] = useState("0.1");
  
  const [disableStructuredOutput, setDisableStructuredOutput] = useState(true);
  
  const [showMetadata, setShowMetadata] = useState(false);
  const [showPromptConfig, setShowPromptConfig] = useState(false);

  const canSubmit = transcript.trim().length > 0 && contextPack.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    onSubmit({
      transcript,
      clientName: clientName || undefined,
      fiscalYear: fiscalYear || undefined,
      meetingType: meetingType || undefined,
      contextPack,
      contextPackName: contextPackName || undefined,
      contextPackVersion: contextPackVersion || undefined,
      model,
      systemPrompt,
      promptName: promptName || undefined,
      promptVersion: promptVersion || undefined,
      disableStructuredOutput,
    });
  };

  return (
    <div className="space-y-6">
      {/* Transcript Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste transcript text here...&#10;&#10;Expected format:&#10;Speaker Name 00:03:42&#10;Spoken content goes here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ChevronDown className={`h-4 w-4 transition-transform ${showMetadata ? 'rotate-180' : ''}`} />
                Optional metadata
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client name</Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., Acme Corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal year</Label>
                  <Input
                    id="fiscalYear"
                    placeholder="e.g., 2024"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingType">Meeting type</Label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger id="meetingType">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Context Pack Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">SR&ED Context Pack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contextPackName">Name</Label>
              <Input
                id="contextPackName"
                placeholder="e.g., Reasoning Guide v0"
                value={contextPackName}
                onChange={(e) => setContextPackName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contextPackVersion">Version</Label>
              <Input
                id="contextPackVersion"
                placeholder="e.g., 0.1"
                value={contextPackVersion}
                onChange={(e) => setContextPackVersion(e.target.value)}
              />
            </div>
          </div>
          <Textarea
            placeholder="Paste SR&ED context pack here..."
            value={contextPack}
            onChange={(e) => setContextPack(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Model Selection & Prompt Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Model & Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={model === 'openai' ? 'default' : 'outline'}
                onClick={() => setModel('openai')}
                className="flex-1"
              >
                GPT-5
              </Button>
              <Button
                type="button"
                variant={model === 'claude' ? 'default' : 'outline'}
                onClick={() => setModel('claude')}
                className="flex-1"
              >
                Gemini Pro
              </Button>
              <Button
                type="button"
                variant={model === 'gemini' ? 'default' : 'outline'}
                onClick={() => setModel('gemini')}
                className="flex-1"
              >
                Gemini Flash
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="disableStructuredOutput"
              checked={disableStructuredOutput}
              onCheckedChange={(checked) => setDisableStructuredOutput(checked === true)}
            />
            <Label htmlFor="disableStructuredOutput" className="text-sm font-normal cursor-pointer">
              Disable structured output (JSON)
            </Label>
          </div>

          <Collapsible open={showPromptConfig} onOpenChange={setShowPromptConfig}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ChevronDown className={`h-4 w-4 transition-transform ${showPromptConfig ? 'rotate-180' : ''}`} />
                System prompt configuration
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promptName">Prompt name</Label>
                  <Input
                    id="promptName"
                    placeholder="e.g., Default SRED Analyst"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promptVersion">Version</Label>
                  <Input
                    id="promptVersion"
                    placeholder="e.g., 0.1"
                    value={promptVersion}
                    onChange={(e) => setPromptVersion(e.target.value)}
                  />
                </div>
              </div>
              <Textarea
                placeholder="System prompt..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="space-y-2">
        <Button 
          onClick={handleSubmit} 
          disabled={!canSubmit || isProcessing}
          size="lg"
          className="w-full gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing... {formatElapsedTime(elapsedSeconds)}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run
            </>
          )}
        </Button>
        {isProcessing && (
          <p className="text-xs text-muted-foreground text-center">
            Long transcripts may take several minutes to process
          </p>
        )}
      </div>
    </div>
  );
}

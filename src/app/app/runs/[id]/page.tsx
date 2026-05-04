"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, CheckCircle, XCircle, Clock, DollarSign, Zap, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RunDetail {
  id: string;
  task_spec: any;
  prompt_bundle: any;
  model_selection: any;
  output: string;
  verification: any;
  metadata: {
    cost_usd: number;
    latency_ms: number;
    tokens_used: number;
    created_at: string;
  };
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  // Template saving state
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRunDetail(params.id as string);
    }
  }, [params.id]);

  const fetchRunDetail = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/runs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch run details");

      const data = await response.json();
      setRun(data.run);
    } catch (error) {
      console.error("Error fetching run:", error);
      toast.error("Failed to load run details");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSaveTemplate = async () => {
    if (!run?.task_spec || !templateName) {
      toast.error("Name is required");
      return;
    }

    try {
      setSavingTemplate(true);
      const token = localStorage.getItem("bearer_token");

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDesc,
          task_spec: run.task_spec,
          family: run.task_spec.family,
          tags: ["from-run"]
        })
      });

      if (res.ok) {
        toast.success("Template saved successfully");
        setTemplateOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save template");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving template");
    } finally {
      setSavingTemplate(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading run details...</div>
        </div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">Run not found</div>
          <Button onClick={() => router.push("/app/runs")} variant="outline">
            Back to Runs
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <div className="mb-8">
        <Button onClick={() => router.push("/app/runs")} variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Runs
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Run Details</h1>
            <p className="text-muted-foreground mt-1">{run.task_spec.goal}</p>
          </div>
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save this run's configuration as a reusable template.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Monthly Report Generator"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder="What does this template do?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                  {savingTemplate ? "Saving..." : "Save Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Cost</p>
              <p className="text-2xl font-bold">${run.metadata.cost_usd.toFixed(4)}</p>
            </div>
            <DollarSign className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Latency</p>
              <p className="text-2xl font-bold">{run.metadata.latency_ms}ms</p>
            </div>
            <Clock className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Tokens</p>
              <p className="text-2xl font-bold">{run.metadata.tokens_used.toLocaleString()}</p>
            </div>
            <Zap className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="output" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="taskspec">TaskSpec</TabsTrigger>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="model">Model Selection</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Output</h3>
              <Button onClick={() => copyToClipboard(run.output, "Output")} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4">{run.output}</pre>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="taskspec" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Task Specification</h3>
              <Button onClick={() => copyToClipboard(JSON.stringify(run.task_spec, null, 2), "TaskSpec")} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy JSON
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Goal</p>
                <p>{run.task_spec.goal}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Task Family</p>
                <Badge>{run.task_spec.family}</Badge>
              </div>
              {run.task_spec.context && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Context</p>
                  <p className="text-sm">{run.task_spec.context}</p>
                </div>
              )}
              {run.task_spec.acceptance_criteria && run.task_spec.acceptance_criteria.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">Acceptance Criteria</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {run.task_spec.acceptance_criteria.map((criterion: string, idx: number) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Full Specification</p>
                <pre className="text-xs overflow-auto rounded-lg bg-muted p-4">{JSON.stringify(run.task_spec, null, 2)}</pre>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Compiled Prompt</h3>
              <Button onClick={() => copyToClipboard(JSON.stringify(run.prompt_bundle, null, 2), "Prompt")} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">System Message</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{run.prompt_bundle.system}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Instructions</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{run.prompt_bundle.instructions}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">User Prompt</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{run.prompt_bundle.user_prompt}</pre>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Model Selection</h3>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Selected Model</p>
                <Badge className="text-base">{run.model_selection.recommended_model}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Rationale</p>
                <p className="text-sm">{run.model_selection.rationale}</p>
              </div>
              {run.model_selection.alternatives && run.model_selection.alternatives.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">Alternatives</p>
                  <div className="space-y-2">
                    {run.model_selection.alternatives.map((alt: any, idx: number) => (
                      <Card key={idx} className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant="outline">{alt.model}</Badge>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Cost: {alt.est_cost_score}/5</Badge>
                            <Badge variant="secondary">Speed: {alt.est_latency_score}/5</Badge>
                            <Badge variant="secondary">Quality: {alt.est_quality_score}/5</Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">{alt.reason}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Verification Results</h3>
            {run.verification ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {run.verification.passed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{run.verification.passed ? "All checks passed" : "Some checks failed"}</p>
                    <p className="text-muted-foreground text-sm">Overall score: {run.verification.grade}/5</p>
                  </div>
                </div>
                {run.verification.issues && run.verification.issues.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">Issues Found</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {run.verification.issues.map((issue: string, idx: number) => (
                        <li key={idx} className="text-red-600">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {run.verification.repair_prompt && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">Suggested Repair Prompt</p>
                    <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{run.verification.repair_prompt}</pre>
                  </div>
                )}
                {run.verification.reasoning && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">Judge Reasoning</p>
                    <p className="text-sm">{run.verification.reasoning}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No verification data available</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

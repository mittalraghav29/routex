"use client";
import * as React from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Play, Wand2, ShieldCheck, Route as RouteIcon, ChevronRight, Loader2, FileText, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";

export const PlaygroundShell: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<"idle" | "compiling" | "routing" | "executing" | "verifying">("idle");

  // TaskSpec state
  const [taskSpec, setTaskSpec] = React.useState({
    family: "write",
    goal: "Write a professional email responding to a customer inquiry",
    context: "Customer asked about product features and pricing",
    constraints: {
      length: "medium",
      style: ["formal"],
      tone: ["professional"],
      language: "en-US",
      cost_cap_usd: 0.50,
      latency_target_s: 10
    },
    acceptance_criteria: [
      "Address all customer questions",
      "Maintain professional tone",
      "Include clear call-to-action"
    ],
    format: "markdown"
  });

  const [taskSpecJson, setTaskSpecJson] = React.useState(JSON.stringify(taskSpec, null, 2));

  // Prompt bundle state
  const [promptBundle, setPromptBundle] = React.useState<any>(null);

  // Model selection state
  const [modelSelection, setModelSelection] = React.useState<any>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>("");

  // Execution state
  const [output, setOutput] = React.useState<string>("");
  const [executionMetadata, setExecutionMetadata] = React.useState<any>(null);
  const [availableModels, setAvailableModels] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => setAvailableModels(data))
      .catch(err => console.error('Failed to load models:', err));
  }, []);

  // Verification state
  const [verification, setVerification] = React.useState<any>(null);
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);

  // Load template from local storage if available
  React.useEffect(() => {
    const templateJson = localStorage.getItem("playground_template");
    if (templateJson) {
      try {
        const parsed = JSON.parse(templateJson);
        setTaskSpec(parsed);
        setTaskSpecJson(JSON.stringify(parsed, null, 2));
        localStorage.removeItem("playground_template");
        toast.success("Template loaded successfully");
      } catch (error) {
        console.error("Failed to load template:", error);
      }
    }
  }, []);

  // Update JSON when object changes
  React.useEffect(() => {
    try {
      setTaskSpecJson(JSON.stringify(taskSpec, null, 2));
    } catch (error) {
      // If taskSpec is somehow invalid, don't update JSON
      console.error("Error stringifying taskSpec:", error);
    }
  }, [taskSpec]);

  const requireAuth = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    if (!token) {
      toast.error("Please sign in to use the playground");
      router.push("/login?redirect=" + encodeURIComponent("/app/playground"));
      return null;
    }
    return token;
  };

  const handleCompile = async () => {
    const token = requireAuth();
    if (!token) return null;

    setLoading(true);
    setStep("compiling");

    try {
      const parsedSpec = JSON.parse(taskSpecJson);

      const response = await fetch("/api/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task_spec: parsedSpec }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Compilation failed");
      }

      const data = await response.json();
      setPromptBundle(data.prompt_bundle);
      toast.success("TaskSpec compiled successfully!");

      // Auto-route after compile needs to return data
      return data.prompt_bundle;
    } catch (error: any) {
      console.error("Compile error:", error);
      toast.error(error.message || "Failed to compile TaskSpec");
      return null;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleRoute = async (spec?: any, authToken?: string) => {
    const token = authToken || requireAuth();
    if (!token) return null;

    setLoading(true);
    setStep("routing");

    try {
      const parsedSpec = spec || JSON.parse(taskSpecJson);

      const response = await fetch("/api/route-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task_spec: parsedSpec }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Routing failed");
      }

      const data = await response.json();
      setModelSelection(data);
      setSelectedModel(data.recommended_model);
      toast.success(`Recommended model: ${data.recommended_model}`);
      return data.recommended_model;
    } catch (error: any) {
      console.error("Route error:", error);
      toast.error(error.message || "Failed to route model");
      return null;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleExecute = async (overrideBundle?: any, overrideModel?: string) => {
    const token = requireAuth();
    if (!token) return null;

    const bundleToUse = overrideBundle || promptBundle;
    const modelToUse = overrideModel || selectedModel;

    if (!bundleToUse || !modelToUse) {
      toast.error("Please compile and route first");
      return null;
    }

    setLoading(true);
    setStep("executing");
    setOutput("");
    setExecutionMetadata(null);
    setVerification(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt_bundle: bundleToUse,
          model: modelToUse,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Execution failed");
      }

      const data = await response.json();
      setOutput(data.output);
      setExecutionMetadata(data.metadata);
      toast.success("Task executed successfully!");

      // Save run to dashboard
      if (data.metadata) {
        try {
          // First, save the TaskSpec
          const taskSpecResponse = await fetch("/api/task-specs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ task_spec: JSON.parse(taskSpecJson) }),
          });

          if (!taskSpecResponse.ok) {
            const error = await taskSpecResponse.json();
            throw new Error(error.error || "Failed to save TaskSpec");
          }

          const savedTaskSpec = await taskSpecResponse.json();

          // Then save the Run with the taskSpecId
          const runResponse = await fetch("/api/runs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              taskSpecId: savedTaskSpec.id,
              model: data.metadata?.model || modelToUse,
              tokens: data.metadata?.tokens_used || 0,
              costUsd: data.metadata?.cost_usd || 0,
              latencyMs: data.metadata?.latency_ms || 0,
              output: data.output,
              status: "succeeded",
            }),
          });

          if (runResponse.ok) {
            const savedRun = await runResponse.json();
            if (savedRun.id) {
              setCurrentRunId(savedRun.id.toString());
            }
            toast.success("Run saved to dashboard!");
          } else {
            console.error("Failed to save run:", await runResponse.text());
          }
        } catch (saveError) {
          console.error("Error saving run:", saveError);
        }
      }

      // Auto-verify after execute (if enabled/configured)
      await handleVerify(JSON.parse(taskSpecJson), data.output, token);

      return { output: data.output, metadata: data.metadata };
    } catch (error: any) {
      console.error("Execute error:", error);
      toast.error(error.message || "Failed to execute prompt");
      setOutput(`Error: ${error.message || "Failed to execute task"}`);
      return null;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleRepair = async () => {
    if (!verification || !verification.repair_prompt || !promptBundle) return;

    // Enhance instructions with specific issues to prevent recurrence
    const issuesList = verification.issues || [];
    const addedInstructions = issuesList.length > 0
      ? `\n\nCRITICAL: The previous output failed verification. You MUST address the following issues:\n${issuesList.map((i: string) => `- ${i}`).join('\n')}`
      : "";

    // Construct repair bundle updates
    const repairBundle = {
      ...promptBundle,
      instructions: promptBundle.instructions + addedInstructions,
      userMessage: verification.repair_prompt,
      user_prompt: verification.repair_prompt,
    };

    // Update the UI state so the user sees the new improved prompt
    setPromptBundle(repairBundle);

    toast.info("Starting auto-repair...");
    await handleExecute(repairBundle);
  };

  const handleVerify = async (spec?: any, outputText?: string, authToken?: string) => {
    const token = authToken || requireAuth();
    if (!token) return;

    setLoading(true);
    setStep("verifying");

    try {
      const parsedSpec = spec || JSON.parse(taskSpecJson);
      const verifyOutput = outputText || output;

      if (!verifyOutput) {
        toast.error("No output to verify");
        return;
      }

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_spec: parsedSpec,
          output: verifyOutput,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      const data = await response.json();
      setVerification(data);

      // Save verdict to the run if we have a current run ID
      if (currentRunId) {
        try {
          await fetch(`/api/runs/${currentRunId}`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              verdict: data
            }),
          });
        } catch (patchError) {
          console.error("Failed to update run with verification:", patchError);
        }
      }

      if (data.passed) {
        toast.success(`Verification passed! Score: ${data.grade}/5`);
      } else {
        toast.error(`Verification failed. Score: ${data.grade}/5`);
      }
    } catch (error: any) {
      console.error("Verify error:", error);
      toast.error(error.message || "Failed to verify output");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleFullRun = async () => {
    const token = requireAuth();
    if (!token) return;

    try {
      // 1. Compile
      const bundle = await handleCompile();
      if (!bundle) return;

      // 2. Route
      const model = await handleRoute(JSON.parse(taskSpecJson), token);
      if (!model) return;

      // 3. Execute
      // We pass bundle and model explicitly because state updates might not be ready
      const result = await handleExecute(bundle, model);

      // 4. Verify happens automatically in handleExecute, or we can explicit here.
      // handleExecute calls handleVerify at the end already.
    } catch (error) {
      console.error("Full run failed:", error);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleTaskSpecChange = (value: string) => {
    setTaskSpecJson(value);
    try {
      const parsed = JSON.parse(value);
      setTaskSpec(parsed);
    } catch {
      // Invalid JSON, don't update taskSpec
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)]">
      <ResizablePanelGroup direction="horizontal" className="rounded-2xl border bg-card/50 p-2">
        {/* TaskSpec Panel */}
        <ResizablePanel defaultSize={32} minSize={24} className="p-2">
          <Card className="h-full overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">TaskSpec</h3>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(taskSpecJson, "TaskSpec")}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
            <Tabs defaultValue="json" className="h-[calc(100%-3rem)]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="form">Form</TabsTrigger>
              </TabsList>
              <TabsContent value="json" className="mt-3 h-[calc(100%-3rem)]">
                <Textarea
                  className="h-full font-mono text-xs"
                  value={taskSpecJson}
                  onChange={(e) => handleTaskSpecChange(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="form" className="mt-3 space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 text-xs">Task Family</label>
                  <Select value={taskSpec.family} onValueChange={(v) => {
                    const updated = { ...taskSpec, family: v };
                    setTaskSpec(updated);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="analyze">Analyze</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="translate">Translate</SelectItem>
                      <SelectItem value="summarize">Summarize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 text-xs">Goal</label>
                  <Textarea
                    placeholder="What do you want to achieve?"
                    value={taskSpec.goal}
                    onChange={(e) => {
                      const updated = { ...taskSpec, goal: e.target.value };
                      setTaskSpec(updated);
                    }}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 text-xs">Context</label>
                  <Textarea
                    placeholder="Additional context..."
                    value={taskSpec.context}
                    onChange={(e) => {
                      const updated = { ...taskSpec, context: e.target.value };
                      setTaskSpec(updated);
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </ResizablePanel>

        <ResizableHandle className="w-2" />

        {/* Prompt Bundle Panel */}
        <ResizablePanel defaultSize={36} minSize={28} className="p-2">
          <Card className="h-full overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Prompt Bundle</h3>
              {step === "compiling" && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {promptBundle ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">System</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(promptBundle.system, "System prompt")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea className="min-h-24 font-mono text-xs" value={promptBundle.system} readOnly />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">Instructions</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(promptBundle.instructions, "Instructions")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea className="min-h-24 font-mono text-xs" value={promptBundle.instructions} readOnly />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">User Prompt</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(promptBundle.user_prompt, "User prompt")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea className="min-h-24 font-mono text-xs" value={promptBundle.user_prompt} readOnly />
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Click "Compile" to generate prompts
              </div>
            )}
          </Card>
        </ResizablePanel>

        <ResizableHandle className="w-2" />



        {/* Model Selector Panel */}
        <ResizablePanel defaultSize={32} minSize={24} className="p-2">
          <Card className="h-full overflow-auto p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Model Selector</h3>
                {step === "routing" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {/* Manual Selector */}
              <div className="mb-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">${model.costPer1kTokens.toFixed(4)}/1k tokens</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {modelSelection ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-primary/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge>Recommended</Badge>
                    <Button
                      size="sm"
                      variant={selectedModel === modelSelection.recommended_model ? "default" : "outline"}
                      onClick={() => setSelectedModel(modelSelection.recommended_model)}
                    >
                      {selectedModel === modelSelection.recommended_model ? "Selected" : "Select"}
                    </Button>
                  </div>
                  <div className="font-medium">{modelSelection.recommended_model}</div>
                  <p className="text-muted-foreground mt-1 text-xs">{modelSelection.rationale}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">Cost: {modelSelection.est_cost_usd}</Badge>
                    <Badge variant="outline" className="text-xs">Latency: {modelSelection.est_latency_s}s</Badge>
                  </div>
                </div>

                {modelSelection.alternatives && modelSelection.alternatives.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-medium">Alternatives</p>
                    {modelSelection.alternatives.map((alt: any, idx: number) => (
                      <div key={idx} className="mb-2 rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium text-sm">{alt.model}</div>
                          <Button
                            size="sm"
                            variant={selectedModel === alt.model ? "default" : "outline"}
                            onClick={() => setSelectedModel(alt.model)}
                          >
                            {selectedModel === alt.model ? "Selected" : "Select"}
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Compile TaskSpec to get model recommendations, or select manually above.
              </div>
            )}
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup >

      {/* Control Panel */}
      <div className="flex items-center gap-2 mb-4 p-4 border-t bg-background sticky bottom-0 z-10">
        <Button onClick={handleFullRun} className="gap-2 font-bold" disabled={loading} size="lg">
          <Play className="h-4 w-4" />
          {step === "executing" ? "Running..." : "Run Full Pipeline"}
        </Button>

        <Button onClick={() => router.push("/app/templates")} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Browse Templates
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        <Button onClick={handleCompile} variant="secondary" disabled={loading}>
          <ListChecks className="mr-2 h-4 w-4" />
          Compile
        </Button>

        <Button onClick={() => handleRoute()} variant="secondary" disabled={loading || !promptBundle}>
          <RouteIcon className="mr-2 h-4 w-4" />
          Route
        </Button>

        <Button onClick={() => handleExecute()} variant="secondary" disabled={loading || !promptBundle || !selectedModel}>
          <Play className="mr-2 h-4 w-4" />
          Execute
        </Button>

        <Button onClick={() => handleVerify()} variant="secondary" disabled={loading || !output}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Verify
        </Button>
      </div>

      {/* Output Section */}
      <Card className="min-h-48 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-sm">Output</h4>
          {executionMetadata && (
            <div className="flex gap-2">
              <Badge variant="outline">${executionMetadata.cost_usd}</Badge>
              <Badge variant="outline">{executionMetadata.latency_ms}ms</Badge>
              <Badge variant="outline">{executionMetadata.tokens_used} tokens</Badge>
            </div>
          )}
        </div>
        {output ? (
          <div>
            <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{output}</pre>
            {verification && (
              <div className={`rounded-lg border p-4 ${verification.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {verification.passed ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {verification.passed ? "Verification Passed" : "Verification Failed"}
                    </span>
                  </div>
                  <Badge variant="outline">Score: {verification.grade}/5</Badge>
                </div>
                {verification.reasoning && (
                  <p className="text-muted-foreground text-sm">{verification.reasoning}</p>
                )}
                {verification.issues && verification.issues.length > 0 && (
                  <div className="mt-2">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">Issues:</p>
                    <ul className="list-disc space-y-1 pl-5 text-xs">
                      {verification.issues.map((issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {verification.repair_prompt && (
                  <div className="mt-3">
                    <p className="text-muted-foreground mb-2 text-xs font-medium">Suggested Repair:</p>
                    <pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{verification.repair_prompt}</pre>

                    {!verification.passed && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={handleRepair}
                        disabled={loading}
                      >
                        <Wand2 className="mr-2 h-3 w-3" />
                        Repair & Re-ask
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
            {loading ? `${step}...` : "Click 'Run Full Pipeline' to see output"}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlaygroundShell;
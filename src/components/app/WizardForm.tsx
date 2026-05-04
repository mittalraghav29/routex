"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Wand2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const TASK_FAMILIES = [
  { id: "write", label: "Write", description: "Create content like articles, emails, or reports", icon: "✍️" },
  { id: "code", label: "Code", description: "Generate or refactor code", icon: "💻" },
  { id: "analyze", label: "Analyze", description: "Analyze data or provide insights", icon: "📊" },
  { id: "plan", label: "Plan", description: "Create strategic plans or roadmaps", icon: "📋" },
  { id: "translate", label: "Translate", description: "Translate text between languages", icon: "🌐" },
  { id: "summarize", label: "Summarize", description: "Condense long content into summaries", icon: "📝" },
  { id: "rag", label: "Q&A / RAG", description: "Answer questions using provided context", icon: "💬" },
  { id: "classify", label: "Classify", description: "Categorize or classify content", icon: "🏷️" },
  { id: "extract", label: "Extract", description: "Extract structured data from text", icon: "🔍" },
  { id: "critique", label: "Critique", description: "Provide constructive feedback", icon: "🎯" },
];

const STYLE_OPTIONS = ["formal", "casual", "technical", "creative", "academic", "conversational"];
const TONE_OPTIONS = ["neutral", "persuasive", "informative", "friendly", "professional", "enthusiastic"];
const LENGTH_OPTIONS = [
  { value: "short", label: "Short (50-300 words)" },
  { value: "medium", label: "Medium (300-800 words)" },
  { value: "long", label: "Long (800+ words)" },
];

interface WizardFormProps {
  onComplete?: (taskSpecId: number) => void;
}

export function WizardForm({ onComplete }: WizardFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [family, setFamily] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [context, setContext] = React.useState("");
  const [inputs, setInputs] = React.useState<string[]>([""]);
  const [audience, setAudience] = React.useState("");
  const [format, setFormat] = React.useState("");
  const [length, setLength] = React.useState("medium");
  const [style, setStyle] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState<string[]>([]);
  const [language, setLanguage] = React.useState("en-US");
  const [costCap, setCostCap] = React.useState(0.5);
  const [latencyTarget, setLatencyTarget] = React.useState(10);
  const [criteria, setCriteria] = React.useState<string[]>([""]);
  const [explainWhy, setExplainWhy] = React.useState(true);

  const totalSteps = 5;

  const canProceed = () => {
    if (step === 1) return family !== "";
    if (step === 2) return goal.trim() !== "";
    if (step === 3) return true; // Optional fields
    if (step === 4) return criteria.some(c => c.trim() !== "");
    return true;
  };

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const addCriterion = () => {
    setCriteria([...criteria, ""]);
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...criteria];
    updated[index] = value;
    setCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const addInput = () => {
    setInputs([...inputs, ""]);
  };

  const updateInput = (index: number, value: string) => {
    const updated = [...inputs];
    updated[index] = value;
    setInputs(updated);
  };

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index));
    }
  };

  const toggleStyle = (styleOption: string) => {
    if (style.includes(styleOption)) {
      setStyle(style.filter(s => s !== styleOption));
    } else {
      setStyle([...style, styleOption]);
    }
  };

  const toggleTone = (toneOption: string) => {
    if (tone.includes(toneOption)) {
      setTone(tone.filter(t => t !== toneOption));
    } else {
      setTone([...tone, toneOption]);
    }
  };

  const handleSubmit = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    if (!token) {
      toast.error("Please sign in to create TaskSpec");
      router.push("/login?redirect=" + encodeURIComponent("/app/wizard"));
      return;
    }

    setLoading(true);
    try {
      const taskSpecData = {
        family,
        goal: goal.trim(),
        context: context.trim() || null,
        inputs: inputs.filter(i => i.trim()).map(i => ({ type: "text", value: i.trim() })),
        constraints: {
          length,
          style: style.length > 0 ? style : undefined,
          tone: tone.length > 0 ? tone : undefined,
          language,
          cost_cap_usd: costCap,
          latency_target_s: latencyTarget,
        },
        audience: audience.trim() || null,
        format: format.trim() || null,
        acceptanceCriteria: criteria.filter(c => c.trim()),
        privacy: {
          allow_provider_logging: false,
          local_only: false,
        },
        userPrefs: {
          explain_why: explainWhy,
          show_alternatives: 2,
        },
      };

      const res = await fetch("/api/task-specs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskSpecData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Failed to create TaskSpec");
        return;
      }

      const data = await res.json();
      toast.success("TaskSpec created successfully!");
      
      if (onComplete) {
        onComplete(data.id);
      } else {
        router.push("/app/playground");
      }
    } catch (error: any) {
      toast.error("Failed to create TaskSpec");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 md:p-8">
        {/* Step 1: Task Family */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">What type of task?</h2>
              <p className="text-muted-foreground">Choose the category that best matches your goal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TASK_FAMILIES.map((taskFamily) => (
                <button
                  key={taskFamily.id}
                  onClick={() => setFamily(taskFamily.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    family === taskFamily.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{taskFamily.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{taskFamily.label}</div>
                      <p className="text-sm text-muted-foreground mt-1">{taskFamily.description}</p>
                    </div>
                    {family === taskFamily.id && (
                      <Check className="size-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal & Context */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">What's your goal?</h2>
              <p className="text-muted-foreground">Describe what you want to accomplish</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="goal">Goal *</Label>
                <Textarea
                  id="goal"
                  placeholder="E.g., Draft a 600-word blog post about sustainable concrete for civil contractors"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="context">Context (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide any background information, constraints, or special requirements"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Inputs (optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">Add any reference materials or data</p>
                <div className="space-y-2">
                  {inputs.map((input, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Enter text, URL, or file reference"
                        value={input}
                        onChange={(e) => updateInput(index, e.target.value)}
                      />
                      {inputs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInput(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addInput} className="gap-1">
                    <Plus className="size-4" /> Add Input
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Constraints & Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Constraints & Preferences</h2>
              <p className="text-muted-foreground">Fine-tune how the output should be generated</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="E.g., Technical stakeholders, General public"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="format">Output Format</Label>
                <Input
                  id="format"
                  placeholder="E.g., Markdown, JSON, HTML"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Style</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {STYLE_OPTIONS.map((s) => (
                  <Badge
                    key={s}
                    variant={style.includes(s) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStyle(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {TONE_OPTIONS.map((t) => (
                  <Badge
                    key={t}
                    variant={tone.includes(t) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTone(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Cost Cap: ${costCap.toFixed(2)}</Label>
                <Slider
                  value={[costCap]}
                  onValueChange={([v]) => setCostCap(v)}
                  min={0.01}
                  max={2}
                  step={0.01}
                  className="mt-3"
                />
              </div>
            </div>

            <div>
              <Label>Latency Target: {latencyTarget}s</Label>
              <Slider
                value={[latencyTarget]}
                onValueChange={([v]) => setLatencyTarget(v)}
                min={1}
                max={30}
                step={1}
                className="mt-3"
              />
            </div>
          </div>
        )}

        {/* Step 4: Acceptance Criteria */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Acceptance Criteria</h2>
              <p className="text-muted-foreground">Define what makes the output successful</p>
            </div>

            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Criterion ${index + 1}: E.g., Must include 3 actionable tips`}
                    value={criterion}
                    onChange={(e) => updateCriterion(index, e.target.value)}
                  />
                  {criteria.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCriterion} className="gap-1">
                <Plus className="size-4" /> Add Criterion
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="explainWhy"
                checked={explainWhy}
                onChange={(e) => setExplainWhy(e.target.checked)}
                className="size-4 rounded"
              />
              <Label htmlFor="explainWhy" className="cursor-pointer">
                Show me why prompts and models work (learning mode)
              </Label>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Review & Create</h2>
              <p className="text-muted-foreground">Confirm your TaskSpec before creating</p>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <span className="text-sm text-muted-foreground">Task Family:</span>
                <p className="font-medium capitalize">{family}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Goal:</span>
                <p className="font-medium">{goal}</p>
              </div>
              {context && (
                <div>
                  <span className="text-sm text-muted-foreground">Context:</span>
                  <p className="text-sm">{context}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Acceptance Criteria:</span>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {criteria.filter(c => c.trim()).map((c, i) => (
                    <li key={i} className="text-sm">{c}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">{length} length</Badge>
                {style.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                {tone.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                <Badge variant="secondary">${costCap} cap</Badge>
                <Badge variant="secondary">{latencyTarget}s target</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="gap-2"
            >
              <Wand2 className="size-4" />
              {loading ? "Creating..." : "Create TaskSpec"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

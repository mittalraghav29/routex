"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, PlayCircle, Lightbulb, Target, Zap, Award } from "lucide-react";
import Link from "next/link";

const LESSONS = [
  {
    id: "basics",
    level: 1,
    title: "Prompting Basics",
    duration: "5 min",
    description: "Learn how to write clear goals, constraints, and acceptance criteria",
    icon: "📚",
    topics: [
      "What makes a good prompt?",
      "The importance of clear goals",
      "Defining acceptance criteria",
      "Common pitfalls to avoid"
    ],
    content: `
# Prompting Basics

## What Makes a Good Prompt?

A good prompt is **specific**, **contextual**, and **measurable**. Instead of saying "write something about AI," say:

> "Write a 500-word blog post explaining how AI improves healthcare diagnostics, targeting medical professionals, with 3 real-world examples."

## The Importance of Clear Goals

Your goal should answer:
- **What** do you want to create?
- **Why** is it needed?
- **Who** is it for?

**Bad goal:** "Make a plan"
**Good goal:** "Create a 6-month product roadmap for our AI translation app, including milestones, resource needs, and success metrics"

## Defining Acceptance Criteria

Acceptance criteria are your quality checkpoints. They should be:
- Specific and measurable
- Directly related to your goal
- Realistic and achievable

**Example criteria:**
- Must include 3 actionable recommendations
- Should cite at least 2 credible sources
- Tone must be professional yet approachable

## Common Pitfalls to Avoid

❌ Being too vague: "Write something good"
✅ Being specific: "Write a 300-word product description highlighting eco-friendly features"

❌ No constraints: Letting the model decide everything
✅ Clear constraints: "Formal tone, UK English, under 500 words"

❌ Impossible standards: "Must be perfect and viral"
✅ Realistic standards: "Should engage readers and explain clearly"
    `,
    quiz: [
      {
        question: "Which goal is better defined?",
        options: [
          "Write a blog post",
          "Write a 600-word blog post about sustainable concrete for civil contractors with 3 actionable tips",
          "Write something about construction",
        ],
        correct: 1,
      }
    ]
  },
  {
    id: "task-families",
    level: 2,
    title: "Understanding Task Families",
    duration: "8 min",
    description: "How different task types require different prompting strategies",
    icon: "🎯",
    topics: [
      "Write vs Code vs Analyze",
      "When to use each family",
      "Task-specific best practices",
      "Combining multiple tasks"
    ],
    content: `
# Understanding Task Families

Different tasks need different approaches. RouteX organizes work into **10 task families**, each optimized for specific outcomes.

## Write Tasks
**Best for:** Articles, emails, reports, creative content

**Key considerations:**
- Tone and style matter most
- Audience awareness is critical
- Examples and voice references help

**Example:** "Draft a friendly welcome email for new customers, highlighting our 24/7 support and 30-day guarantee"

## Code Tasks
**Best for:** Programming, scripts, refactoring

**Key considerations:**
- Specify language/framework
- Include error handling requirements
- Provide context about existing codebase

**Example:** "Write a Python function to validate email addresses using regex, with unit tests and error handling"

## Analyze Tasks
**Best for:** Data insights, comparisons, evaluations

**Key considerations:**
- Define what "good" looks like
- Specify depth of analysis
- Request evidence-based conclusions

**Example:** "Analyze Q4 sales data to identify top 3 growth opportunities, with supporting metrics"

## When to Combine Task Families

Sometimes tasks overlap:
- Write + Analyze: "Analyze user feedback and write a summary report"
- Code + Plan: "Create implementation plan for the shopping cart refactor"

**Pro tip:** Break complex tasks into sequential steps using multiple TaskSpecs.
    `,
    quiz: [
      {
        question: "Which task family is best for 'Generate a marketing strategy for Q1'?",
        options: ["Write", "Plan", "Analyze", "Code"],
        correct: 1,
      }
    ]
  },
  {
    id: "model-selection",
    level: 3,
    title: "Model Selection & Trade-offs",
    duration: "10 min",
    description: "Understanding cost, quality, and latency trade-offs across models",
    icon: "⚖️",
    topics: [
      "Cost vs Quality vs Speed",
      "Model strengths and weaknesses",
      "When to use GPT-4 vs Claude vs Gemini",
      "Privacy and local models"
    ],
    content: `
# Model Selection & Trade-offs

Choosing the right model is like picking the right tool for a job.

## The Three Axes: Cost, Quality, Speed

Every model balances three factors:

### 1. **Quality** (Accuracy, coherence, reasoning)
- High: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro
- Medium: GPT-4o Mini, Claude 3 Haiku
- Fast: GPT-3.5 Turbo, Gemini Flash

### 2. **Cost** (Price per 1,000 tokens)
- Expensive: $0.003-0.005 (premium models)
- Moderate: $0.0005-0.002 (balanced models)
- Cheap: $0.00015-0.0005 (fast models)

### 3. **Speed** (Response latency)
- Slow: 2-4 seconds (large reasoning models)
- Medium: 1-2 seconds (balanced models)
- Fast: <1 second (lightweight models)

## The Router Does This For You!

RouteX's model router automatically:
- Matches task families to model strengths
- Respects your cost/latency constraints
- Suggests alternatives with clear trade-offs

**Pro tip:** Start with recommended models, then adjust based on results.
    `,
    quiz: [
      {
        question: "Which model would you choose for a simple email classification task with 10,000 emails/day?",
        options: [
          "GPT-4o (expensive, highest quality)",
          "Claude 3.5 Sonnet (expensive, best reasoning)",
          "GPT-4o Mini (cheap, fast, good enough)",
          "Local model (free, privacy-first)"
        ],
        correct: 2,
      }
    ]
  },
  {
    id: "debugging",
    level: 4,
    title: "Debugging & Self-Repair",
    duration: "7 min",
    description: "Fix issues, improve outputs, and prevent hallucinations",
    icon: "🔧",
    topics: [
      "Common output issues",
      "Using verification results",
      "The repair loop",
      "Hallucination mitigation for RAG"
    ],
    content: `
# Debugging & Self-Repair

Even with great prompts, outputs sometimes miss the mark. Here's how to fix them.

## Common Output Issues

### 1. **Off-topic or vague**
**Fix:** Make your goal more specific and add context

Before: "Write about marketing"
After: "Write a 400-word guide on email marketing best practices for small e-commerce brands"

### 2. **Wrong tone/style**
**Fix:** Explicitly specify tone and provide examples

Add: "Tone: friendly and approachable, like talking to a colleague over coffee"

## Using the Verifier

RouteX automatically checks outputs against your criteria:

✅ **Green checks** = Criterion met
⚠️ **Yellow warnings** = Partially met
❌ **Red X** = Not met

## The Repair Loop

Instead of starting over, repair:

1. **Identify gaps:** Verifier shows what's missing
2. **Generate repair prompt:** System auto-creates improvement instructions
3. **Re-execute:** Same context, focused fixes
4. **Verify again:** Check if issues are resolved

**Pro tip:** Repair is usually faster and cheaper than re-running from scratch.
    `,
    quiz: [
      {
        question: "What's the best first step when output doesn't meet your needs?",
        options: [
          "Switch to a more expensive model",
          "Start over with a completely new prompt",
          "Check the verification results and use the repair loop",
          "Give up and do it manually"
        ],
        correct: 2,
      }
    ]
  }
];

const MODEL_CAPABILITIES = [
  {
    name: "GPT-4o",
    provider: "OpenAI",
    strengths: ["Reasoning", "Code", "General"],
    cost: "$$$$",
    speed: "Medium",
    quality: "95/100",
    bestFor: "Complex analysis, detailed writing, coding tasks"
  },
  {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    strengths: ["Reasoning", "Writing", "Analysis"],
    cost: "$$$",
    speed: "Medium-Slow",
    quality: "96/100",
    bestFor: "Long-form writing, nuanced analysis, creative content"
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    strengths: ["Long context", "Multimodal", "Reasoning"],
    cost: "$$",
    speed: "Medium",
    quality: "92/100",
    bestFor: "Large documents, multi-step reasoning, research"
  },
  {
    name: "GPT-4o Mini",
    provider: "OpenAI",
    strengths: ["Speed", "Cost", "General"],
    cost: "$",
    speed: "Fast",
    quality: "85/100",
    bestFor: "Simple tasks, high-volume processing, quick iterations"
  },
];

export default function Page() {
  const [selectedLesson, setSelectedLesson] = React.useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = React.useState<Record<string, number>>({});

  const currentLesson = LESSONS.find(l => l.id === selectedLesson);

  const handleQuizAnswer = (lessonId: string, answer: number) => {
    setQuizAnswers({ ...quizAnswers, [lessonId]: answer });
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Center</h1>
        <p className="text-muted-foreground">Master AI prompting, model selection, and task optimization</p>
      </div>

      {!currentLesson ? (
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="models">Model Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4">
            <div className="grid gap-4">
              {LESSONS.map((lesson) => (
                <Card key={lesson.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedLesson(lesson.id)}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{lesson.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{lesson.title}</h3>
                        <Badge variant="secondary">Level {lesson.level}</Badge>
                        <Badge variant="outline">{lesson.duration}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{lesson.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {lesson.topics.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <PlayCircle className="size-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <Award className="size-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Complete All Lessons</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Master all 4 levels to become a RouteX expert
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }} />
                    </div>
                    <span className="text-sm font-medium">0/4</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Model Comparison Guide</h3>
              <p className="text-muted-foreground mb-6">
                Understand the strengths and trade-offs of each AI model
              </p>

              <div className="space-y-4">
                {MODEL_CAPABILITIES.map((model, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{model.name}</h4>
                        <p className="text-sm text-muted-foreground">{model.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Quality</div>
                        <div className="font-semibold text-primary">{model.quality}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Cost</div>
                        <div className="font-medium">{model.cost}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Speed</div>
                        <div className="font-medium">{model.speed}</div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <div className="text-xs text-muted-foreground">Strengths</div>
                        <div className="flex flex-wrap gap-1">
                          {model.strengths.map((s, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Best for:</div>
                      <p className="text-sm">{model.bestFor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-blue-500/5 border-blue-500/20">
              <div className="flex gap-3">
                <Lightbulb className="size-6 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Pro Tip: Let the Router Decide</h4>
                  <p className="text-sm text-muted-foreground">
                    RouteX's model router automatically selects the best model based on your task family, 
                    constraints, and quality requirements.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
              ← Back to Lessons
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                <Badge>Level {currentLesson.level}</Badge>
              </div>
              <p className="text-muted-foreground">{currentLesson.description}</p>
            </div>
          </div>

          <Card className="p-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {currentLesson.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-2xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                } else if (line.startsWith('> ')) {
                  return <blockquote key={i} className="border-l-4 border-primary pl-4 italic my-4">{line.slice(2)}</blockquote>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-bold my-2">{line.slice(2, -2)}</p>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-6">{line.slice(2)}</li>;
                } else if (line.startsWith('✅') || line.startsWith('❌')) {
                  return <p key={i} className="my-1">{line}</p>;
                } else if (line.trim()) {
                  return <p key={i} className="my-2">{line}</p>;
                }
                return <br key={i} />;
              })}
            </div>
          </Card>

          {currentLesson.quiz && currentLesson.quiz.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="size-5" />
                Quick Quiz
              </h3>
              {currentLesson.quiz.map((q, i) => {
                const userAnswer = quizAnswers[currentLesson.id];
                const isCorrect = userAnswer === q.correct;
                const hasAnswered = userAnswer !== undefined;

                return (
                  <div key={i} className="space-y-3">
                    <p className="font-medium">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option, j) => (
                        <button
                          key={j}
                          onClick={() => !hasAnswered && handleQuizAnswer(currentLesson.id, j)}
                          disabled={hasAnswered}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            hasAnswered
                              ? j === q.correct
                                ? "border-green-500 bg-green-500/10"
                                : userAnswer === j
                                ? "border-red-500 bg-red-500/10"
                                : "border-border opacity-50"
                              : "border-border hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {hasAnswered && j === q.correct && <CheckCircle2 className="size-5 text-green-500" />}
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {hasAnswered && (
                      <div className={`p-3 rounded-lg ${isCorrect ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                        <p className="text-sm">
                          {isCorrect ? "✅ Correct! Great job!" : "💡 Keep learning! The correct answer is highlighted above."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}

          <div className="flex gap-3">
            <Button asChild className="gap-2">
              <Link href="/app/playground">
                <Zap className="size-4" />
                Try in Playground
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setSelectedLesson(null)}>
              Back to Lessons
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
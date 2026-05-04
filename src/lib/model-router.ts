// Model Router Service
// Selects the best model based on task family, constraints, and performance telemetry

import { TaskSpec } from './prompt-compiler';
export type { TaskSpec };

export interface ModelInfo {
  id: string;
  provider: string;
  name: string;
  costPer1kTokens: number;
  avgLatencyMs: number;
  qualityScore: number; // 0-100
  strengths: string[];
  supportsStreaming: boolean;
  contextWindow: number;
}

export interface ModelRecommendation {
  model: ModelInfo;
  rationale: string;
  estimatedCost: number;
  estimatedLatency: number;
  alternatives: ModelInfo[];
}

// Model catalog with capabilities and performance metrics
// Model catalog with capabilities and performance metrics
const MODEL_CATALOG: ModelInfo[] = [
  {
    id: 'kimi-k2',
    provider: 'moonshot',
    name: 'Moonshot Kimi K2',
    costPer1kTokens: 0.002,
    avgLatencyMs: 1500,
    qualityScore: 88,
    strengths: ['coding', 'reasoning', 'tool-use', 'long-context'],
    supportsStreaming: true,
    contextWindow: 128000,
  },
  {
    id: 'llama-3.2-3b',
    provider: 'meta',
    name: 'Meta Llama 3.2 3B',
    costPer1kTokens: 0.0005,
    avgLatencyMs: 400,
    qualityScore: 82,
    strengths: ['speed', 'multilingual', 'instruction-following'],
    supportsStreaming: true,
    contextWindow: 131000,
  },
  {
    id: 'qwen-3-4b',
    provider: 'qwen',
    name: 'Qwen 3 4B',
    costPer1kTokens: 0.0006,
    avgLatencyMs: 500,
    qualityScore: 84,
    strengths: ['reasoning', 'dialogue', 'workflow'],
    supportsStreaming: true,
    contextWindow: 41000,
  },
  {
    id: 'gpt-oss-120b',
    provider: 'openai',
    name: 'GPT-OSS 120B',
    costPer1kTokens: 0.015,
    avgLatencyMs: 3500,
    qualityScore: 98,
    strengths: ['reasoning', 'agentic', 'complex-tasks'],
    supportsStreaming: true,
    contextWindow: 131000,
  },
  {
    id: 'gemma-3-12b',
    provider: 'google',
    name: 'Gemma 3 12B',
    costPer1kTokens: 0.003,
    avgLatencyMs: 1200,
    qualityScore: 90,
    strengths: ['multimodal', 'math', 'reasoning'],
    supportsStreaming: true,
    contextWindow: 128000,
  },
  {
    id: 'gemma-3n-2b',
    provider: 'google',
    name: 'Gemma 3n 2B',
    costPer1kTokens: 0.0002,
    avgLatencyMs: 300,
    qualityScore: 78,
    strengths: ['speed', 'mobile', 'multilingual'],
    supportsStreaming: true,
    contextWindow: 32000,
  },
  {
    id: 'gemma-3-4b',
    provider: 'google',
    name: 'Gemma 3 4B',
    costPer1kTokens: 0.0008,
    avgLatencyMs: 600,
    qualityScore: 85,
    strengths: ['multimodal', 'balance'],
    supportsStreaming: true,
    contextWindow: 128000,
  },
  {
    id: 'gemma-3n-4b',
    provider: 'google',
    name: 'Gemma 3n 4B',
    costPer1kTokens: 0.0008,
    avgLatencyMs: 550,
    qualityScore: 86,
    strengths: ['speed', 'multimodal', 'efficiency'],
    supportsStreaming: true,
    contextWindow: 32000,
  },
];

// Task family to model strength mapping
const TASK_TO_STRENGTHS: Record<string, string[]> = {
  write: ['writing', 'general'],
  code: ['code', 'reasoning'],
  analyze: ['analysis', 'reasoning'],
  plan: ['reasoning', 'general'],
  translate: ['general', 'multimodal'],
  summarize: ['general', 'speed'],
  rag: ['reasoning', 'long-context'],
  classify: ['reasoning', 'speed'],
  extract: ['reasoning', 'code'],
  critique: ['reasoning', 'writing'],
};

function scoreModelForTask(model: ModelInfo, taskSpec: TaskSpec): number {
  let score = model.qualityScore;

  // Boost score if model strengths match task requirements
  const requiredStrengths = TASK_TO_STRENGTHS[taskSpec.family] || ['general'];
  const strengthMatch = requiredStrengths.filter(s =>
    model.strengths.some(ms => ms.includes(s))
  ).length;
  score += strengthMatch * 10;

  // Consider cost constraints
  const constraints = taskSpec.constraints || {};
  if (constraints.cost_cap_usd) {
    const estimatedCost = (model.costPer1kTokens * 2); // Assume 2k tokens avg
    if (estimatedCost > constraints.cost_cap_usd) {
      score -= 30; // Penalize over-budget models
    }
  }

  // Consider latency constraints
  if (constraints.latency_target_s) {
    const targetMs = constraints.latency_target_s * 1000;
    if (model.avgLatencyMs > targetMs) {
      score -= 20; // Penalize slow models
    }
  }

  // Privacy considerations
  const privacy = taskSpec.privacy || {};
  if (privacy.local_only) {
    score -= 50; // Cloud models get penalized for local-only requests
  }

  return Math.max(0, score);
}

export function routeModel(taskSpec: TaskSpec): ModelRecommendation {
  // Score all models
  const scoredModels = MODEL_CATALOG.map(model => ({
    model,
    score: scoreModelForTask(model, taskSpec),
  })).sort((a, b) => b.score - a.score);

  const topModel = scoredModels[0].model;
  const alternatives = scoredModels.slice(1, 3).map(sm => sm.model);

  // Estimate costs (assuming 2k tokens as baseline)
  const estimatedTokens = 2000;
  const estimatedCost = (topModel.costPer1kTokens / 1000) * estimatedTokens;
  const estimatedLatency = topModel.avgLatencyMs;

  // Build rationale
  const rationale = buildRationale(topModel, taskSpec, scoredModels[0].score);

  return {
    model: topModel,
    rationale,
    estimatedCost,
    estimatedLatency,
    alternatives,
  };
}

function buildRationale(model: ModelInfo, taskSpec: TaskSpec, score: number): string {
  const reasons: string[] = [];
  const constraints = taskSpec.constraints || {};

  // Primary strength match
  const requiredStrengths = TASK_TO_STRENGTHS[taskSpec.family] || ['general'];
  const matchingStrengths = model.strengths.filter(ms =>
    requiredStrengths.some(rs => ms.includes(rs))
  );

  if (matchingStrengths.length > 0) {
    reasons.push(`Strong performance in ${matchingStrengths.join(' and ')}`);
  }

  // Cost consideration
  if (constraints.cost_cap_usd) {
    const estimatedCost = (model.costPer1kTokens * 2);
    if (estimatedCost <= constraints.cost_cap_usd) {
      reasons.push(`Fits within your $${constraints.cost_cap_usd} budget`);
    }
  } else if (model.costPer1kTokens < 0.001) {
    reasons.push('Cost-efficient option');
  }

  // Latency consideration
  if (constraints.latency_target_s) {
    const targetMs = constraints.latency_target_s * 1000;
    if (model.avgLatencyMs <= targetMs) {
      reasons.push(`Meets your ${constraints.latency_target_s}s latency target`);
    }
  } else if (model.avgLatencyMs < 1500) {
    reasons.push('Fast response time');
  }

  // Context window
  if (constraints.length === 'long' && model.contextWindow > 100000) {
    reasons.push('Large context window for long-form content');
  }

  // Quality
  if (model.qualityScore >= 90) {
    reasons.push('Top-tier quality and accuracy');
  }

  // Fallback
  if (reasons.length === 0) {
    reasons.push('Best overall balance of quality, cost, and speed');
  }

  return reasons.join('. ') + '.';
}

export function getModelById(modelId: string): ModelInfo | undefined {
  return MODEL_CATALOG.find(m => m.id === modelId);
}

export function getAllModels(): ModelInfo[] {
  return MODEL_CATALOG;
}

export function explainModelChoice(recommendation: ModelRecommendation): string {
  return `We selected ${recommendation.model.name} because it offers the best fit for your task. ${recommendation.rationale}\n\nEstimated cost: $${recommendation.estimatedCost.toFixed(4)} | Latency: ~${Math.round(recommendation.estimatedLatency / 1000)}s\n\nAlternative options: ${recommendation.alternatives.map(a => a.name).join(', ')}`;
}
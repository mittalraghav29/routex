// Prompt Compiler Service
// Converts TaskSpec into optimized prompt bundles for different task families

export interface TaskSpec {
  family: string;
  goal: string;
  context?: string;
  inputs?: any[];
  constraints?: {
    length?: string;
    style?: string[];
    tone?: string[];
    language?: string;
    cost_cap_usd?: number;
    latency_target_s?: number;
  };
  audience?: string;
  format?: string;
  acceptance_criteria?: string[];
  acceptanceCriteria?: string[];
  privacy?: {
    allow_provider_logging?: boolean;
    local_only?: boolean;
  };
  userPrefs?: {
    explain_why?: boolean;
    show_alternatives?: number;
  };
}

export interface PromptBundle {
  system: string;
  instructions: string;
  userMessage: string;
  user_prompt: string; // Alias for userMessage to match UI consistency
  tools?: any[];
  examples?: string[];
}

const formatList = (val: string | string[] | undefined, defaultVal: string = ''): string => {
  if (!val) return defaultVal;
  if (Array.isArray(val)) return val.join(', ');
  return val;
};

// Task family templates with best practices
const TASK_TEMPLATES = {
  write: {
    system: `You are an expert writer who produces clear, engaging, and well-structured content. You follow style guidelines precisely and adapt tone to match the target audience.`,
    instructionsTemplate: (spec: TaskSpec) => `
Write content that achieves this goal: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Requirements:
- Audience: ${spec.audience || 'General'}
- Tone: ${formatList(spec.constraints?.tone, 'Professional')}
- Style: ${formatList(spec.constraints?.style, 'Clear and concise')}
- Length: ${spec.constraints?.length || 'Medium'}
- Format: ${spec.format || 'Markdown'}
${spec.constraints?.language ? `- Language: ${spec.constraints.language}` : ''}

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Ensure the output meets all criteria before finalizing.` : 'Produce high-quality output that meets the stated goal.'}`,
  },

  code: {
    system: `You are an expert software engineer who writes clean, efficient, and well-documented code. You follow best practices, consider edge cases, and include helpful comments.`,
    instructionsTemplate: (spec: TaskSpec) => `
Write code that accomplishes: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Requirements:
- Language/Framework: ${spec.format || 'Specify in response'}
- Style: ${formatList(spec.constraints?.style, 'Clean and readable')}
- Include error handling and edge cases
- Add inline comments for complex logic

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide working code that meets all criteria.` : 'Provide working, production-ready code.'}`,
  },

  analyze: {
    system: `You are an expert data analyst who provides clear insights backed by evidence. You think critically, identify patterns, and present findings in an organized manner.`,
    instructionsTemplate: (spec: TaskSpec) => `
Analyze and provide insights on: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Analysis Requirements:
- Audience: ${spec.audience || 'Technical stakeholders'}
- Depth: ${spec.constraints?.length || 'Comprehensive'}
- Format: ${spec.format || 'Structured report'}

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide data-driven analysis with clear conclusions.` : 'Provide thorough analysis with actionable insights.'}`,
  },

  plan: {
    system: `You are an expert strategic planner who creates actionable, realistic plans. You break down complex goals into clear steps with timelines and success metrics.`,
    instructionsTemplate: (spec: TaskSpec) => `
Create a plan for: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Planning Requirements:
- Audience: ${spec.audience || 'Stakeholders'}
- Detail Level: ${spec.constraints?.length || 'Detailed'}
- Format: ${spec.format || 'Structured plan with milestones'}

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide a clear, actionable plan with timelines and success metrics.` : 'Provide a comprehensive, actionable plan.'}`,
  },

  translate: {
    system: `You are an expert translator who preserves meaning, tone, and cultural nuances. You adapt idioms appropriately and maintain the original intent.`,
    instructionsTemplate: (spec: TaskSpec) => `
Translate the following: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Translation Requirements:
- Target Language: ${spec.constraints?.language || 'Specify in goal'}
- Tone: ${formatList(spec.constraints?.tone, 'Match original')}
- Preserve formatting and structure

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide accurate translation that maintains original meaning and tone.` : 'Provide accurate, culturally appropriate translation.'}`,
  },

  summarize: {
    system: `You are an expert at distilling complex information into clear, concise summaries. You preserve key points and maintain accuracy while being brief.`,
    instructionsTemplate: (spec: TaskSpec) => `
Summarize: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Summary Requirements:
- Length: ${spec.constraints?.length || 'Concise'}
- Format: ${spec.format || 'Bullet points or paragraph'}
- Preserve all critical information

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide a clear summary that captures all essential points.` : 'Provide a concise summary of key information.'}`,
  },

  rag: {
    system: `You are an expert at answering questions using provided context. You cite sources, acknowledge limitations, and never fabricate information.`,
    instructionsTemplate: (spec: TaskSpec) => `
Answer this question using the provided context: ${spec.goal}

${spec.context ? `Available Context:\n${spec.context}` : ''}

Requirements:
- Only use information from the provided context
- Cite sources when making claims
- If information is insufficient, acknowledge limitations
- Format: ${spec.format || 'Clear answer with citations'}

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide an accurate, well-cited answer based solely on the context.` : 'Provide accurate answer with proper citations.'}`,
  },

  classify: {
    system: `You are an expert at classification and categorization. You apply consistent criteria and provide clear reasoning for your classifications.`,
    instructionsTemplate: (spec: TaskSpec) => `
Classify the following: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Classification Requirements:
- Categories: ${spec.format || 'Define appropriate categories'}
- Provide confidence scores if applicable
- Include reasoning for classification

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide clear classification with reasoning.` : 'Provide well-reasoned classification.'}`,
  },

  extract: {
    system: `You are an expert at extracting structured information from unstructured text. You identify relevant data points accurately and organize them clearly.`,
    instructionsTemplate: (spec: TaskSpec) => `
Extract information for: ${spec.goal}

${spec.context ? `Source Text:\n${spec.context}` : ''}

Extraction Requirements:
- Format output as: ${spec.format || 'Structured JSON'}
- Include only explicitly stated information
- Mark uncertain extractions

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide accurate structured extraction.` : 'Provide accurate structured data extraction.'}`,
  },

  critique: {
    system: `You are an expert critic who provides constructive, balanced feedback. You identify strengths and areas for improvement with specific, actionable suggestions.`,
    instructionsTemplate: (spec: TaskSpec) => `
Provide critique for: ${spec.goal}

${spec.context ? `Content to Review:\n${spec.context}` : ''}

Critique Requirements:
- Tone: ${formatList(spec.constraints?.tone, 'Constructive and balanced')}
- Format: ${spec.format || 'Strengths and improvements'}
- Provide specific, actionable feedback

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide balanced, constructive critique with clear recommendations.` : 'Provide balanced critique with actionable suggestions.'}`,
  },
};

// Default template for unknown task families
const DEFAULT_TEMPLATE = {
  system: `You are a helpful AI assistant who follows instructions carefully and produces high-quality outputs.`,
  instructionsTemplate: (spec: TaskSpec) => `
Task: ${spec.goal}

${spec.context ? `Context: ${spec.context}` : ''}

Requirements:
${spec.constraints?.style ? `- Style: ${formatList(spec.constraints.style)}` : ''}
${spec.constraints?.tone ? `- Tone: ${formatList(spec.constraints.tone)}` : ''}
${spec.audience ? `- Audience: ${spec.audience}` : ''}
${spec.format ? `- Format: ${spec.format}` : ''}

${spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0 ? `Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Complete the task meeting all criteria.` : 'Complete the task with high quality.'}`,
};

export function compilePrompt(taskSpec: TaskSpec): PromptBundle {
  const template = TASK_TEMPLATES[taskSpec.family as keyof typeof TASK_TEMPLATES] || DEFAULT_TEMPLATE;

  // Support both camelCase and snake_case
  const acceptanceCriteria = taskSpec.acceptance_criteria || taskSpec.acceptanceCriteria || [];
  const inputs = taskSpec.inputs || [];
  const constraints = taskSpec.constraints || {};

  // Normalize TaskSpec for template
  const normalizedSpec = {
    ...taskSpec,
    acceptanceCriteria,
    constraints,
  };

  // Build user message from inputs
  let userMessage = '';
  if (inputs && inputs.length > 0) {
    userMessage = inputs.map((input: any) => {
      if (typeof input === 'string') return input;
      if (input.type === 'text') return input.value;
      if (input.type === 'file') return `[File: ${input.value}]`;
      if (input.type === 'url') return `[URL: ${input.value}]`;
      return JSON.stringify(input);
    }).join('\n\n');
  }

  return {
    system: template.system,
    instructions: template.instructionsTemplate(normalizedSpec),
    userMessage: userMessage || 'Please proceed with the task as specified.',
    user_prompt: userMessage || 'Please proceed with the task as specified.',
    tools: taskSpec.family === 'rag' ? ['web_search', 'document_retrieval'] : [],
    examples: [],
  };
}

export function getTaskFamilies(): string[] {
  return Object.keys(TASK_TEMPLATES);
}

export function explainPromptChoice(taskSpec: TaskSpec, bundle: PromptBundle): string {
  const explanations: Record<string, string> = {
    write: 'This prompt template emphasizes style, tone, and audience matching—critical for effective writing. It includes explicit acceptance criteria to guide quality.',
    code: 'Code prompts prioritize clean structure, error handling, and documentation. The template encourages best practices and edge case consideration.',
    analyze: 'Analysis prompts frame the task as insight generation backed by evidence. The structure ensures organized, data-driven responses.',
    plan: 'Planning prompts break down goals into actionable steps with timelines. This template ensures realistic, measurable outcomes.',
    translate: 'Translation prompts preserve meaning, tone, and cultural context. The template explicitly guards against literal translations that lose nuance.',
    summarize: 'Summary prompts optimize for brevity while preserving key information. The template ensures no critical points are lost.',
    rag: 'RAG prompts enforce strict source citation and prevent hallucination by explicitly limiting responses to provided context.',
    classify: 'Classification prompts ensure consistent criteria application and require reasoning transparency for quality assurance.',
    extract: 'Extraction prompts structure output as JSON and mark uncertain information, ensuring data quality and usability.',
    critique: 'Critique prompts balance positive and constructive feedback, ensuring actionable recommendations rather than vague criticism.',
  };

  const defaultExplain = 'This prompt template structures the task clearly with explicit goals, constraints, and acceptance criteria to guide the model toward quality outputs.';

  return explanations[taskSpec.family] || defaultExplain;
}
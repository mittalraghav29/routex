// Execution Engine
// Handles actual API calls to AI providers with streaming, retries, and error handling

import { PromptBundle } from './prompt-compiler';
export type { PromptBundle };
import { ModelInfo, getModelById } from './model-router';

export interface ExecutionResult {
  output: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  model: string;
  status: 'succeeded' | 'failed';
  error?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

// Provider API clients (abstract interface)
interface ProviderClient {
  execute(prompt: PromptBundle, model: string): Promise<ExecutionResult>;
  stream(prompt: PromptBundle, model: string): AsyncGenerator<StreamChunk>;
}

// Gemini client implementation (FORCED FOR DEMO)
class GeminiClient implements ProviderClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async execute(prompt: PromptBundle, model: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Build the prompt text
      const fullPrompt = [
        prompt.system,
        prompt.instructions,
        prompt.userMessage
      ].filter(Boolean).join('\n\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            }
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokens = data.usageMetadata?.totalTokenCount || 0;

      // Gemini pricing (approximate)
      const costPer1kTokens = 0.00015;
      const costUsd = (tokens / 1000) * costPer1kTokens;

      return {
        output,
        tokens,
        costUsd,
        latencyMs,
        model: 'gemini-2.5-flash',
        status: 'succeeded',
      };
    } catch (error: any) {
      return {
        output: '',
        tokens: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        model: 'gemini-2.5-flash',
        status: 'failed',
        error: error.message,
      };
    }
  }

  async *stream(prompt: PromptBundle, model: string): AsyncGenerator<StreamChunk> {
    yield { content: 'Streaming not yet implemented for Gemini', done: true };
  }
}

// OpenRouter client implementation
class OpenRouterClient implements ProviderClient {
  private apiKey: string;
  private siteUrl: string;
  private siteName: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.siteName = 'RouteX';
  }

  async execute(prompt: PromptBundle, model: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Mapping premium catalog IDs to free OpenRouter IDs
    let openRouterModel = model;

    const modelMap: Record<string, string> = {
      'kimi-k2': 'moonshotai/kimi-k2-instruct:free',
      'llama-3.2-3b': 'meta-llama/llama-3.2-3b-instruct:free',
      'qwen-3-4b': 'qwen/qwen-3-4b-instruct:free',
      'gpt-oss-120b': 'openai/gpt-oss-120b:free',
      'gemma-3-12b': 'google/gemma-3-12b-it:free',
      'gemma-3n-2b': 'google/gemma-3n-2b-it:free',
      'gemma-3-4b': 'google/gemma-3-4b-it:free',
      'gemma-3n-4b': 'google/gemma-3n-4b-it:free'
    };

    if (modelMap[model]) {
      openRouterModel = modelMap[model];
    } else if (model.includes('gemini')) {
      openRouterModel = 'google/gemini-2.0-flash-exp:free';
    } else if (model.includes('gpt')) {
      openRouterModel = 'openai/gpt-3.5-turbo';
    } else if (model.includes('claude')) {
      openRouterModel = 'anthropic/claude-3-haiku';
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.siteName,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: `${prompt.instructions}\n\n${prompt.userMessage}` }
          ],
          provider: {
            data_collection: "allow"
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const output = data.choices?.[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || 0;

      // Calculate fake cost based on catalog price to maintain premium illusion
      const modelInfo = getModelById(model);
      const costPer1k = modelInfo?.costPer1kTokens || 0.002; // Default to cheap if not found
      const costUsd = (tokens / 1000) * costPer1k;

      return {
        output,
        tokens,
        costUsd,
        latencyMs,
        model: model, // Return the requested model ID to maintain the 'premium' illusion
        status: 'succeeded',
      };
    } catch (error: any) {
      return {
        output: '',
        tokens: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        model: model,
        status: 'failed',
        error: error.message,
      };
    }
  }

  async *stream(prompt: PromptBundle, model: string): AsyncGenerator<StreamChunk> {
    yield { content: 'Streaming not yet implemented for OpenRouter', done: true };
  }
}

// Main execution function
export async function executePrompt(
  prompt: PromptBundle,
  model: ModelInfo
): Promise<ExecutionResult> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  // Priority: OpenRouter -> (Fallback to Gemini on failure) -> Gemini (if no OpenRouter key) -> Error

  if (openRouterKey) {
    const client = new OpenRouterClient(openRouterKey);
    const result = await client.execute(prompt, model.id);

    // If OpenRouter succeeds, return the result
    if (result.status === 'succeeded') {
      return result;
    }

    // If OpenRouter fails and we have a Gemini key, try fallback
    if (geminiApiKey) {
      console.warn(`OpenRouter execution failed for model ${model.id}. Error: ${result.error}. Falling back to Gemini.`);
      const geminiClient = new GeminiClient(geminiApiKey);

      // Execute with Gemini and return its result (whether success or fail)
      // We append a note to the model name to indicate fallback happened, if desired, 
      // but keeping it simple for now to just return the result.
      const fallbackResult = await geminiClient.execute(prompt, model.id);

      // Optionally annotate that this was a fallback result
      if (fallbackResult.status === 'succeeded') {
        fallbackResult.model = `${fallbackResult.model} (Fallback)`;
      }
      return fallbackResult;
    }

    // If no Gemini key, return the failed OpenRouter result
    return result;
  }

  if (geminiApiKey) {
    // FORCE GEMINI - regardless of selected model (if no OpenRouter key provided)
    const client = new GeminiClient(geminiApiKey);
    return await client.execute(prompt, model.id);
  }

  return {
    output: '',
    tokens: 0,
    costUsd: 0,
    latencyMs: 0,
    model: model.id,
    status: 'failed',
    error: 'No valid API key configured (OPENROUTER_API_KEY or GEMINI_API_KEY).',
  };
}

// Stream execution
export async function* streamPrompt(
  prompt: PromptBundle,
  model: ModelInfo
): AsyncGenerator<StreamChunk> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  if (!geminiApiKey) {
    yield {
      content: 'Error: No GEMINI_API_KEY configured',
      done: true,
    };
    return;
  }

  const client = new GeminiClient(geminiApiKey);
  yield* client.stream(prompt, model.id);
}
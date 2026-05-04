import { NextRequest, NextResponse } from 'next/server';
import { executePrompt, type PromptBundle, type ExecutionResult } from '@/lib/execution-engine';
import { getModelById, type ModelInfo } from '@/lib/model-router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both naming conventions
    const promptBundle = body.prompt_bundle || body.promptBundle;
    const modelId = body.model || body.modelId;

    // Validate inputs
    if (!promptBundle) {
      return NextResponse.json(
        { error: 'Prompt bundle is required' },
        { status: 400 }
      );
    }

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Get model info
    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: `Model ${modelId} not found` },
        { status: 404 }
      );
    }

    // Execute the prompt
    const result: ExecutionResult = await executePrompt(promptBundle, model);

    // Check if execution failed
    if (result.status === 'failed') {
      return NextResponse.json({
        output: result.error || 'Execution failed without error message',
        metadata: {
          cost_usd: 0,
          latency_ms: result.latencyMs,
          tokens_used: 0,
          model: result.model,
          status: 'failed',
        },
        error: result.error,
      });
    }

    // Return in the format expected by the frontend
    return NextResponse.json({
      output: result.output,
      metadata: {
        cost_usd: result.costUsd,
        latency_ms: result.latencyMs,
        tokens_used: result.tokens,
        model: result.model,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { error: 'Execution failed: ' + error.message },
      { status: 500 }
    );
  }
}
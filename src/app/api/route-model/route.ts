import { NextRequest, NextResponse } from 'next/server';
import { routeModel, explainModelChoice, getAllModels, type TaskSpec } from '@/lib/model-router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept both formats: { task_spec: {...} } and direct TaskSpec
    const taskSpec: TaskSpec = body.task_spec || body;

    // Validate required fields
    if (!taskSpec.family) {
      return NextResponse.json(
        { error: 'Task family is required' },
        { status: 400 }
      );
    }

    // Route to best model
    const recommendation = routeModel(taskSpec);

    // Generate detailed explanation
    const explanation = explainModelChoice(recommendation);

    return NextResponse.json({
      recommended_model: recommendation.model.id,
      rationale: recommendation.rationale,
      est_cost_usd: recommendation.estimatedCost.toFixed(4),
      est_latency_s: (recommendation.estimatedLatency / 1000).toFixed(1),
      alternatives: recommendation.alternatives.map(alt => ({
        model: alt.id,
        name: alt.name,
        reason: `${alt.name} - Quality: ${alt.qualityScore}/100, Cost: $${alt.costPer1kTokens.toFixed(4)}/1k tokens`,
      })),
    });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Model routing failed: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const models = getAllModels();
    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch models: ' + error.message },
      { status: 500 }
    );
  }
}
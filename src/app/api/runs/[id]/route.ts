import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { runs, taskSpecs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { compilePrompt } from '@/lib/prompt-compiler';
import { routeModel, explainModelChoice } from '@/lib/model-router';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = parseInt(searchParams.get('orgId') || '1');

    const runId = parseInt(id);

    // Fetch run
    const runResults = await db.select()
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);

    if (runResults.length === 0) {
      return NextResponse.json({
        error: 'Run not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const run = runResults[0];

    if (run.orgId !== orgId) {
      return NextResponse.json({
        error: 'Run not found or organization mismatch',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Fetch associated task spec
    const taskSpecResults = await db.select()
      .from(taskSpecs)
      .where(eq(taskSpecs.id, run.taskSpecId))
      .limit(1);

    let enrichedRun: any = {
      ...run,
      verdict: run.verdict ? JSON.parse(run.verdict) : null,
      learn: run.learn ? JSON.parse(run.learn) : null,
    };

    if (taskSpecResults.length > 0) {
      const dbTaskSpec = taskSpecResults[0];

      // Reconstruct full task spec object
      const taskSpec = {
        id: dbTaskSpec.id,
        family: dbTaskSpec.family,
        goal: dbTaskSpec.goal,
        context: dbTaskSpec.context || undefined,
        inputs: JSON.parse(dbTaskSpec.inputs),
        constraints: JSON.parse(dbTaskSpec.constraints),
        audience: dbTaskSpec.audience || undefined,
        format: dbTaskSpec.format || undefined,
        acceptance_criteria: JSON.parse(dbTaskSpec.acceptanceCriteria),
        privacy: dbTaskSpec.privacy ? JSON.parse(dbTaskSpec.privacy) : undefined,
        userPrefs: dbTaskSpec.userPrefs ? JSON.parse(dbTaskSpec.userPrefs) : undefined,
      };

      // Re-compile prompt bundle
      const promptBundle = compilePrompt(taskSpec);

      // Re-run model routing to get rationale (or use saved if we had it, but we don't)
      const modelRecommendation = routeModel(taskSpec);
      // Construct model selection object expected by frontend
      const modelSelection = {
        recommended_model: modelRecommendation.model.id,
        rationale: modelRecommendation.rationale,
        est_cost_usd: modelRecommendation.estimatedCost.toFixed(4),
        est_latency_s: (modelRecommendation.estimatedLatency / 1000).toFixed(1),
        alternatives: modelRecommendation.alternatives.map(alt => ({
          model: alt.id,
          name: alt.name,
          reason: `${alt.name} - Quality: ${alt.qualityScore}/100, Cost: $${alt.costPer1kTokens.toFixed(4)}/1k tokens`, // Simplified reason
          est_cost_score: 4, // Mock scores for display
          est_latency_score: 4,
          est_quality_score: Math.round(alt.qualityScore / 20),
        })),
      };

      // Create the structure expected by RunDetail interface in frontend
      enrichedRun = {
        id: run.id.toString(),
        task_spec: taskSpec,
        prompt_bundle: promptBundle,
        model_selection: modelSelection,
        output: run.output,
        verification: enrichedRun.verdict, // Map verdict to verification
        metadata: {
          cost_usd: run.costUsd,
          latency_ms: run.latencyMs,
          tokens_used: run.tokens,
          created_at: new Date(run.createdAt).toISOString(),
        }
      };
    }

    // Wrap in { run: ... } as expected by frontend
    return NextResponse.json({ run: enrichedRun });
  } catch (error) {
    console.error('GET run error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = parseInt(searchParams.get('orgId') || '1');

    const runId = parseInt(id);

    const runResults = await db.select()
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);

    if (runResults.length === 0) {
      return NextResponse.json({
        error: 'Run not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const run = runResults[0];

    if (run.orgId !== orgId) {
      return NextResponse.json({
        error: 'Run not found or organization mismatch',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    if (run.userId !== session.user.id) {
      return NextResponse.json({
        error: 'You do not have permission to delete this run',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const deleted = await db.delete(runs)
      .where(and(eq(runs.id, runId), eq(runs.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({
        error: 'Failed to delete run',
        code: 'DELETE_FAILED'
      }, { status: 500 });
    }

    const deletedRun = deleted[0];

    return NextResponse.json({
      message: 'Run deleted successfully',
      deletedRun: {
        ...deletedRun,
        verdict: deletedRun.verdict ? JSON.parse(deletedRun.verdict) : null,
        learn: deletedRun.learn ? JSON.parse(deletedRun.learn) : null,
      }
    });
  } catch (error) {
    console.error('DELETE run error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const body = await request.json();
    const { verdict, learn } = body;
    const runId = parseInt(id);

    const updateData: any = {};
    if (verdict) updateData.verdict = JSON.stringify(verdict);
    if (learn) updateData.learn = JSON.stringify(learn);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No updates provided' });
    }

    const updated = await db.update(runs)
      .set(updateData)
      .where(and(eq(runs.id, runId), eq(runs.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        error: 'Run not found or permission denied',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const updatedRun = updated[0];

    return NextResponse.json({
      run: {
        ...updatedRun,
        verdict: updatedRun.verdict ? JSON.parse(updatedRun.verdict) : null,
        learn: updatedRun.learn ? JSON.parse(updatedRun.learn) : null,
      }
    });
  } catch (error) {
    console.error('PATCH run error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}
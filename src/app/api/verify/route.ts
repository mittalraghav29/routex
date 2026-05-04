import { NextRequest, NextResponse } from 'next/server';
import { verifyOutput, explainVerification, type TaskSpec, type VerificationResult } from '@/lib/result-verifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both naming conventions
    const output = body.output;
    const taskSpec = body.task_spec || body.taskSpec;

    // Validate inputs
    if (!output) {
      return NextResponse.json(
        { error: 'Output is required' },
        { status: 400 }
      );
    }

    if (!taskSpec) {
      return NextResponse.json(
        { error: 'TaskSpec is required' },
        { status: 400 }
      );
    }

    // Verify the output
    const result: VerificationResult = await verifyOutput(output, taskSpec);

    // Generate explanation
    const explanation = explainVerification(result);

    // Convert score (0-100) to grade (0-5) for frontend
    const grade = Math.round((result.score / 100) * 5);

    return NextResponse.json({
      passed: result.passed,
      grade,
      score: result.score,
      reasoning: explanation,
      checks: result.checks,
      issues: result.issues,
      repair_prompt: result.repairPrompt,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed: ' + error.message },
      { status: 500 }
    );
  }
}
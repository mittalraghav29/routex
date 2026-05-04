import { NextRequest, NextResponse } from 'next/server';
import { compilePrompt, explainPromptChoice, type TaskSpec } from '@/lib/prompt-compiler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Accept both formats: { task_spec: {...} } and direct TaskSpec
    const taskSpec: TaskSpec = body.task_spec || body;
    
    // Validate required fields
    if (!taskSpec.goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      );
    }
    
    if (!taskSpec.family) {
      return NextResponse.json(
        { error: 'Task family is required' },
        { status: 400 }
      );
    }
    
    // Compile the prompt
    const promptBundle = compilePrompt(taskSpec);
    
    // Generate explanation
    const explanation = explainPromptChoice(taskSpec, promptBundle);
    
    return NextResponse.json({
      prompt_bundle: promptBundle,
      explanation,
    });
  } catch (error: any) {
    console.error('Compile error:', error);
    return NextResponse.json(
      { error: 'Compilation failed: ' + error.message },
      { status: 500 }
    );
  }
}
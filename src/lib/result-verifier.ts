// Result Verifier Service
// Grades outputs against acceptance criteria and suggests repairs

import { TaskSpec } from './prompt-compiler';
export type { TaskSpec };

export interface VerificationResult {
  passed: boolean;
  score: number; // 0-100
  checks: VerificationCheck[];
  issues: string[];
  repairPrompt?: string;
}

export interface VerificationCheck {
  criterion: string;
  passed: boolean;
  details: string;
}

// Rule-based verifiers for specific criteria
function verifyLength(output: string, constraint: string): VerificationCheck {
  const wordCount = output.split(/\s+/).length;

  const lengthRanges = {
    short: [50, 300],
    medium: [300, 800],
    long: [800, 2000],
  };

  const range = lengthRanges[constraint as keyof typeof lengthRanges] || [0, Infinity];
  const passed = wordCount >= range[0] && wordCount <= range[1];

  return {
    criterion: `Length: ${constraint}`,
    passed,
    details: `Output contains ${wordCount} words. Expected ${range[0]}-${range[1]} words.`,
  };
}

function verifyFormat(output: string, format: string): VerificationCheck {
  let passed = false;
  let details = '';

  switch (format.toLowerCase()) {
    case 'markdown':
      passed = output.includes('#') || output.includes('**') || output.includes('*');
      details = passed ? 'Markdown formatting detected' : 'No markdown formatting found';
      break;
    case 'json':
      try {
        JSON.parse(output);
        passed = true;
        details = 'Valid JSON structure';
      } catch {
        passed = false;
        details = 'Invalid JSON structure';
      }
      break;
    case 'html':
      passed = output.includes('<') && output.includes('>');
      details = passed ? 'HTML tags detected' : 'No HTML tags found';
      break;
    case 'code':
      passed = output.includes('function') || output.includes('class') || output.includes('def');
      details = passed ? 'Code structure detected' : 'No code structure found';
      break;
    default:
      passed = true;
      details = 'Format check not applicable';
  }

  return {
    criterion: `Format: ${format}`,
    passed,
    details,
  };
}

function verifyAcceptanceCriteria(output: string, criteria: string[]): VerificationCheck[] {
  if (!criteria || criteria.length === 0) return [];

  return criteria.map(criterion => {
    // Simple keyword matching for demo
    // In production, use LLM-as-judge for semantic checking
    const keywords = criterion.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const outputLower = output.toLowerCase();

    const matchCount = keywords.filter(kw => outputLower.includes(kw)).length;
    const passed = matchCount >= Math.ceil(keywords.length * 0.5); // 50% keyword match

    return {
      criterion,
      passed,
      details: passed
        ? `Criterion addressed in output`
        : `Criterion may not be fully addressed`,
    };
  });
}

// LLM-as-judge (simulated for now - in production, call an actual LLM)
async function llmGrade(output: string, taskSpec: TaskSpec): Promise<number> {
  // Simulate LLM grading with heuristics
  let score = 70; // Base score

  // Check output length
  const wordCount = output.split(/\s+/).length;
  if (wordCount > 50) score += 10;
  if (wordCount > 200) score += 10;

  // Check for structure (headers, bullets, paragraphs)
  if (output.includes('\n\n')) score += 5;
  if (output.match(/^#+\s/m)) score += 5; // Markdown headers

  // Check tone if specified
  const constraints = taskSpec.constraints || {};
  if (constraints.tone?.includes('formal')) {
    const informalWords = ['gonna', 'wanna', 'yeah'];
    const hasInformal = informalWords.some(w => output.toLowerCase().includes(w));
    if (!hasInformal) score += 5;
  }

  return Math.min(100, score);
}

export async function verifyOutput(
  output: string,
  taskSpec: TaskSpec
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];
  const issues: string[] = [];
  const constraints = taskSpec.constraints || {};

  // 1. Length check
  if (constraints.length) {
    const lengthCheck = verifyLength(output, constraints.length);
    checks.push(lengthCheck);
    if (!lengthCheck.passed) {
      issues.push(`Output length doesn't match requirement: ${lengthCheck.details}`);
    }
  }

  // 2. Format check
  if (taskSpec.format) {
    const formatCheck = verifyFormat(output, taskSpec.format);
    checks.push(formatCheck);
    if (!formatCheck.passed) {
      issues.push(`Output format issue: ${formatCheck.details}`);
    }
  }

  // 3. Acceptance criteria checks - support both naming conventions
  const acceptanceCriteria = taskSpec.acceptance_criteria || taskSpec.acceptanceCriteria || [];
  if (acceptanceCriteria.length > 0) {
    const criteriaChecks = verifyAcceptanceCriteria(output, acceptanceCriteria);
    checks.push(...criteriaChecks);

    const failedCriteria = criteriaChecks.filter(c => !c.passed);
    if (failedCriteria.length > 0) {
      issues.push(`${failedCriteria.length} acceptance criteria not fully met`);
    }
  }

  // 4. LLM-based quality score
  const qualityScore = await llmGrade(output, taskSpec);

  // Calculate overall score
  const passedChecks = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const checkScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

  // Weighted average: 60% rule checks, 40% LLM quality
  const finalScore = Math.round(checkScore * 0.6 + qualityScore * 0.4);

  const passed = finalScore >= 75 && issues.length === 0;

  // Generate repair prompt if needed
  let repairPrompt: string | undefined;
  if (!passed && issues.length > 0) {
    repairPrompt = generateRepairPrompt(output, taskSpec, issues);
  }

  return {
    passed,
    score: finalScore,
    checks,
    issues,
    repairPrompt,
  };
}

function generateRepairPrompt(
  output: string,
  taskSpec: TaskSpec,
  issues: string[]
): string {
  const acceptanceCriteria = taskSpec.acceptance_criteria || taskSpec.acceptanceCriteria || [];

  return `The previous output did not fully meet the requirements. Please revise it to address these issues:

${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Original goal: ${taskSpec.goal}

${acceptanceCriteria.length > 0 ? `Acceptance criteria:\n${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n` : ''}
Previous output:
${output}

Please provide an improved version that addresses all issues above.`;
}

export function explainVerification(result: VerificationResult): string {
  if (result.passed) {
    return `✅ Output verified successfully! Score: ${result.score}/100\n\nAll ${result.checks.length} checks passed.`;
  }

  const failedChecks = result.checks.filter(c => !c.passed);

  return `⚠️ Verification incomplete. Score: ${result.score}/100\n\nIssues found:\n${result.issues.map(i => `- ${i}`).join('\n')}\n\nFailed checks: ${failedChecks.length}/${result.checks.length}\n\nSuggestion: Use the "Repair & Re-ask" feature to automatically fix these issues.`;
}
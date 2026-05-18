import crypto from 'node:crypto';
import { createResponse, extractText, OpenAIClientError } from './openaiClient.js';
import { recordCredit, logEvent } from './logger.js';
import { getTemplate } from './templates.js';

const SYSTEM_PROMPT = `You are Purvi Indies Agent, a local-first execution planner.
Your job is to bundle the user's full request into the smallest safe execution plan.
Return JSON only with this shape:
{
  "summary": "one sentence",
  "risk": "low|medium|high",
  "model_calls_used": 1,
  "steps": [{"kind":"shell|file|mac|note", "description":"...", "command":"optional", "path":"optional", "content":"optional"}],
  "tests": ["commands to verify"],
  "approval_required": ["items needing human approval"]
}
Rules:
- Treat one OpenAI request as one app credit.
- Do not split planning into multiple model calls.
- Prefer deterministic local commands after the plan.
- Never request secrets. Use environment variables.
- For macOS app control, use high-level reversible actions and mention Accessibility permission.`;

export function makeTaskId(input) {
  return crypto.createHash('sha256').update(`${Date.now()}-${input}`).digest('hex').slice(0, 12);
}

export function buildPrompt({ task, template = 'code', cwd = process.cwd() }) {
  const selected = getTemplate(template);
  return [
    `Template: ${selected.name}`,
    selected.prompt,
    `Workspace: ${cwd}`,
    `User task: ${task}`,
    'Create a single bundled plan that can be reviewed or executed locally.'
  ].join('\n\n');
}

export function fallbackPlan({ task, template = 'code', reason }) {
  return {
    summary: `Offline plan for: ${task}`,
    risk: 'medium',
    model_calls_used: 0,
    steps: [
      { kind: 'note', description: `Template '${template}' selected. No OpenAI call was made: ${reason}` },
      { kind: 'shell', description: 'Inspect files quickly', command: 'rg --files' },
      { kind: 'shell', description: 'Run available tests after edits', command: 'npm test' },
      { kind: 'note', description: 'Set OPENAI_API_KEY to enable one-credit model planning.' }
    ],
    tests: ['npm test'],
    approval_required: ['Review generated changes before running destructive commands.']
  };
}

export function parsePlan(text) {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Model did not return a JSON object.');
  }
  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
}

export async function createBundledPlan({ task, model, template, dryRun = false }) {
  const taskId = makeTaskId(task);
  await logEvent('task.started', { taskId, template, dryRun });

  if (dryRun) {
    const plan = fallbackPlan({ task, template, reason: 'dry run requested' });
    await logEvent('task.planned.offline', { taskId, plan });
    return { taskId, plan, raw: JSON.stringify(plan, null, 2) };
  }

  try {
    const response = await createResponse({
      model,
      instructions: SYSTEM_PROMPT,
      input: buildPrompt({ task, template })
    });
    await recordCredit(taskId, model, 'bundled-task-plan');
    const raw = extractText(response);
    const plan = parsePlan(raw);
    await logEvent('task.planned', { taskId, responseId: response.id, plan });
    return { taskId, plan, raw, responseId: response.id };
  } catch (error) {
    if (error instanceof OpenAIClientError) {
      const plan = fallbackPlan({ task, template, reason: error.message });
      await logEvent('task.planned.fallback', { taskId, error: error.message });
      return { taskId, plan, raw: JSON.stringify(plan, null, 2), warning: error.message };
    }
    throw error;
  }
}

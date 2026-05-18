import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, fallbackPlan, parsePlan } from '../src/agent.js';
import { listTemplates } from '../src/templates.js';

test('buildPrompt includes user task and workspace', () => {
  const prompt = buildPrompt({ task: 'ship the app', template: 'app', cwd: '/tmp/project' });
  assert.match(prompt, /ship the app/);
  assert.match(prompt, /\/tmp\/project/);
});

test('parsePlan extracts JSON from model text', () => {
  const plan = parsePlan('```json\n{"summary":"ok","steps":[]}\n```');
  assert.equal(plan.summary, 'ok');
});

test('fallbackPlan does not spend model calls', () => {
  const plan = fallbackPlan({ task: 'test', reason: 'dry', template: 'code' });
  assert.equal(plan.model_calls_used, 0);
  assert.ok(plan.steps.length > 0);
});

test('templates include mac and code modes', () => {
  const ids = listTemplates().map((template) => template.id);
  assert.ok(ids.includes('mac'));
  assert.ok(ids.includes('code'));
});

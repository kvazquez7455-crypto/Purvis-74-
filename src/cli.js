#!/usr/bin/env node
import { loadConfig, saveConfig, APP_NAME } from './config.js';
import { createBundledPlan } from './agent.js';
import { listTemplates } from './templates.js';
import { summarizeHealth, readCreditLedger } from './logger.js';
import { focusApp, hotkey, macAutomationHelp, typeText } from './macAutomation.js';

function printHelp() {
  console.log(`${APP_NAME}

Usage:
  purvi run "task" [--template code|app|mac|business] [--model MODEL] [--dry-run]
  purvi templates
  purvi health
  purvi credits
  purvi config set <key> <value>
  purvi mac setup
  purvi mac focus "App Name"
  purvi mac type "text"
  purvi mac hotkey <key> [modifier ...]

Credit rule:
  One 'purvi run' planning request makes at most one OpenAI Responses API call.
  Local execution, logs, templates, and macOS helpers do not spend model calls.`);
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

async function main() {
  const [, , command, ...args] = process.argv;
  const config = await loadConfig();

  if (!command || command === '--help' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'run') {
    const taskParts = args.filter((arg, index) => {
      const previous = args[index - 1];
      return !arg.startsWith('--') && previous !== '--template' && previous !== '--model';
    });
    const task = taskParts.join(' ').trim();
    if (!task) throw new Error('Missing task. Example: purvi run "fix the app"');
    const template = readOption(args, '--template', 'code');
    const model = readOption(args, '--model', config.model);
    const dryRun = hasFlag(args, '--dry-run');
    const result = await createBundledPlan({ task, model, template, dryRun });
    if (result.warning) console.error(`Warning: ${result.warning}`);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'templates') {
    console.table(listTemplates());
    return;
  }

  if (command === 'health') {
    console.log(JSON.stringify(await summarizeHealth(), null, 2));
    return;
  }

  if (command === 'credits') {
    console.log(JSON.stringify(await readCreditLedger(), null, 2));
    return;
  }

  if (command === 'config') {
    const [action, key, ...valueParts] = args;
    if (action !== 'set' || !key || valueParts.length === 0) {
      throw new Error('Usage: purvi config set <key> <value>');
    }
    const value = valueParts.join(' ');
    const next = { ...config, [key]: value };
    await saveConfig(next);
    console.log(JSON.stringify(next, null, 2));
    return;
  }

  if (command === 'mac') {
    const [action, ...rest] = args;
    if (action === 'setup') {
      console.log(macAutomationHelp());
      return;
    }
    if (action === 'focus') {
      console.log(JSON.stringify(await focusApp(rest.join(' ')), null, 2));
      return;
    }
    if (action === 'type') {
      console.log(JSON.stringify(await typeText(rest.join(' ')), null, 2));
      return;
    }
    if (action === 'hotkey') {
      const [key, ...modifiers] = rest;
      console.log(JSON.stringify(await hotkey(key, modifiers), null, 2));
      return;
    }
    throw new Error('Unknown mac action. Try: purvi mac setup');
  }

  throw new Error(`Unknown command '${command}'. Run purvi help.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

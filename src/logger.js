import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONFIG_DIR } from './config.js';

const LOG_DIR = join(CONFIG_DIR, 'logs');
const LEDGER_PATH = join(CONFIG_DIR, 'credit-ledger.jsonl');

export async function logEvent(type, payload = {}) {
  await mkdir(LOG_DIR, { recursive: true });
  const entry = { time: new Date().toISOString(), type, ...payload };
  await appendFile(join(LOG_DIR, 'agent.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function recordCredit(taskId, model, reason) {
  await mkdir(CONFIG_DIR, { recursive: true });
  const entry = { time: new Date().toISOString(), taskId, model, reason, modelCalls: 1 };
  await appendFile(LEDGER_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

export async function readCreditLedger() {
  try {
    const raw = await readFile(LEDGER_PATH, 'utf8');
    return raw.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function summarizeHealth() {
  const ledger = await readCreditLedger();
  const today = new Date().toISOString().slice(0, 10);
  const todayCalls = ledger.filter((entry) => entry.time.startsWith(today)).length;
  return {
    status: 'ok',
    today,
    totalModelCalls: ledger.length,
    todayModelCalls: todayCalls,
    logDirectory: LOG_DIR
  };
}

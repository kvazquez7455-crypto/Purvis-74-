import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const APP_NAME = 'Purvi Indies Agent';
export const DEFAULT_MODEL = process.env.PURVI_MODEL || 'gpt-5.4-mini';
export const CONFIG_DIR = process.env.PURVI_HOME || join(homedir(), '.purvi-indies');
export const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function ensureConfigDir() {
  await mkdir(CONFIG_DIR, { recursive: true });
}

export async function loadConfig() {
  await ensureConfigDir();
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const config = {
      model: DEFAULT_MODEL,
      approvalMode: 'plan',
      maxModelCallsPerTask: 1,
      workspaceRoot: process.cwd(),
      allowMacAutomation: true,
      createdAt: new Date().toISOString()
    };
    await saveConfig(config);
    return config;
  }
}

export async function saveConfig(config) {
  await ensureConfigDir();
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

export function getApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

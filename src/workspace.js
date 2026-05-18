import { execFile } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SAFE_COMMANDS = new Set(['cat', 'node', 'npm', 'pnpm', 'yarn', 'git', 'rg', 'sed', 'python3', 'python', 'mkdir', 'touch']);

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path) {
  return readFile(path, 'utf8');
}

export async function writeTextFile(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export function resolveInside(root, target) {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(resolvedRoot, target);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Refusing to access path outside workspace: ${target}`);
  }
  return resolvedTarget;
}

export async function runCommand(command, args = [], options = {}) {
  if (!SAFE_COMMANDS.has(command)) {
    throw new Error(`Command '${command}' is not on the safe allowlist.`);
  }
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options.cwd || process.cwd(),
    timeout: options.timeoutMs || 120000,
    maxBuffer: 1024 * 1024 * 8
  });
  return { command, args, stdout, stderr };
}

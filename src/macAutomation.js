import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function quoteAppleScript(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export async function runAppleScript(script) {
  if (process.platform !== 'darwin') {
    return { skipped: true, reason: 'macOS automation only runs on darwin.', stdout: '', stderr: '' };
  }
  const { stdout, stderr } = await execFileAsync('osascript', ['-e', script], { timeout: 30000 });
  return { skipped: false, stdout, stderr };
}

export async function focusApp(appName) {
  return runAppleScript(`tell application "${quoteAppleScript(appName)}" to activate`);
}

export async function typeText(text) {
  return runAppleScript(`tell application "System Events" to keystroke "${quoteAppleScript(text)}"`);
}

export async function hotkey(key, modifiers = []) {
  const using = modifiers.length ? ` using {${modifiers.join(', ')}}` : '';
  return runAppleScript(`tell application "System Events" to keystroke "${quoteAppleScript(key)}"${using}`);
}

export function macAutomationHelp() {
  return [
    'macOS setup:',
    '1. Open System Settings > Privacy & Security > Accessibility.',
    '2. Allow Terminal, iTerm, or the packaged Purvi app to control your Mac.',
    '3. Use: purvi mac focus "Safari" or purvi mac type "hello".',
    '4. Keep automation scripts small and review actions before running them.'
  ].join('\n');
}

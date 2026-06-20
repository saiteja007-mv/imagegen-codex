#!/usr/bin/env node
/**
 * imagegen-codex installer — `npx imagegen-codex`
 *
 * Copies the self-contained skill + slash command into the user's global agent dir
 * (~/.claude by default), then VERIFIES that the Codex CLI is installed AND that
 * the user is logged in (~/.codex/auth.json exists). If either check fails the
 * installer prints exact remediation commands and exits with code 1.
 *
 * Flags:
 *   --dir <path>   target agent home (default: ~/.claude)
 *   --skip-checks  install files but skip the Codex CLI verification
 */
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const getFlag = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? (args[i + 1] ?? true) : undefined;
};
const skipChecks = args.includes('--skip-checks');
const claudeHome = resolve(getFlag('--dir') || join(homedir(), '.claude'));

// ANSI color helpers (no chalk dep — keep tarball tiny)
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const log = (m) => console.log(`  ${m}`);
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => log(`${c.yellow}!${c.reset} ${m}`);
const fail = (m) => log(`${c.red}✗${c.reset} ${m}`);

console.log(`\n  ${c.bold}imagegen-codex installer${c.reset}\n`);

// ─── 1. Copy skill bundle ───────────────────────────────────────────────────
const skillSrc = join(PKG, 'skills', 'imagegen-codex');
const skillDst = join(claudeHome, 'skills', 'imagegen-codex');
mkdirSync(join(claudeHome, 'skills'), { recursive: true });
cpSync(skillSrc, skillDst, { recursive: true });
ok(`skill   → ${skillDst}`);

// ─── 2. Copy slash command ──────────────────────────────────────────────────
const cmdSrc = join(PKG, 'commands', 'imagegen-codex.md');
const cmdDst = join(claudeHome, 'commands', 'imagegen-codex.md');
mkdirSync(join(claudeHome, 'commands'), { recursive: true });
cpSync(cmdSrc, cmdDst);
ok(`command → ${cmdDst}  ${c.dim}(/imagegen-codex)${c.reset}`);

// ─── 3. Preflight checks ────────────────────────────────────────────────────
if (skipChecks) {
  console.log('');
  warn(`Skipped Codex CLI checks (--skip-checks). The skill will fail at runtime`);
  warn(`unless ${c.cyan}codex${c.reset} is installed and ${c.cyan}codex login${c.reset} has been run.`);
  process.exit(0);
}

console.log('');
log(`${c.bold}Checking Codex CLI…${c.reset}`);

// 3a — codex --version
const codexBin = process.platform === 'win32' ? 'codex.cmd' : 'codex';
const probe = spawnSync(codexBin, ['--version'], { stdio: 'pipe' });
const codexInstalled = probe.status === 0;

if (codexInstalled) {
  const v = (probe.stdout?.toString() || '').trim();
  ok(`Codex CLI installed  ${c.dim}(${v})${c.reset}`);
} else {
  fail(`Codex CLI NOT installed`);
}

// 3b — ~/.codex/auth.json
const authPath = join(homedir(), '.codex', 'auth.json');
let loggedIn = false;
try {
  const st = statSync(authPath);
  loggedIn = st.isFile() && st.size > 0;
} catch { /* missing */ }

if (loggedIn) {
  ok(`Codex login present  ${c.dim}(${authPath})${c.reset}`);
} else {
  fail(`Codex login NOT found  ${c.dim}(expected ${authPath})${c.reset}`);
}

// ─── 4. Result ──────────────────────────────────────────────────────────────
console.log('');
if (codexInstalled && loggedIn) {
  console.log(`  ${c.green}${c.bold}✓ Setup complete.${c.reset} ${c.dim}/imagegen-codex is ready.${c.reset}\n`);
  console.log(`  Try it:`);
  console.log(`    ${c.cyan}/imagegen-codex generate the 8 prompts in assets/prompts.md into assets/out/${c.reset}\n`);
  process.exit(0);
}

console.log(`  ${c.yellow}${c.bold}⚠ Files installed, but Codex CLI is not ready.${c.reset}`);
console.log(`  ${c.dim}/imagegen-codex will not work until you fix the items above.${c.reset}\n`);
console.log(`  ${c.bold}Fix:${c.reset}`);
if (!codexInstalled) {
  console.log(`    ${c.cyan}npm i -g @openai/codex${c.reset}      ${c.dim}# install Codex CLI globally${c.reset}`);
}
if (!loggedIn) {
  console.log(`    ${c.cyan}codex login${c.reset}                 ${c.dim}# browser OAuth → writes ~/.codex/auth.json${c.reset}`);
}
console.log(`\n  Then re-run ${c.cyan}npx imagegen-codex${c.reset} to verify, or skip the check with ${c.cyan}--skip-checks${c.reset}.\n`);
process.exit(1);

#!/usr/bin/env node
/**
 * imagegen-codex installer — `npx imagegen-codex`
 *
 * Copies the self-contained skill + slash command into the user's global agent dir
 * (~/.claude by default) so /imagegen-codex works in every project.
 *
 * No runtime deps — the skill just shells out to the Codex CLI (which the user
 * installs separately with `npm i -g @openai/codex` + `codex login`).
 *
 * Flags:
 *   --dir <path>   target agent home (default: ~/.claude)
 */
import { cpSync, mkdirSync } from 'node:fs';
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
const claudeHome = resolve(getFlag('--dir') || join(homedir(), '.claude'));

const log = (m) => console.log(`  ${m}`);
console.log('\n  imagegen-codex installer\n');

// 1) skill bundle -> <claudeHome>/skills/imagegen-codex
const skillSrc = join(PKG, 'skills', 'imagegen-codex');
const skillDst = join(claudeHome, 'skills', 'imagegen-codex');
mkdirSync(join(claudeHome, 'skills'), { recursive: true });
cpSync(skillSrc, skillDst, { recursive: true });
log(`skill   -> ${skillDst}`);

// 2) slash command -> <claudeHome>/commands/imagegen-codex.md
const cmdSrc = join(PKG, 'commands', 'imagegen-codex.md');
const cmdDst = join(claudeHome, 'commands', 'imagegen-codex.md');
mkdirSync(join(claudeHome, 'commands'), { recursive: true });
cpSync(cmdSrc, cmdDst);
log(`command -> ${cmdDst}  (/imagegen-codex)`);

// 3) Preflight — warn if Codex CLI is missing (not fatal; install is still useful)
const codex = process.platform === 'win32' ? 'codex.cmd' : 'codex';
const probe = spawnSync(codex, ['--version'], { stdio: 'pipe' });
if (probe.status !== 0) {
  log('preflight -> Codex CLI not detected. Install it before using:');
  log('             npm i -g @openai/codex   &&   codex login');
} else {
  const v = (probe.stdout?.toString() || '').trim();
  log(`preflight -> Codex CLI present (${v})`);
}

console.log(`
  Done. /imagegen-codex is installed.

  Use it in any project:
    /imagegen-codex generate the 8 prompts in assets/prompts.md into assets/out/

  The skill delegates to Codex CLI's built-in image_gen tool — no OPENAI_API_KEY,
  no paid MCP credits (uses your ChatGPT/Codex login).
`);

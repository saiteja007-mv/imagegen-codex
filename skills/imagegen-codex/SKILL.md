---
name: imagegen-codex
description: Generate/save images from text prompts by delegating to the Codex CLI's built-in image_gen tool — no OPENAI_API_KEY, no paid credits (uses the user's ChatGPT/Codex login). Use when the user wants images generated and saved to a folder, especially a batch of prompts from a script's asset-prompt list, or says "/imagegen-codex", "generate these images with codex", "use codex to make the assets".
user-invocable: true
allowed-tools: [Bash, Read, Edit, Write, TaskStop]
---

# Image Gen via Codex CLI

Delegates image generation to the **Codex CLI**, whose built-in `image_gen` tool generates images using the user's ChatGPT/Codex login. **No `OPENAI_API_KEY`, no paid MCP credits.** This is the fallback that works when:
- Claude Code has no native `image_gen` tool, AND
- the paid image MCP (Higgsfield/Soul) has 0 credits, AND
- `OPENAI_API_KEY` is not set.

## Preconditions (check first)

```bash
codex --version            # Codex CLI must be installed (npm global)
ls "$HOME/.codex/auth.json" # must exist → user is logged in (ChatGPT plan w/ image_gen)
```
If Codex isn't installed or authed: tell the user to `npm i -g @openai/codex` and `codex login`, then stop.

## The canonical invocation (USE THIS EXACTLY)

Run in the **background** with a **long timeout**, stdin **closed**, sandbox **bypassed**:

```bash
cd "<WORKDIR>" && codex exec \
  --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --cd "<WORKDIR>" \
  "<TASK PROMPT>" \
  < /dev/null > "<LOGFILE>" 2>&1; echo "EXIT $?"
```

- `run_in_background: true`
- `timeout: 3600000` (60 min — many 4K images take 30-40 min)

## 🔴 The four gotchas (every one of these broke a run — do not skip)

1. **Long timeout, background.** A short Bash timeout sends SIGINT and Codex aborts mid-run (`turn_aborted: interrupted`) with partial work lost. Use ≥ 60 min and `run_in_background: true`.
2. **Close stdin: `< /dev/null`.** Without it, `codex exec` blocks forever on `Reading additional input from stdin...` and generates nothing (exit never).
3. **Bypass the sandbox: `--dangerously-bypass-approvals-and-sandbox`.** Codex's Windows sandbox can fail with `windows sandbox: spawn setup refresh`, which blocks its shell from reading files. With no shell it **refuses to generate** ("I'm blocked by the local tooling"). Bypass = full shell access = it can read the prompt file + save outputs. (Acceptable: local machine, user-owned folder, user-requested.)
4. **Instruct incremental save to the target folder.** Codex's `image_gen` saves to `~/.codex/generated_images/` by default. The TASK PROMPT must tell it to **copy each generated image into the target folder with the right name IMMEDIATELY after generating, before the next frame**, so partial progress persists and files are named correctly.

## TASK PROMPT template

Build the `<TASK PROMPT>` so Codex needs nothing interactive. For a batch from a script's asset prompts:

```
Read the file <PROMPTS_FILE> in this folder (use your shell, e.g. type <PROMPTS_FILE>).
Under '<SECTION HEADING>' there are N prompts labelled <list the labels>, each inside a fenced code block.
For EACH, in order, one at a time:
(1) call the built-in image_gen tool with that label's EXACT prompt text, <orientation> orientation;
(2) IMMEDIATELY copy the generated image into <TARGET_DIR> as exactly <label>.<ext> BEFORE the next one (incremental save);
(3) print 'SAVED <label>'.
Do NOT upscale; save the native image_gen output as-is.
<extra rules — e.g. "the prompts use a flat #00FF00 green-screen background on purpose; keep it green, do NOT make transparent">
For any item whose prompt says 'EDIT of <X>', edit the already-saved <X> file so the layout stays identical.
Generate ALL N. At the end print the full list of saved file paths.
```

If the prompts are short/few, **embed them directly** in the TASK PROMPT instead of having Codex read a file (removes the shell-read dependency entirely).

## Monitoring (do NOT poll aggressively)

The background task notifies on completion. To check on demand:

```bash
# count saved files
ls -1 "<TARGET_DIR>"/*.<ext> 2>/dev/null | wc -l
# progress lines from the log
grep -E "SAVED" "<LOGFILE>" | tail -10
# log tail (watch for the stdin-hang or sandbox-spawn errors above)
tail -8 "<LOGFILE>"
```

If a run misbehaves, inspect Codex's own session rollout for what tools it actually called:
```bash
ls -t "$HOME/.codex/sessions"/YYYY/MM/DD/rollout-*.jsonl | head -1
```
Diagnose from there (e.g. `Reading additional input from stdin`, `windows sandbox: spawn`, `Windsurf API Key not found`).

To kill a stuck run: `TaskStop` with the background task id, then relaunch with the fixes above.

## After completion — verify

1. **Count:** `ls "<TARGET_DIR>"/*.<ext> | wc -l` == expected N.
2. **Contact-sheet review:** read a few frames (Read tool on the PNGs) — check the subject/text rendered correctly and, for chroma assets, the background is a flat even key color (regenerate any frame with uneven/textured green).
3. Report every saved path + which (if any) need a regen.

## When NOT to use

- If `OPENAI_API_KEY` is set and the user prefers the standard imagegen CLI (`gpt-image-2`), that path also works — this skill is the Codex-login route.
- For 1-2 quick images where Codex startup overhead isn't worth it and a native/MCP image tool with credits is available.

## Notes

- Codex `image_gen` honors portrait/landscape but may generate at a base size then the agent upscales — tell it NOT to upscale to keep batches fast.
- Multiple stale `Codex.exe` processes from failed runs are harmless but can contribute to sandbox flakiness; bypassing the sandbox avoids that path entirely.

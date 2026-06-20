---
description: Generate images by delegating to Codex CLI's built-in image_gen tool (no OPENAI_API_KEY needed). Pass a prompt, a prompts-file path, or a folder of asset prompts. Optional --orientation, --target.
allowed-tools: [Bash, Read, Edit, Write, TaskStop]
argument-hint: <prompt | prompts-file | folder> [--orientation landscape|portrait|square] [--target <dir>] [--name <basename>]
---

You are invoking the **imagegen-codex** skill. Load and follow `~/.claude/skills/imagegen-codex/SKILL.md` exactly.

User input: `$ARGUMENTS`

Decide the input mode:
1. **Single prompt** — quoted string, no path: pass it directly as the TASK PROMPT.
2. **Prompts file** — path to a `.md`/`.txt` with N labelled prompts: use the batch TASK PROMPT template from the skill (read file, iterate, incremental save).
3. **Folder** — path containing `prompts.md` or `assets/prompts.md`: same as (2), inside that folder.

Resolve flags from `$ARGUMENTS`:
- `--orientation` → `landscape` (default), `portrait`, or `square`
- `--target` → output directory (default: a sensible sibling of the input, or `./out/`)
- `--name` → basename for single-prompt mode (default: `image`)

Then run the canonical invocation from SKILL.md:
- background, 60-min timeout, stdin closed (`< /dev/null`)
- `codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check --cd <WORKDIR>`
- Include the four-gotchas guardrails: long timeout, closed stdin, sandbox bypass, incremental save into target.

Verify per the "After completion" checklist: count files, spot-check a few, report saved paths.

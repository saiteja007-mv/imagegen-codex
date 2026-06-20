# imagegen-codex (Claude Code plugin)

Generate images by delegating to the **Codex CLI's built-in `image_gen` tool**. **No `OPENAI_API_KEY`, no paid MCP credits** — it uses the user's ChatGPT/Codex login.

Slash command: **`/imagegen-codex`**.

Useful when:
- Claude Code has no native `image_gen` tool, AND
- the paid image MCP (Higgsfield/Soul) has 0 credits, AND
- `OPENAI_API_KEY` is not set.

Built for batch asset generation from a script's prompt list, but works for one-off prompts too.

## Install — one command (npx)

```bash
npx imagegen-codex
```

That copies the slash command + skill into `~/.claude/` so `/imagegen-codex` works in every project. Pass `--dir /custom/path` to override the agent home.

## Prerequisites (do this once, separately)

```bash
npm i -g @openai/codex
codex login
```

The installer prints a warning if the `codex` CLI isn't on PATH but still installs the skill — you can authorise Codex any time later.

## Use it

```
/imagegen-codex generate the 8 prompts in assets/prompts.md into assets/out/
/imagegen-codex "a flat #00FF00 green-screen of a dinosaur typing on a laptop" --orientation landscape --target assets/
/imagegen-codex ./video-7/assets   (folder with prompts.md inside)
```

## What this repo ships

This repo is a **single-plugin marketplace** following the Claude Code plugin standard:

```
imagegen-codex/
├─ .claude-plugin/
│  ├─ plugin.json          # plugin manifest
│  └─ marketplace.json     # marketplace manifest (lets git/local install work)
├─ commands/
│  └─ imagegen-codex.md    # /imagegen-codex slash command → delegates to the skill
├─ skills/
│  └─ imagegen-codex/
│     └─ SKILL.md          # the canonical invocation + four gotchas
├─ bin/install.mjs         # npx entrypoint
├─ package.json
└─ README.md
```

## Install from GitHub (anyone)

```bash
npx github:saiteja007-mv/imagegen-codex
```

## The four gotchas (covered by the skill, listed here for context)

1. **Long timeout + background.** A short Bash timeout sends SIGINT mid-run; use ≥ 60 min + `run_in_background: true`.
2. **Close stdin** with `< /dev/null` or `codex exec` blocks forever on `Reading additional input from stdin...`.
3. **Bypass the sandbox** with `--dangerously-bypass-approvals-and-sandbox`. The Windows sandbox can fail with `spawn setup refresh`, and without a shell Codex refuses to generate.
4. **Incremental save**: tell Codex to copy each image into the target folder **immediately** after generating, before the next one. Default save location is `~/.codex/generated_images/`.

## License

MIT © Sai Teja Mothukuri

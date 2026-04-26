---
name: maintain-skills
description: Use when keeping MarketFlow .skills source notes and plugin SKILL.md files current after commits or reusable workflow changes.
---

# Maintain Skills

Use this skill when recent commits may have changed a repeatable MarketFlow workflow.

## Hook Reminders

Enable versioned Git hooks once per clone:

```bash
bash .skills/install-hooks.sh 3
```

The argument controls how often the post-commit hook generates a refresh prompt:

- `1`: after every commit.
- `3`: after every three commits.
- `0`: disable the reminder.

The hook writes the generated prompt to:

```text
.git/marketflow-skills-refresh-prompt.md
```

It does not edit tracked files.

## Manual Refresh

Generate a prompt manually:

```bash
bash .skills/refresh-skills.sh 3
```

Use a commit range or branch name when that is more precise:

```bash
bash .skills/refresh-skills.sh main..HEAD
bash .skills/refresh-skills.sh feature/branch-name
```

## Update Rules

When the prompt identifies a reusable workflow change:

1. Update the source note in `.skills/*.md` or create a new note from `.skills/TEMPLATE.md`.
2. Mirror agent-facing instructions into `plugins/marketflow-workflows/skills/<skill-name>/SKILL.md`.
3. Validate changed plugin skills with the skill validator.
4. Commit the code change and skill update together when possible.

## Verification

Validate a plugin skill:

```bash
python3 /Users/bytedance/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/marketflow-workflows/skills/<skill-name>
```

Validate plugin JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('.agents/plugins/marketplace.json','utf8')); JSON.parse(require('fs').readFileSync('plugins/marketflow-workflows/.codex-plugin/plugin.json','utf8')); console.log('ok')"
```

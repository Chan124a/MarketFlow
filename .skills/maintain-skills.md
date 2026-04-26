---
name: maintain-skills
description: Procedure for keeping MarketFlow repo skills and plugin skills current after workflow-related code changes.
---

# Maintain Skills

Use this workflow when commits introduce or change repeatable project procedures.

---

## Prerequisites
- [ ] Working tree changes have been reviewed.
- [ ] Versioned hooks are enabled if automatic reminders are desired.

## Steps

### 1. Enable Hook Reminders
Run this once per local clone:
```bash
bash .skills/install-hooks.sh 3
```

Use `1` to generate a refresh prompt after every commit, a larger number for batches, or `0` to disable:
```bash
bash .skills/install-hooks.sh 1
bash .skills/install-hooks.sh 0
```

### 2. Generate a Refresh Prompt Manually
When needed, generate a prompt for recent commits:
```bash
bash .skills/refresh-skills.sh 3
```

The post-commit hook writes batched prompts to:
```text
.git/marketflow-skills-refresh-prompt.md
```

### 3. Update Source Notes
If the prompt identifies a reusable workflow change, update the matching `.skills/*.md` source note or create a new one from `.skills/TEMPLATE.md`.

### 4. Mirror Agent Skills
Mirror reusable agent-facing changes into:
```text
plugins/marketflow-workflows/skills/<skill-name>/SKILL.md
```

## Verification
Validate plugin skills after changes:
```bash
python3 /Users/bytedance/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/marketflow-workflows/skills/<skill-name>
```

Validate plugin JSON:
```bash
node -e "JSON.parse(require('fs').readFileSync('.agents/plugins/marketplace.json','utf8')); JSON.parse(require('fs').readFileSync('plugins/marketflow-workflows/.codex-plugin/plugin.json','utf8')); console.log('ok')"
```

---

## Notes
- Git hooks are local. They are versioned in `.githooks/`, but each clone must enable them with `.skills/install-hooks.sh`.
- The hook only generates a prompt under `.git/`; it does not edit tracked skill files.
- Commit skill updates together with the code changes that introduced the reusable workflow.

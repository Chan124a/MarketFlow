#!/usr/bin/env bash
# .skills/refresh-skills.sh
#
# Usage:
#   bash .skills/refresh-skills.sh              # last 1 commit
#   bash .skills/refresh-skills.sh 3            # last N commits
#   bash .skills/refresh-skills.sh abc123       # from commit to HEAD
#   bash .skills/refresh-skills.sh abc123..def456  # explicit range
#   bash .skills/refresh-skills.sh feature/foo  # branch vs main
#
# Output: a prompt you paste into Antigravity (or any LLM with repo access).

set -euo pipefail

SKILLS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SKILLS_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ── Parse argument → git range ────────────────────────────────────────────────
ARG="${1:-1}"
if [[ "$ARG" =~ ^[0-9]+$ ]]; then
  # plain number → last N commits
  RANGE="HEAD~${ARG}..HEAD"
  RANGE_LABEL="last ${ARG} commit(s)"
elif [[ "$ARG" == *".."* ]]; then
  # explicit range like abc..def
  RANGE="$ARG"
  RANGE_LABEL="range $ARG"
elif git rev-parse --verify "$ARG" &>/dev/null 2>&1; then
  # single commit hash OR branch name
  if git rev-parse --verify "refs/heads/$ARG" &>/dev/null 2>&1 || \
     git rev-parse --verify "refs/remotes/origin/$ARG" &>/dev/null 2>&1; then
    # it's a branch name → diff against merge-base with main
    BASE=$(git merge-base main "$ARG" 2>/dev/null || git merge-base master "$ARG" 2>/dev/null || echo "")
    if [[ -z "$BASE" ]]; then
      echo "ERROR: Could not find merge-base between main/master and '$ARG'" >&2
      exit 1
    fi
    RANGE="${BASE}..${ARG}"
    RANGE_LABEL="branch '$ARG' vs main"
  else
    # commit hash → from that commit to HEAD
    RANGE="${ARG}..HEAD"
    RANGE_LABEL="from $ARG to HEAD"
  fi
else
  echo "ERROR: '$ARG' is not a number, commit hash, branch, or range." >&2
  exit 1
fi

# ── Collect data ──────────────────────────────────────────────────────────────
LOG=$(git log --oneline "$RANGE" 2>/dev/null)
STAT=$(git diff --stat "$RANGE" 2>/dev/null)
# Cap patch at ~300 lines to keep prompt manageable
PATCH=$(git diff "$RANGE" -- \
  ':(exclude)*.lock' \
  ':(exclude)package-lock.json' \
  ':(exclude)dist/*' \
  ':(exclude).next/*' \
  2>/dev/null | head -n 300)
PATCH_LINES=$(git diff "$RANGE" -- \
  ':(exclude)*.lock' \
  ':(exclude)package-lock.json' \
  ':(exclude)dist/*' \
  ':(exclude).next/*' \
  2>/dev/null | wc -l | tr -d ' ')

TRUNCATED=""
if [[ "$PATCH_LINES" -gt 300 ]]; then
  TRUNCATED="  [... diff truncated at 300 lines, ${PATCH_LINES} total ...]"
fi

# ── List existing skills ──────────────────────────────────────────────────────
EXISTING_SKILLS=$(ls "$SKILLS_DIR"/*.md 2>/dev/null | xargs -I{} basename {} .md | sort | tr '\n' ', ' | sed 's/, $//')

# ── Print prompt ──────────────────────────────────────────────────────────────
cat <<PROMPT
════════════════════════════════════════════════════════════════
  PASTE THIS PROMPT TO ANTIGRAVITY
════════════════════════════════════════════════════════════════

I want you to analyse the following git changes (${RANGE_LABEL})
and update the project skills in \`.skills/\`.

## Existing skills
${EXISTING_SKILLS:-none}

## Your task
1. If the changes introduce a **new reusable pattern or workflow**,
   create a new \`.skills/<topic>.md\` file following the same style
   as the existing skill files.
2. If the changes **modify or extend an existing pattern**, update
   the relevant skill file to reflect the new behaviour.
3. If the changes are trivial (typos, styling, config tweaks),
   do nothing and say so.

Respond with the exact file path and full updated/new content,
then a one-line summary of what changed and why.

---

## Git log (${RANGE_LABEL})
\`\`\`
${LOG:-  (no commits in range)}
\`\`\`

## Changed files
\`\`\`
${STAT:-  (no changes)}
\`\`\`

## Diff (first 300 lines of meaningful changes)
\`\`\`diff
${PATCH:-  (empty diff)}
${TRUNCATED}
\`\`\`

════════════════════════════════════════════════════════════════
PROMPT

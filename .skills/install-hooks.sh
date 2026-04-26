#!/usr/bin/env bash
# Enable versioned MarketFlow git hooks for this local clone.

set -euo pipefail

SKILLS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SKILLS_DIR/.." && pwd)"
cd "$REPO_ROOT"

INTERVAL="${1:-3}"
if ! [[ "$INTERVAL" =~ ^[0-9]+$ ]]; then
  echo "ERROR: interval must be a non-negative integer." >&2
  exit 1
fi

git config core.hooksPath .githooks
git config marketflow.skillsRefreshInterval "$INTERVAL"

echo "Enabled MarketFlow git hooks."
echo "Skill refresh prompt interval: $INTERVAL commit(s)."
echo "Set interval to 0 to disable: bash .skills/install-hooks.sh 0"

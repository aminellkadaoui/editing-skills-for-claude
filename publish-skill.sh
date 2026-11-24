#!/bin/bash
# Copy a skill from ~/.claude/skills into this repo and push it to GitHub.
# usage: ./publish-skill.sh <skill-name> ["commit message"]
# Never deletes anything: it only copies the skill in (rsync without --delete) and commits.
set -e
cd "$(dirname "$0")"
NAME="$1"; MSG="${2:-Update $1}"
[ -n "$NAME" ] || { echo "usage: $0 <skill-name> [message]"; exit 1; }
SRC="$HOME/.claude/skills/$NAME"
[ -d "$SRC" ] || { echo "no skill at $SRC"; exit 1; }
mkdir -p "skills/$NAME"
rsync -a --exclude ".git" --exclude ".DS_Store" --exclude "__pycache__" "$SRC/" "skills/$NAME/"
git add "skills/$NAME" README.md
git commit -m "$MSG" || echo "nothing new to commit"
git push
echo "published: https://github.com/aminellkadaoui/editing-skills-for-claude/tree/main/skills/$NAME"

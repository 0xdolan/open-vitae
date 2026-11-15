#!/usr/bin/env bash
# Initialise the repository with the Open Vitae git flow layout:
#   main     protected, default, release history only
#   develop  integration branch
#
# Safe to re-run: it only creates what is missing.
# Usage: bash scripts/init-git-flow.sh

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed" >&2
  exit 1
fi

if [ ! -d .git ]; then
  git init --initial-branch=main
  echo "Initialised a new repository on main."
fi

current="$(git symbolic-ref --short HEAD 2>/dev/null || true)"

# Rename master to main if that is what we were given.
if [ "$current" = "master" ]; then
  git branch -m master main
  current="main"
  echo "Renamed master to main."
fi

# First commit, if the repository has none yet.
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  if [ "$current" != "main" ]; then
    git checkout -b main
  fi
  git add -A
  git commit -m "chore: initial project scaffold"
  echo "Created the initial commit on main."
fi

if ! git show-ref --verify --quiet refs/heads/main; then
  echo "No main branch found. Create it before continuing." >&2
  exit 1
fi

if ! git show-ref --verify --quiet refs/heads/develop; then
  git branch develop main
  echo "Created develop from main."
fi

git checkout develop

cat <<'EOF'

Done. You are on develop.

Next steps:
  1. Create the GitHub repository and push both branches:
       git remote add origin git@github.com:<you>/open-vitae.git
       git push -u origin main develop
  2. Protect main and make it the default branch:
       bash scripts/protect-main.sh <you>/open-vitae
  3. Start work on a feature branch:
       git checkout -b feature/<short-name> develop
EOF

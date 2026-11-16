#!/usr/bin/env bash
# Make main the default branch and protect main and develop on GitHub.
# Requires the GitHub CLI, signed in with admin rights on the repository.
#
# Usage: bash scripts/protect-main.sh <owner>/<repo>

set -euo pipefail

repo="${1:-}"
if [ -z "$repo" ]; then
  echo "Usage: bash scripts/protect-main.sh <owner>/<repo>" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "The GitHub CLI (gh) is not installed: https://cli.github.com" >&2
  exit 1
fi

echo "Setting main as the default branch of $repo"
gh api --method PATCH "repos/$repo" -f default_branch=main >/dev/null

protect() {
  local branch="$1"
  local approvals="$2"
  echo "Protecting $branch"
  gh api --method PUT "repos/$repo/branches/$branch/protection" --input - >/dev/null <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Typecheck, lint, test, build", "Docker image builds"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": $approvals,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
}

# A solo maintainer cannot approve their own pull request, so the default is 0
# approvals with required checks. Raise APPROVALS once there are reviewers.
approvals="${APPROVALS:-0}"

protect main "$approvals"
protect develop "$approvals"

echo "Enabling GitHub Pages with GitHub Actions as the source"
gh api --method POST "repos/$repo/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api --method PUT "repos/$repo/pages" -f build_type=workflow >/dev/null

echo "Done."

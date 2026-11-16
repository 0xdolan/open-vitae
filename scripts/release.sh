#!/usr/bin/env bash
# Finish a release prepared on a release/X.Y.Z branch (see docs/04-release-process.md).
#
#   bash scripts/release.sh prepare X.Y.Z
#       On release/X.Y.Z: install, download the bundled fonts, run every check and both
#       builds, commit package-lock.json and public/fonts if they changed, push the branch
#       and open a pull request into main.
#
#   bash scripts/release.sh tag X.Y.Z
#       After that pull request is merged (as a merge commit): tag the merge on main,
#       push the tag (the Release workflow then publishes the GitHub release) and open a
#       pull request that brings the release back into develop.
#
# Needs git, Node.js 22+ and, for the pull requests, the GitHub CLI (gh). Without gh it
# prints the links to open them by hand.
set -euo pipefail

usage() {
  echo "Usage: bash scripts/release.sh prepare|tag X.Y.Z" >&2
  exit 1
}

[ $# -eq 2 ] || usage
step="$1"
version="$2"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Not a version: $version (expected X.Y.Z)" >&2; exit 1; }

branch="release/$version"
tag="v$version"
cd "$(git rev-parse --show-toplevel)"

die() {
  echo "$*" >&2
  exit 1
}

clean_tree() {
  [ -z "$(git status --porcelain)" ] || die "The working tree has uncommitted changes. Commit or stash them first."
}

# The prepare step may run again after a failed check: the lockfile and the downloaded
# fonts it created are expected then, and are committed once every check passes.
clean_tree_except_release_files() {
  [ -z "$(git status --porcelain -- . ':(exclude)package-lock.json' ':(exclude)public/fonts')" ] \
    || die "The working tree has uncommitted changes. Commit or stash them first."
}

release_notes() {
  awk -v v="$version" '
    $0 ~ "^## \\[" v "\\]" { found = 1; next }
    found && /^## \[/ { exit }
    found && /^\[[^]]+\]: / { exit }
    found { print }
  ' CHANGELOG.md
}

repo_url() {
  git remote get-url origin | sed -E 's#^git@github.com:#https://github.com/#; s#\.git$##'
}

open_pr() {
  local base="$1" title="$2" body="$3"
  local link
  link="$(repo_url)/compare/$base...$branch?expand=1"
  if command -v gh >/dev/null 2>&1; then
    gh pr create --base "$base" --head "$branch" --title "$title" --body "$body" \
      || echo "Could not open the pull request with gh. Open it here: $link"
  else
    echo "Open this pull request: $link"
  fi
}

prepare() {
  clean_tree_except_release_files
  git rev-parse --verify --quiet "$branch" >/dev/null || die "There is no branch $branch. Create it from develop first (docs/04-release-process.md)."
  [ "$(git rev-parse --abbrev-ref HEAD)" = "$branch" ] || git checkout --quiet "$branch"

  local pkg
  pkg="$(node -p "require('./package.json').version")"
  [ "$pkg" = "$version" ] || die "package.json says $pkg, not $version."
  grep -q "^## \[$version\] - " CHANGELOG.md || die "CHANGELOG.md has no section for $version."
  if git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then die "The tag $tag already exists."; fi

  echo "==> Installing dependencies"
  if [ -f package-lock.json ]; then npm ci; else npm install; fi

  echo "==> Bundled fonts"
  npm run fonts:fetch
  npm run fonts:fetch -- --check

  echo "==> Checks and builds"
  npm run check
  npm run build
  npm run site:build

  git add package-lock.json public/fonts
  if ! git diff --cached --quiet; then
    git commit --quiet -m "build(release): add the lockfile and the bundled fonts for $version"
    echo "Committed package-lock.json and public/fonts."
  fi

  echo "==> Pushing $branch"
  git push -u origin "$branch"
  open_pr main "Release $version" "$(release_notes)"
  cat <<MSG

Next: merge the pull request into main with a merge commit (not squash or rebase),
then run:  bash scripts/release.sh tag $version
MSG
}

tag_release() {
  clean_tree
  git fetch --quiet origin
  git rev-parse --verify --quiet "origin/$branch" >/dev/null || die "origin/$branch does not exist. Run the prepare step first."
  git merge-base --is-ancestor "origin/$branch" origin/main \
    || die "origin/main does not contain $branch yet. Merge the pull request (as a merge commit) first."
  if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1; then die "The tag $tag is already on GitHub."; fi

  git checkout --quiet main
  git merge --ff-only --quiet origin/main
  local pkg
  pkg="$(node -p "require('./package.json').version")"
  [ "$pkg" = "$version" ] || die "package.json on main says $pkg, not $version."

  git tag -a "$tag" -m "Open Vitae $version"
  git push origin "$tag"
  echo "Pushed $tag. The Release workflow now builds and publishes the GitHub release."

  open_pr develop "Merge release $version back into develop" "Brings the $version version bump and release files back into develop."
  cat <<MSG

Next: merge that pull request into develop (merge commit), then delete the branch:
  git push origin --delete $branch && git branch -d $branch
MSG
}

case "$step" in
  prepare) prepare ;;
  tag) tag_release ;;
  *) usage ;;
esac

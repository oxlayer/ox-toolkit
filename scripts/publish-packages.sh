#!/usr/bin/env bash
#
# Publish all non-private @oxlayer/* packages to npm.
#
# Skips a package if its version is already on the registry. Honours
# DRY_RUN=true (passes --dry-run to npm publish).
#
# Expects: jq, npm, NPM_TOKEN env var (consumed via ~/.npmrc).

set -euo pipefail

DRY_RUN_FLAG=""
if [[ "${DRY_RUN:-false}" == "true" ]]; then
  DRY_RUN_FLAG="--dry-run"
  echo "DRY RUN — no packages will actually be published"
  echo
fi

published=0
skipped=0
failed=0
failed_names=()

while IFS= read -r f; do
  name=$(jq -r '.name // empty' "$f")
  version=$(jq -r '.version // empty' "$f")
  private=$(jq -r '.private // false' "$f")

  if [[ "$name" != "@oxlayer/"* || "$private" == "true" ]]; then
    continue
  fi

  if [[ -z "$version" ]]; then
    echo "[skip] $name: no version field"
    skipped=$((skipped + 1))
    continue
  fi

  if npm view "${name}@${version}" version >/dev/null 2>&1; then
    echo "[skip] $name@$version already on registry"
    skipped=$((skipped + 1))
    continue
  fi

  pkg_dir=$(dirname "$f")
  echo "[publish] $name@$version (from $pkg_dir)"
  if (cd "$pkg_dir" && npm publish --access public $DRY_RUN_FLAG); then
    published=$((published + 1))
  else
    echo "[FAIL] $name@$version"
    failed=$((failed + 1))
    failed_names+=("$name@$version")
  fi
done < <(find . -maxdepth 6 -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -not -path "*/.next/*")

echo
echo "Summary: $published published, $skipped skipped, $failed failed"
if [[ "$failed" -gt 0 ]]; then
  printf 'Failed packages:\n'
  printf '  - %s\n' "${failed_names[@]}"
  exit 1
fi

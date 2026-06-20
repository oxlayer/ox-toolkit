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

# Map of @oxlayer name → version, used to convert workspace:* inter-
# package deps to concrete ^<version> ranges before publishing (npm
# publish does not convert the workspace protocol for a Bun monorepo).
echo "Building @oxlayer name→version map…"
OX_MAP=$(find . -maxdepth 6 -name "package.json" \
    -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -not -path "*/.next/*" \
    -exec jq -c 'select((.name // "") | startswith("@oxlayer/")) | {(.name): (.version // "")}' {} \; \
  | jq -s 'add // {}')

published=0
skipped=0
failed=0
failed_names=()

while IFS= read -r f; do
  name=$(jq -r '.name // empty' "$f")
  version=$(jq -r '.version // empty' "$f")
  private=$(jq -r '.private // false' "$f")
  license=$(jq -r '.license // empty' "$f")

  if [[ "$name" != "@oxlayer/"* || "$private" == "true" ]]; then
    continue
  fi

  # License gate: only publish Apache-2.0 (or MIT) to public npm.
  # backend/pro/** is BSL — never publish to public registry.
  if [[ "$f" == *"backend/pro/"* ]]; then
    echo "[skip] $name: under backend/pro/ (BSL — not publishable to public npm)"
    skipped=$((skipped + 1))
    continue
  fi
  if [[ "$license" != "Apache-2.0" && "$license" != "MIT" ]]; then
    echo "[skip] $name: license is '$license' (only Apache-2.0 or MIT allowed)"
    skipped=$((skipped + 1))
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
  # Convert workspace:* inter-@oxlayer deps → ^<version> before publish
  # (restored on exit). Without this the published artifact ships
  # "@oxlayer/x": "workspace:*" and is uninstallable downstream.
  if (
    cd "$pkg_dir"
    cp package.json .package.json.npmbak
    trap 'mv -f .package.json.npmbak package.json' EXIT
    jq --argjson map "$OX_MAP" '
      def conv: if . == null then . else with_entries(
        if (.value | type == "string") and (.value | startswith("workspace:")) and ($map[.key] != null)
        then .value = "^" + $map[.key] else . end
      ) end;
      .dependencies |= conv
      | .devDependencies |= conv
      | .peerDependencies |= conv
      | .optionalDependencies |= conv
    ' .package.json.npmbak > package.json
    bun publish --access public $DRY_RUN_FLAG
  ); then
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

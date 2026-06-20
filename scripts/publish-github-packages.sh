#!/usr/bin/env bash
#
# Publish ALL non-private @oxlayer/* packages to GitHub Packages
# (https://npm.pkg.github.com), INCLUDING the BSL-licensed backend/pro/**
# tier.
#
# Why GitHub Packages (vs public npm):
#   - The Apache-2.0 packages go to PUBLIC npm via publish-packages.sh.
#   - The BSL-1.1 backend/pro/** tier must NOT go to public npm, but
#     downstream consumers (e.g. fatorh) still need to `npm install` it.
#     GitHub Packages is an auth-gated registry, so it preserves the BSL
#     distribution gate while remaining installable with a token.
#   - npm/pnpm route registries PER-SCOPE, not per-package — a consumer
#     can't pull `@oxlayer/pro-*` from one registry and `@oxlayer/cap-*`
#     from another. So we mirror the ENTIRE @oxlayer scope here (Apache
#     packages included) and let the consumer point `@oxlayer:registry`
#     at GitHub Packages for the whole scope. The Apache packages stay on
#     public npm too for the open-source world.
#
# Skips a package if its version is already on GitHub Packages. Honours
# DRY_RUN=true (passes --dry-run to npm publish).
#
# Expects: jq, npm, NODE_AUTH_TOKEN (a token with packages:write on the
# oxlayer org — the workflow's GITHUB_TOKEN suffices) wired via ~/.npmrc.

set -euo pipefail

GH_REGISTRY="https://npm.pkg.github.com"

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

  # GitHub Packages requires a `repository` field pointing at the repo
  # that owns the package — refuse to publish without it (would 404).
  if [[ "$(jq -r '.repository // empty' "$f")" == "" ]]; then
    echo "[skip] $name: no repository field (GitHub Packages requires it)"
    skipped=$((skipped + 1))
    continue
  fi

  if npm view "${name}@${version}" version --registry "$GH_REGISTRY" >/dev/null 2>&1; then
    echo "[skip] $name@$version already on GitHub Packages"
    skipped=$((skipped + 1))
    continue
  fi

  pkg_dir=$(dirname "$f")
  tier="apache"
  [[ "$f" == *"backend/pro/"* ]] && tier="BSL-pro"
  echo "[publish] $name@$version → GitHub Packages ($tier, from $pkg_dir)"

  # publishConfig.registry in package.json points at public npmjs and
  # takes precedence over a CLI --registry flag. Temporarily rewrite it
  # to GitHub Packages for THIS publish, then restore — never leave the
  # working tree mutated (restore even on failure).
  if (
    cd "$pkg_dir"
    cp package.json .package.json.ghbak
    trap 'mv -f .package.json.ghbak package.json' EXIT
    jq --arg r "$GH_REGISTRY" '.publishConfig.registry = $r | .publishConfig.access = "restricted"' \
      .package.json.ghbak > package.json
    bun publish --registry "$GH_REGISTRY" --access restricted $DRY_RUN_FLAG
  ); then
    published=$((published + 1))
  else
    echo "[FAIL] $name@$version"
    failed=$((failed + 1))
    failed_names+=("$name@$version")
  fi
done < <(find . -maxdepth 6 -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -not -path "*/.next/*")

echo
echo "Summary (GitHub Packages): $published published, $skipped skipped, $failed failed"
if [[ "$failed" -gt 0 ]]; then
  printf 'Failed packages:\n'
  printf '  - %s\n' "${failed_names[@]}"
  exit 1
fi

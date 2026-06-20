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

# Build a map of every @oxlayer package name → its version. We use this
# to convert `workspace:*` (and workspace:^ / ~ / <range>) inter-package
# deps to concrete `^<version>` ranges before publishing. `npm publish`
# does NOT convert the workspace protocol for a Bun monorepo, and
# `bun publish` fails to resolve it in this layout — so we do it
# deterministically here. Without this, published packages ship with
# "@oxlayer/x": "workspace:*" deps and are uninstallable downstream.
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

  # Temporarily rewrite package.json for THIS publish (restored on exit):
  #   1. publishConfig.registry → GitHub Packages (it points at public
  #      npmjs by default and takes precedence over a CLI --registry).
  #   2. workspace:* inter-@oxlayer deps → ^<version> from OX_MAP, so the
  #      published artifact is installable outside the workspace.
  if (
    cd "$pkg_dir"
    cp package.json .package.json.ghbak
    trap 'mv -f .package.json.ghbak package.json' EXIT
    jq --arg r "$GH_REGISTRY" --argjson map "$OX_MAP" '
      def conv: if . == null then . else with_entries(
        if (.value | type == "string") and (.value | startswith("workspace:")) and ($map[.key] != null)
        then .value = "^" + $map[.key] else . end
      ) end;
      .publishConfig.registry = $r
      | .publishConfig.access = "restricted"
      | .dependencies |= conv
      | .devDependencies |= conv
      | .peerDependencies |= conv
      | .optionalDependencies |= conv
    ' .package.json.ghbak > package.json
    # The jq step above already converted workspace:* → real versions, so
    # there's no workspace protocol left to resolve. The job's .npmrc
    # sets the DEFAULT registry to GitHub Packages, so npm's whoami
    # precheck targets it (not npmjs) and auth succeeds.
    npm publish --registry "$GH_REGISTRY" --access restricted $DRY_RUN_FLAG
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

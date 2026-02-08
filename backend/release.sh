#!/usr/bin/env bash
set -e

# ---- read root package info ----
ROOT_PKG="package.json"
PROJECT_NAME=$(node -p "require('./$ROOT_PKG').name")
VERSION=$(node -p "require('./$ROOT_PKG').version")

OUT_BASE="release"
OUT="$OUT_BASE/$VERSION"
ZIP="$OUT_BASE/$PROJECT_NAME-$VERSION.zip"
VERSION_MODE="*"   # "*" or "latest"

# ---- clean ----
rm -rf "$OUT" "$ZIP"
mkdir -p "$OUT"

pnpm run clean
pnpm run rebuild:ordered

# ---- helper: rewrite workspace:* ----
rewrite_workspace_versions () {
  local pkg="$1"
  local mode="$2"

  node - <<EOF
const fs = require('fs');

const file = "$pkg";
const mode = "$mode";

const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const sections = ['dependencies','peerDependencies','optionalDependencies'];

for (const section of sections) {
  if (!json[section]) continue;
  for (const dep of Object.keys(json[section])) {
    if (json[section][dep] === 'workspace:*') {
      json[section][dep] = mode;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(json, null, 2));
EOF
}

# ---- roots to preserve ----
ROOTS=(
  foundation
  cli
  capabilities
  capabilities-web
  pro
  snippets
)

# ---- package ----
for root in "${ROOTS[@]}"; do
  [ -d "$root" ] || continue

  find "$root" -type f -name package.json \
    -not -path "*/node_modules/*" \
    -not -path "*/.pnpm/*" \
    | while read pkg; do
        dir=$(dirname "$pkg")

        if [ -d "$dir/dist" ]; then
          rel="${dir#$root/}"
          target="$OUT/$root/$rel"

          echo "📦 Packaging $root/$rel"

          mkdir -p "$target"
          cp "$dir/package.json" "$target/"
          cp -r "$dir/dist" "$target/"

          # rewrite_workspace_versions "$target/package.json" "$VERSION_MODE"
        fi
      done
done

# ---- zip ----
cd "$OUT_BASE"
zip -r "$(basename "$ZIP")" "$VERSION"
cd - >/dev/null

echo "✅ Release generated:"
echo "   📁 $OUT"
echo "   📦 $ZIP"

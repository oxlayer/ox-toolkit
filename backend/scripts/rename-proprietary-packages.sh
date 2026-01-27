#!/bin/bash

# Script to rename proprietary packages from @oxlayer/capabilities-* to @oxlayer/pro-*

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROPRIETARY_DIR="$BASE_DIR/proprietary"

# Mapping of old names to new names
declare -A PACKAGE_RENAMES=(
    ["@oxlayer/capabilities-tenancy"]="@oxlayer/pro-tenancy"
    ["@oxlayer/capabilities-adapters-postgres-tenancy"]="@oxlayer/pro-adapters-postgres-tenancy"
    ["@oxlayer/capabilities-adapters-mongo-tenancy"]="@oxlayer/pro-adapters-mongo-tenancy"
    ["@oxlayer/capabilities-adapters-redis-tenancy"]="@oxlayer/pro-adapters-redis-tenancy"
    ["@oxlayer/capabilities-adapters-clickhouse-tenancy"]="@oxlayer/pro-adapters-clickhouse-tenancy"
    ["@oxlayer/capabilities-adapters-influxdb-tenancy"]="@oxlayer/pro-adapters-influxdb-tenancy"
    ["@oxlayer/capabilities-adapters-rabbitmq-tenancy"]="@oxlayer/pro-adapters-rabbitmq-tenancy"
    ["@oxlayer/capabilities-adapters-sqs-tenancy"]="@oxlayer/pro-adapters-sqs-tenancy"
    ["@oxlayer/capabilities-adapters-mqtt-tenancy"]="@oxlayer/pro-adapters-mqtt-tenancy"
    ["@oxlayer/capabilities-adapters-s3-tenancy"]="@oxlayer/pro-adapters-s3-tenancy"
    ["@oxlayer/capabilities-adapters-qdrant-tenancy"]="@oxlayer/pro-adapters-qdrant-tenancy"
    ["@oxlayer/capabilities-adapters-quickwit-tenancy"]="@oxlayer/pro-adapters-quickwit-tenancy"
)

# Reverse mapping for dependencies
declare -A REVERSE_RENAMES
for old in "${!PACKAGE_RENAMES[@]}"; do
    REVERSE_RENAMES["${PACKAGE_RENAMES[$old]}"]="$old"
done

echo "🔄 Renaming proprietary packages..."

# Function to rename in package.json
rename_in_package_json() {
    local pkg_file="$1"
    echo "  Processing $pkg_file"

    # Use Node.js to properly update the JSON file
    node --eval "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$pkg_file', 'utf8'));

        // Rename the package itself
        const renames = $(declare -p PACKAGE_RENAMES);
        for (const [old, newName] of Object.entries(renames)) {
            if (pkg.name === old) {
                pkg.name = newName;
                console.log('    Renamed: ' + old + ' -> ' + newName);
            }
        }

        // Update dependencies
        ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
            if (pkg[depType]) {
                Object.keys(pkg[depType]).forEach(dep => {
                    if (renames[dep]) {
                        pkg[depType][renames[dep]] = pkg[depType][dep];
                        delete pkg[depType][dep];
                        console.log('    Updated dependency: ' + dep + ' -> ' + renames[dep]);
                    }
                });
            }
        });

        fs.writeFileSync('$pkg_file', JSON.stringify(pkg, null, 2) + '\\n');
    "
}

# Function to rename imports in TypeScript files
rename_in_typescript_files() {
    local dir="$1"
    echo "  Processing TypeScript files in $dir"

    find "$dir" -name "*.ts" -type f -exec sed -i \
        -e "s|@oxlayer/capabilities-tenancy|@oxlayer/pro-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-postgres-tenancy|@oxlayer/pro-adapters-postgres-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-mongo-tenancy|@oxlayer/pro-adapters-mongo-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-redis-tenancy|@oxlayer/pro-adapters-redis-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-clickhouse-tenancy|@oxlayer/pro-adapters-clickhouse-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-influxdb-tenancy|@oxlayer/pro-adapters-influxdb-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-rabbitmq-tenancy|@oxlayer/pro-adapters-rabbitmq-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-sqs-tenancy|@oxlayer/pro-adapters-sqs-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-mqtt-tenancy|@oxlayer/pro-adapters-mqtt-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-s3-tenancy|@oxlayer/pro-adapters-s3-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-qdrant-tenancy|@oxlayer/pro-adapters-qdrant-tenancy|g" \
        -e "s|@oxlayer/capabilities-adapters-quickwit-tenancy|@oxlayer/pro-adapters-quickwit-tenancy|g" \
        {} \;
}

# Update package.json files in proprietary
echo "📦 Updating package.json files in proprietary/..."
find "$PROPRIETARY_DIR" -name "package.json" -type f | while read -r pkg_file; do
    rename_in_package_json "$pkg_file"
done

# Update imports in proprietary source files
echo "📝 Updating imports in proprietary source files..."
rename_in_typescript_files "$PROPRIETARY_DIR"

# Update imports in examples
echo "📝 Updating imports in examples..."
rename_in_typescript_files "$BASE_DIR/examples"

# Update README files
echo "📝 Updating README files..."
find "$BASE_DIR" -name "README.md" -type f -exec sed -i \
    -e "s|@oxlayer/capabilities-tenancy|@oxlayer/pro-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-postgres-tenancy|@oxlayer/pro-adapters-postgres-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-mongo-tenancy|@oxlayer/pro-adapters-mongo-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-redis-tenancy|@oxlayer/pro-adapters-redis-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-clickhouse-tenancy|@oxlayer/pro-adapters-clickhouse-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-influxdb-tenancy|@oxlayer/pro-adapters-influxdb-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-rabbitmq-tenancy|@oxlayer/pro-adapters-rabbitmq-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-sqs-tenancy|@oxlayer/pro-adapters-sqs-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-mqtt-tenancy|@oxlayer/pro-adapters-mqtt-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-s3-tenancy|@oxlayer/pro-adapters-s3-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-qdrant-tenancy|@oxlayer/pro-adapters-qdrant-tenancy|g" \
    -e "s|@oxlayer/capabilities-adapters-quickwit-tenancy|@oxlayer/pro-adapters-quickwit-tenancy|g" \
    -e "s|@oxlayer/staples-tenancy|@oxlayer/pro-tenancy|g" \
    -e "s|@oxlayer/staples-adapters-postgres-tenancy|@oxlayer/pro-adapters-postgres-tenancy|g" \
    -e "s|@oxlayer/staples-adapters-mongo-tenancy|@oxlayer/pro-adapters-mongo-tenancy|g" \
    -e "s|@oxlayer/staples-adapters-redis-tenancy|@oxlayer/pro-adapters-redis-tenancy|g" \
    -e "s|@oxlayer/staples-adapters-rabbitmq-tenancy|@oxlayer/pro-adapters-rabbitmq-tenancy|g" \
    -e "s|@oxlayer/staples-adapters-bullmq-scheduler|@oxlayer/pro-adapters-bullmq-scheduler|g" \
    {} \;

echo ""
echo "✅ Done! Packages renamed from @oxlayer/capabilities-* to @oxlayer/pro-*"
echo ""
echo "📋 Summary of changes:"
echo "   - Package names in package.json files"
echo "   - Dependencies in package.json files"
echo "   - Imports in TypeScript files"
echo "   - Documentation in README files"

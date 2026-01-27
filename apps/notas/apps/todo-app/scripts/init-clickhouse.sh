#!/bin/bash
# Initialize ClickHouse schema for business events/metrics

set -e

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-analytics}"

echo "🚀 Initializing ClickHouse schema for business events and metrics..."

# Create database if not exists
echo "📦 Creating database '$CLICKHOUSE_DB' if not exists..."
clickhouse-client --host $CLICKHOUSE_HOST --port $CLICKHOUSE_PORT --query "CREATE DATABASE IF NOT EXISTS $CLICKHOUSE_DB"

# Apply schema files
SCHEMA_DIR="$(dirname "$0")/../db/clickhouse"
if [ -d "$SCHEMA_DIR" ]; then
    for sql_file in "$SCHEMA_DIR"/*.sql; do
        if [ -f "$sql_file" ]; then
            echo "📄 Applying $(basename "$sql_file")..."
            clickhouse-client --host $CLICKHOUSE_HOST --port $CLICKHOUSE_PORT --database $CLICKHOUSE_DB --multiquery < "$sql_file"
        fi
    done
    echo "✅ Schema files applied successfully!"
else
    echo "⚠️  Schema directory not found: $SCHEMA_DIR"
    exit 1
fi

# Verify tables were created
echo ""
echo "🔍 Verifying tables..."
clickhouse-client --host $CLICKHOUSE_HOST --port $CLICKHOUSE_PORT --query "SELECT name FROM system.tables WHERE database = '$CLICKHOUSE_DB' AND name IN ('domain_events', 'business_metrics') FORMAT Pretty"

echo ""
echo "✅ ClickHouse schema initialized successfully!"

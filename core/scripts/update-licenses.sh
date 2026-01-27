#!/bin/bash

# Script to create README files for adapter categories

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADAPTERS_BASE="$BASE_DIR/capabilities/adapters"

create_category_readme() {
  local category=$1
  local readme_file="$ADAPTERS_BASE/$category/README.md"

  echo "Creating $readme_file..."

  case "$category" in
    database)
      cat > "$readme_file" << 'EOF'
# Database Adapters

Database adapters for PostgreSQL, MongoDB, Redis, ClickHouse, InfluxDB, and more.

## Available Adapters

### postgres
```bash
pnpm add @oxlayer/adapters-postgres
```
PostgreSQL adapter for OxLayer capabilities.

### postgres-tenancy
```bash
pnpm add @oxlayer/adapters-postgres-tenancy
```
PostgreSQL adapter with multi-tenancy support and RLS.

### mongo
```bash
pnpm add @oxlayer/adapters-mongo
```
MongoDB adapter for OxLayer capabilities.

### mongo-tenancy
```bash
pnpm add @oxlayer/adapters-mongo-tenancy
```
MongoDB adapter with multi-tenancy support.

### redis
```bash
pnpm add @oxlayer/adapters-redis
```
Redis adapter for OxLayer capabilities.

### redis-tenancy
```bash
pnpm add @oxlayer/adapters-redis-tenancy
```
Redis adapter with multi-tenancy support.

### clickhouse
```bash
pnpm add @oxlayer/adapters-clickhouse
```
ClickHouse adapter for OxLayer capabilities.

### clickhouse-tenancy
```bash
pnpm add @oxlayer/adapters-clickhouse-tenancy
```
ClickHouse adapter with multi-tenancy support.

### influxdb
```bash
pnpm add @oxlayer/adapters-influxdb
```
InfluxDB adapter for OxLayer capabilities.

### influxdb-tenancy
```bash
pnpm add @oxlayer/adapters-influxdb-tenancy
```
InfluxDB adapter with multi-tenancy support.

## Multi-Tenancy Support

Database adapters with `-tenancy` suffix provide:
- Automatic tenant context injection
- Tenant-isolated connections
- Row-level security (PostgreSQL)
- Collection/database isolation (MongoDB)
- Key prefixing (Redis)

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
EOF
      ;;
    storage)
      cat > "$readme_file" << 'EOF'
# Storage Adapters

Storage adapters for AWS S3, Qdrant, Quickwit, and other storage services.

## Available Adapters

### s3
```bash
pnpm add @oxlayer/adapters-s3
```
AWS S3 storage adapter for OxLayer capabilities.

### s3-tenancy
```bash
pnpm add @oxlayer/adapters-s3-tenancy
```
AWS S3 storage adapter with multi-tenancy support.

### qdrant
```bash
pnpm add @oxlayer/adapters-qdrant
```
Qdrant vector storage adapter for OxLayer capabilities.

### qdrant-tenancy
```bash
pnpm add @oxlayer/adapters-qdrant-tenancy
```
Qdrant vector storage adapter with multi-tenancy support.

### quickwit
```bash
pnpm add @oxlayer/adapters-quickwit
```
Quickwit storage adapter for OxLayer capabilities.

### quickwit-tenancy
```bash
pnpm add @oxlayer/adapters-quickwit-tenancy
```
Quickwit storage adapter with multi-tenancy support.

## Multi-Tenancy Support

Storage adapters with `-tenancy` suffix provide:
- Tenant-isolated buckets/containers
- Path-based tenancy
- Automatic tenant context injection

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
EOF
      ;;
    messaging)
      cat > "$readme_file" << 'EOF'
# Messaging Adapters

Messaging adapters for RabbitMQ, BullMQ, SQS, MQTT, and other messaging systems.

## Available Adapters

### rabbitmq
```bash
pnpm add @oxlayer/adapters-rabbitmq
```
RabbitMQ messaging adapter for OxLayer capabilities.

### rabbitmq-tenancy
```bash
pnpm add @oxlayer/adapters-rabbitmq-tenancy
```
RabbitMQ messaging adapter with multi-tenancy support.

### bullmq
```bash
pnpm add @oxlayer/adapters-bullmq
```
BullMQ queue adapter for OxLayer capabilities.

### bullmq-scheduler
```bash
pnpm add @oxlayer/adapters-bullmq-scheduler
```
BullMQ scheduler adapter - supports job scheduling, delayed jobs, and recurring tasks.

### sqs
```bash
pnpm add @oxlayer/adapters-sqs
```
AWS SQS messaging adapter for OxLayer capabilities.

### sqs-tenancy
```bash
pnpm add @oxlayer/adapters-sqs-tenancy
```
AWS SQS messaging adapter with multi-tenancy support.

### mqtt
```bash
pnpm add @oxlayer/adapters-mqtt
```
MQTT messaging adapter for OxLayer capabilities.

### mqtt-tenancy
```bash
pnpm add @oxlayer/adapters-mqtt-tenancy
```
MQTT messaging adapter with multi-tenancy support.

### eventemitter
```bash
pnpm add @oxlayer/adapters-eventemitter
```
EventEmitter adapter for local event handling within a single process.

## Usage Notes

**BullMQ** is particularly versatile:
- **Queues**: Job processing and task queues
- **Scheduler**: Cron-like job scheduling, delayed jobs, recurring tasks
- **Flows**: Complex job workflows and dependencies

## Multi-Tenancy Support

Messaging adapters with `-tenancy` suffix provide:
- Tenant-isolated queues/topics
- Tenant-scoped event routing
- Automatic tenant context injection

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
EOF
      ;;
    search)
      cat > "$readme_file" << 'EOF'
# Search Adapters

Search adapters for Meilisearch, OpenSearch, and other search engines.

## Available Adapters

Coming soon! We're working on adapters for:
- Meilisearch
- OpenSearch
- Elasticsearch

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
EOF
      ;;
    vector)
      cat > "$readme_file" << 'EOF'
# Vector Adapters

Vector database adapters for semantic search and vector operations.

## Available Adapters

Vector adapters are currently in the storage category.

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
EOF
      ;;
  esac

  echo "✅ Created $category/README.md"
}

# Main execution
echo "📦 Creating adapter category READMEs..."

for category in database storage messaging search vector; do
  if [ -d "$ADAPTERS_BASE/$category" ]; then
    create_category_readme "$category"
  fi
done

echo ""
echo "✅ Done!"

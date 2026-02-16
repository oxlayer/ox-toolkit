# ClickHouse Data Volume

This folder contains persistent data for the ClickHouse service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/clickhouse/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all ClickHouse data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf clickhouse-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf clickhouse-backup-YYYYMMDD.tar.gz
```

## Reset

To reset ClickHouse to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/clickhouse/*

# Restart
ox infra dev
```

# PostgreSQL Data Volume

This folder contains persistent data for the PostgreSQL service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/postgres/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all PostgreSQL data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf postgres-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf postgres-backup-YYYYMMDD.tar.gz
```

## Reset

To reset PostgreSQL to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/postgres/*

# Restart
ox infra dev
```

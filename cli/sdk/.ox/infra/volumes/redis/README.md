# Redis Data Volume

This folder contains persistent data for the Redis service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/redis/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all Redis data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf redis-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf redis-backup-YYYYMMDD.tar.gz
```

## Reset

To reset Redis to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/redis/*

# Restart
ox infra dev
```

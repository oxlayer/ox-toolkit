# MongoDB Data Volume

This folder contains persistent data for the MongoDB service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/mongodb/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all MongoDB data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf mongodb-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf mongodb-backup-YYYYMMDD.tar.gz
```

## Reset

To reset MongoDB to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/mongodb/*

# Restart
ox infra dev
```

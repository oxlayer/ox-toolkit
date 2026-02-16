# EMQX Data Volume

This folder contains persistent data for the EMQX service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/emqx/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all EMQX data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf emqx-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf emqx-backup-YYYYMMDD.tar.gz
```

## Reset

To reset EMQX to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/emqx/*

# Restart
ox infra dev
```

# Prometheus Data Volume

This folder contains persistent data for the Prometheus service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/prometheus/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all Prometheus data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf prometheus-backup-YYYYMMDD.tar.gz
```

## Reset

To reset Prometheus to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/prometheus/*

# Restart
ox infra dev
```

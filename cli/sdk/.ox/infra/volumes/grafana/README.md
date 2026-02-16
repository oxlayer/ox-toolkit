# Grafana Data Volume

This folder contains persistent data for the Grafana service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/grafana/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all Grafana data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf grafana-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf grafana-backup-YYYYMMDD.tar.gz
```

## Reset

To reset Grafana to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/grafana/*

# Restart
ox infra dev
```

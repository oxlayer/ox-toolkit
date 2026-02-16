# InfluxDB Data Volume

This folder contains persistent data for the InfluxDB service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/influxdb/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all InfluxDB data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf influxdb-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf influxdb-backup-YYYYMMDD.tar.gz
```

## Reset

To reset InfluxDB to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/influxdb/*

# Restart
ox infra dev
```

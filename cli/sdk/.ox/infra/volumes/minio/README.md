# MinIO Data Volume

This folder contains persistent data for the MinIO service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/minio/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all MinIO data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf minio-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf minio-backup-YYYYMMDD.tar.gz
```

## Reset

To reset MinIO to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/minio/*

# Restart
ox infra dev
```

# Keycloak PostgreSQL Data Volume

This folder contains persistent data for the Keycloak PostgreSQL service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/keycloak-postgres/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all Keycloak PostgreSQL data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf keycloak-postgres-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf keycloak-postgres-backup-YYYYMMDD.tar.gz
```

## Reset

To reset Keycloak PostgreSQL to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/keycloak-postgres/*

# Restart
ox infra dev
```

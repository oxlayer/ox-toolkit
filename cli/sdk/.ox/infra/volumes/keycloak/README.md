# Keycloak Data Volume

This folder contains persistent data for the Keycloak service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/keycloak/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all Keycloak data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf keycloak-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf keycloak-backup-YYYYMMDD.tar.gz
```

## Reset

To reset Keycloak to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/keycloak/*

# Restart
ox infra dev
```

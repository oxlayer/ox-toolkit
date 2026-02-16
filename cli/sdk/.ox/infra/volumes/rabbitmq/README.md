# RabbitMQ Data Volume

This folder contains persistent data for the RabbitMQ service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: `.ox/infra/volumes/rabbitmq/`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all RabbitMQ data!**

## Backup

To backup this data:
```bash
# Create a backup
tar -czf rabbitmq-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf rabbitmq-backup-YYYYMMDD.tar.gz
```

## Reset

To reset RabbitMQ to a clean state:
```bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/rabbitmq/*

# Restart
ox infra dev
```

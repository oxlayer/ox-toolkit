# Project Volumes

Place project-specific data volumes here.

## Usage

Each service can have project-specific persistent data.

## Structure

```
volumes/
├── postgres/          # PostgreSQL data
├── redis/             # Redis data
├── rabbitmq/          # RabbitMQ data
├── keycloak/          # Keycloak data
├── influxdb/          # InfluxDB data
├── grafana/           # Grafana data
├── prometheus/        # Prometheus data
├── clickhouse/        # ClickHouse data
└── minio/             # MinIO data
```

These volumes will be automatically mounted when services start.

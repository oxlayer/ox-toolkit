# OxLayer Infrastructure Management CLI

Complete infrastructure management system for OxLayer microservices using Docker Compose.

## Features

- 🚀 **Multi-Environment Support**: Development, Staging, and Production configurations
- 🎯 **Service Selection**: Interactive CLI to choose which services to run
- 🔧 **Project-Specific Configurations**: Custom configs per project in `.ox/infra/`
- 📦 **Volume Management**: Project-specific data volumes isolated per project
- 🔐 **Environment Isolation**: Different configs for dev/stg/prd environments
- 📊 **Service Status**: Real-time service health monitoring
- 📝 **Log Management**: View and follow service logs

## Installation

The infrastructure commands are included in the OxLayer CLI:

```bash
npm install -g @oxlayer/cli
```

## Quick Start

### 1. Initialize Project Infrastructure

```bash
ox infra init
```

This creates a `.ox/infra/` folder in your project with:

```
.ox/infra/
├── collectors/           # Custom OpenTelemetry collector configs
├── nginx/               # Custom nginx configurations
├── grafana/
│   └── provisioning/    # Grafana dashboards & datasources
├── prometheus/          # Prometheus configuration
└── volumes/             # Project-specific data volumes
```

### 2. Start Development Environment

```bash
ox infra dev
```

You'll be prompted to select which services to start.

### 3. Check Status

```bash
ox infra status
```

## Commands

### Environment Commands

#### `ox infra dev`
Start the development environment with interactive service selection.

```bash
ox infra dev
```

#### `ox infra stg`
Start the staging environment.

```bash
ox infra stg
```

#### `ox infra prd`
Start the production environment.

```bash
ox infra prd
```

### Control Commands

#### `ox infra start [environment]`
Start infrastructure (defaults to dev).

```bash
ox infra start          # Start dev environment
ox infra start stg      # Start staging environment
```

#### `ox infra stop [environment]`
Stop running services.

```bash
ox infra stop           # Stop all services
```

#### `ox infra restart [environment]`
Restart services.

```bash
ox infra restart        # Restart all running services
```

### Status & Information

#### `ox infra status [environment]`
Show service status and health.

```bash
ox infra status
```

Output:
```
DATABASE
  ● PostgreSQL (running)
    Ports: 5432
    Health: healthy

  ● MongoDB (running)
    Ports: 27017
    Health: healthy

Total: 2 services
```

#### `ox infra list`
List all available services with descriptions.

```bash
ox infra list
```

#### `ox infra project`
Show project infrastructure status.

```bash
ox infra project
```

### Logs

#### `ox infra logs <service>`
Show logs for a specific service.

```bash
ox infra logs postgres
ox infra logs keycloak -f    # Follow logs
```

### Project Management

#### `ox infra init`
Initialize project infrastructure folder.

```bash
ox infra init
```

## Available Services

### Core Services (Enabled by Default)

- **PostgreSQL** - Primary database (port 5432)
- **Redis** - Cache and session store (port 6379)
- **RabbitMQ** - Message queue (ports 5672, 15672)
- **Keycloak** - Identity and access management (port 8080)

### Optional Services

#### Monitoring & Observability
- **Grafana** - Metrics dashboard (port 3000)
- **Prometheus** - Metrics collection (port 9090)
- **Jaeger** - Distributed tracing (port 16686)
- **OTel Collector (Observability)** - Logs and traces (ports 14317, 14318)

#### Analytics
- **ClickHouse** - Analytical database (ports 8123, 9000)
- **InfluxDB** - Time-series database (port 8086)
- **OTel Collector (Domain)** - Domain events (ports 24317, 24318)

#### Storage & Search
- **MinIO** - S3-compatible storage (ports 9000, 9001)
- **Qdrant** - Vector search (ports 6333, 6334)
- **Quickwit** - Log search (ports 7280, 7281)

#### Additional
- **MongoDB** - NoSQL database (port 27017)
- **EMQX** - MQTT broker (ports 1883, 8883, 8083, 8084, 18083)

## Project-Specific Configurations

### Custom Collectors

Create custom OpenTelemetry collector configurations:

```bash
# Create collector config
cat > .ox/infra/collectors/my-collector.yaml <<EOF
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:

exporters:
  otlp:
    endpoint: http://quickwit:7281
EOF

# Restart infrastructure
ox infra restart
```

### Custom Nginx

Add custom nginx configurations for Keycloak proxy:

```bash
cat > .ox/infra/nginx/custom.conf <<EOF
server {
    listen 8082;
    server_name localhost;

    location /custom {
        proxy_pass http://keycloak:8080;
    }
}
EOF
```

### Grafana Dashboards

Add custom Grafana dashboards:

```bash
mkdir -p .ox/infra/grafana/provisioning/dashboards
cp my-dashboard.json .ox/infra/grafana/provisioning/dashboards/
```

### Prometheus Rules

Add custom Prometheus alerting rules:

```bash
cat > .ox/infra/prometheus/alerts.yml <<EOF
groups:
  - name: custom_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(errors[5m]) > 0.05
EOF
```

### Project Volumes

Project-specific data volumes are automatically created in `.ox/infra/volumes/`:

```
.ox/infra/volumes/
├── postgres/          # PostgreSQL data
├── redis/             # Redis data
├── rabbitmq/          # RabbitMQ data
└── keycloak/          # Keycloak data
```

## Environment Configuration

### Development (dev)

Default credentials and relaxed security:
- Default passwords
- HTTP enabled
- Local ports exposed

### Staging (stg)

Production-like configuration:
- Secure credentials
- HTTPS enabled
- Limited port exposure

### Production (prd)

Production-hardened configuration:
- Strong passwords from environment
- HTTPS only
- Minimal port exposure
- Security headers enabled

## Multi-Project Support

Each project can have its own infrastructure configuration:

```bash
# Project A
cd ~/projects/project-a
ox infra dev

# Project B
cd ~/projects/project-b
ox infra dev
```

Each project maintains:
- Separate data volumes
- Custom configurations
- Isolated service instances

## Examples

### Start All Core Services

```bash
ox infra dev
# Select: postgres, redis, rabbitmq, keycloak
```

### Start with Monitoring

```bash
ox infra dev
# Select: postgres, redis, rabbitmq, keycloak, grafana, prometheus
```

### Start All Services

```bash
ox infra dev
# Select all services
```

### View Service Logs

```bash
ox infra logs postgres
ox infra logs keycloak -f    # Follow mode
```

### Stop Specific Services

```bash
ox infra stop
# Select: grafana, prometheus
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
ox infra status

# View logs
ox infra logs <service-name>

# Check Docker
docker ps
docker-compose ps
```

### Port Conflicts

If ports are already in use:

```bash
# Check what's using the port
lsof -i :5432

# Stop conflicting service
ox infra stop
```

### Clean Restart

```bash
# Stop all services
ox infra stop

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Start fresh
ox infra dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│         OxLayer CLI                     │
│  ┌───────────────────────────────────┐ │
│  │      ox infra commands           │ │
│  └───────────────────────────────────┘ │
│                 │                      │
│                 ▼                      │
│  ┌───────────────────────────────────┐ │
│  │   InfraService                    │ │
│  │   - Service definitions           │ │
│  │   - Environment configs           │ │
│  └───────────────────────────────────┘ │
│                 │                      │
│                 ▼                      │
│  ┌───────────────────────────────────┐ │
│  │   InfraConfigService              │ │
│  │   - Project-specific configs      │ │
│  │   - Volume management             │ │
│  └───────────────────────────────────┘ │
│                 │                      │
└─────────────────┼──────────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ Docker Compose  │
        │  + Services     │
        └─────────────────┘
```

## Contributing

To add new services:

1. Add service definition to `src/services/infra.service.ts`
2. Configure ports, volumes, and dependencies
3. Update documentation

## License

MIT

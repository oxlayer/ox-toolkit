# Project Infrastructure Configuration

This folder contains project-specific overrides for OxLayer infrastructure.

## Directory Structure

- `collectors/` - Custom OpenTelemetry collector configurations
- `nginx/` - Custom nginx configuration files
- `grafana/provisioning/` - Grafana provisioning dashboards and datasources
- `prometheus/` - Custom Prometheus configuration
- `volumes/` - Project-specific volume mounts

## Usage

Files in these directories will be automatically mounted to the corresponding services when you run:
- `ox infra dev`
- `ox infra stg`
- `ox infra prd`

## Example

To add a custom collector configuration:
1. Create a file in `collectors/my-collector.yaml`
2. Restart infrastructure: `ox infra restart`
3. The configuration will be automatically mounted


# Messaging Adapters

Messaging adapters for RabbitMQ, BullMQ, SQS, MQTT, and other messaging systems.

## Available Adapters (Open Source)

### rabbitmq
```bash
pnpm add @oxlayer/capabilities-adapters-rabbitmq
```
RabbitMQ messaging adapter for OxLayer capabilities.

### bullmq
```bash
pnpm add @oxlayer/capabilities-adapters-bullmq
```
BullMQ queue adapter for job processing and task queues.

### sqs
```bash
pnpm add @oxlayer/capabilities-adapters-sqs
```
AWS SQS messaging adapter for OxLayer capabilities.

### mqtt
```bash
pnpm add @oxlayer/capabilities-adapters-mqtt
```
MQTT messaging adapter for OxLayer capabilities.

### eventemitter
```bash
pnpm add @oxlayer/capabilities-adapters-eventemitter
```
EventEmitter adapter for local event handling within a single process.

### bullmq-scheduler
```bash
pnpm add @oxlayer/pro-adapters-bullmq-scheduler
```
BullMQ scheduler adapter - supports job scheduling, delayed jobs, and recurring tasks.

## Multi-Tenancy Support (Proprietary)

Multi-tenancy variants with tenant-isolated queues and topics are available in the proprietary package:

```bash
# RabbitMQ with tenant-isolated queues
pnpm add @oxlayer/pro-adapters-rabbitmq-tenancy

# SQS with tenant-isolated queues
pnpm add @oxlayer/pro-adapters-sqs-tenancy

# MQTT with tenant-isolated topics
pnpm add @oxlayer/pro-adapters-mqtt-tenancy
```

> **Note**: Tenancy adapters are part of the proprietary package. See [proprietary/README.md](../../../../proprietary/README.md) for details.

## Usage Notes

**BullMQ** is particularly versatile:
- **Queues**: Job processing and task queues
- **Scheduler**: Cron-like job scheduling, delayed jobs, recurring tasks
- **Flows**: Complex job workflows and dependencies

The BullMQ Scheduler is available in the proprietary package for advanced scheduling features.

## Features

### Open Source Adapters
- Message publishing/subscribing
- Queue management
- Connection pooling
- Dead letter queues

### Proprietary Tenancy Adapters
- Tenant-isolated queues/topics
- Tenant-scoped event routing
- Automatic tenant context injection
- Tenant-specific credentials

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.

Tenancy adapters and BullMQ Scheduler are licensed under proprietary license - see [proprietary/README.md](../../../../proprietary/README.md).

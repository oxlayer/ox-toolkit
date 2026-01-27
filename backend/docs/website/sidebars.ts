import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  adaptersSidebar: [
    'adapters/intro',
    {
      type: 'category',
      label: 'Database Adapters',
      collapsible: true,
      collapsed: false,
      items: [
        'adapters/postgres',
        'adapters/mongo',
        'adapters/clickhouse',
        'adapters/influxdb',
      ],
    },
    {
      type: 'category',
      label: 'Storage Adapters',
      collapsible: true,
      collapsed: false,
      items: [
        'adapters/s3',
        'adapters/qdrant',
        'adapters/quickwit',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsible: true,
      collapsed: false,
      items: [
        'adapters/bitwarden-secrets',
      ],
    },
  ],

  tenancySidebar: [
    'tenancy/intro',
    {
      type: 'category',
      label: 'Database Tenancy',
      collapsible: true,
      collapsed: false,
      items: [
        'tenancy/postgres-tenancy',
        'tenancy/mongo-tenancy',
        'tenancy/clickhouse-tenancy',
        'tenancy/influxdb-tenancy',
      ],
    },
    {
      type: 'category',
      label: 'Cache Tenancy',
      collapsible: true,
      collapsed: false,
      items: [
        'tenancy/redis-tenancy',
      ],
    },
    {
      type: 'category',
      label: 'Storage Tenancy',
      collapsible: true,
      collapsed: false,
      items: [
        'tenancy/s3-tenancy',
        'tenancy/qdrant-tenancy',
        'tenancy/quickwit-tenancy',
      ],
    },
    {
      type: 'category',
      label: 'Messaging Tenancy',
      collapsible: true,
      collapsed: false,
      items: [
        'tenancy/rabbitmq-tenancy',
        'tenancy/sqs-tenancy',
        'tenancy/mqtt-tenancy',
      ],
    },
  ],

  eventBusSidebar: [
    'event-bus/intro',
    {
      type: 'category',
      label: 'Event Bus Implementations',
      collapsible: true,
      collapsed: false,
      items: [
        'event-bus/eventemitter',
        'event-bus/bullmq',
        'event-bus/rabbitmq',
        'event-bus/sqs',
        'event-bus/mqtt',
      ],
    },
    {
      type: 'category',
      label: 'Scheduling',
      collapsible: true,
      collapsed: false,
      items: [
        'event-bus/bullmq-scheduler',
      ],
    },
  ],
};

export default sidebars;

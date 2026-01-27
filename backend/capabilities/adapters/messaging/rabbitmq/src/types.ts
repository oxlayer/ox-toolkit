export interface RabbitMQConnectionConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
  /**
   * Heartbeat interval in seconds.
   * Default is 60s to match RabbitMQ server default.
   * Set to 0 to disable (not recommended).
   */
  heartbeat?: number;
  /**
   * Connection timeout in milliseconds.
   * Default: 15000 (15 seconds)
   */
  timeout?: number;
}

export interface RabbitMQExchangeConfig {
  name: string;
  type: 'topic' | 'direct' | 'fanout' | 'headers';
  options?: {
    durable?: boolean;
    autoDelete?: boolean;
    internal?: boolean;
  };
}

export interface RabbitMQQueueConfig {
  name: string;
  routingKey: string;
  options?: {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
  };
}

export interface RabbitMQMiddlewareOptions {
  connection: RabbitMQConnectionConfig;
  exchanges: Record<string, RabbitMQExchangeConfig>;
  queues: Record<string, RabbitMQQueueConfig>;
}

export interface RabbitMQContext {
  connection: any;
  channel: any;
  publish: (routingKey: string, message: any) => Promise<void>;
}

import type {
  RabbitMQConnectionConfig,
  RabbitMQExchangeConfig,
  RabbitMQQueueConfig,
  RabbitMQContext,
} from './types.ts';

export class RabbitMQClient implements RabbitMQContext {
  connection: any = null;
  channel: any = null;
  private exchanges: Record<string, RabbitMQExchangeConfig>;
  private queues: Record<string, RabbitMQQueueConfig>;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private shutdown = false;

  constructor(
    private connectionConfig: RabbitMQConnectionConfig,
    exchanges: Record<string, RabbitMQExchangeConfig>,
    queues: Record<string, RabbitMQQueueConfig>
  ) {
    this.exchanges = exchanges;
    this.queues = queues;
  }

  async connect(): Promise<void> {
    // Prevent concurrent connection attempts
    if (this.isConnecting) {
      return;
    }
    if (this.shutdown) {
      return;
    }

    this.isConnecting = true;

    try {
      const amqp = await import('amqplib');

      // Safe heartbeat default for WSL2/Docker environments
      const heartbeat =
        typeof this.connectionConfig.heartbeat === 'number'
          ? this.connectionConfig.heartbeat
          : 10; // SAFE default for WSL2/Docker

      if (heartbeat < 1) {
        throw new Error(`Heartbeat must be at least 1 second or omitted. Got: ${heartbeat}. To disable heartbeats, configure RabbitMQ server heartbeat to 0 as well.`);
      }

      const connectionOptions: any = {
        hostname: this.connectionConfig.hostname,
        port: this.connectionConfig.port,
        username: this.connectionConfig.username,
        password: this.connectionConfig.password,
        vhost: this.connectionConfig.vhost,
        heartbeat,
        // Enable TCP no-delay to disable Nagle's algorithm
        noDelay: true,
      };

      // Set connection timeout if specified
      if (this.connectionConfig.timeout) {
        connectionOptions.timeout = this.connectionConfig.timeout;
      }

      this.connection = await amqp.connect(connectionOptions);

      // 🔥 CRITICAL FIX: Enable TCP keepalive to prevent idle stalls
      const stream = this.connection.connection?.stream;
      if (stream?.setKeepAlive) {
        stream.setKeepAlive(true, 5000); // Send keepalive every 5s
      }

      console.log(`✅ RabbitMQ connection established (heartbeat: ${heartbeat}s)`);

      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ channel created');

      // Assert exchanges
      for (const [_key, exchange] of Object.entries(this.exchanges)) {
        const exchangeOptions: Record<string, boolean> = {
          durable: exchange.options?.durable ?? true,
          autoDelete: exchange.options?.autoDelete ?? false,
          internal: exchange.options?.internal ?? false,
        };
        await this.channel.assertExchange(
          exchange.name,
          exchange.type,
          exchangeOptions
        );
        console.log(`✅ RabbitMQ exchange '${exchange.name}' asserted`);
      }

      // Assert queues and bind them to exchanges
      for (const [key, queue] of Object.entries(this.queues)) {
        const queueOptions: Record<string, boolean> = {
          durable: queue.options?.durable ?? true,
          exclusive: queue.options?.exclusive ?? false,
          autoDelete: queue.options?.autoDelete ?? false,
        };
        await this.channel.assertQueue(queue.name, queueOptions);
        console.log(`✅ RabbitMQ queue '${queue.name}' asserted`);

        // Find the exchange that should be used for this queue
        const exchangeKey = Object.keys(this.exchanges).find(
          (k) => k === 'events' || k === key.replace('Events', '')
        ) || Object.keys(this.exchanges)[0];

        if (exchangeKey && this.exchanges[exchangeKey]) {
          const exchange = this.exchanges[exchangeKey];
          await this.channel.bindQueue(
            queue.name,
            exchange.name,
            queue.routingKey
          );
          console.log(
            `✅ RabbitMQ queue '${queue.name}' bound to exchange '${exchange.name}' with routing key '${queue.routingKey}'`
          );
        }
      }

      // Handle connection errors
      this.connection.on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
        this.channel = null;
        this.connection = null;

        // Schedule reconnection if not shutting down
        if (!this.shutdown) {
          this.scheduleReconnect();
        }
      });

      this.isConnected = true;
      this.isConnecting = false;
    } catch (error: any) {
      this.isConnecting = false;
      console.error('❌ Failed to initialize RabbitMQ:', error);
      console.warn('⚠️ Continuing without RabbitMQ - the service will start but RabbitMQ features will be unavailable');

      // Schedule reconnection if not shutting down
      if (!this.shutdown) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect() {
    if (this.reconnectTimer || this.shutdown) {
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;

    console.warn(`🔁 Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        this.reconnectAttempts = 0;
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Publish a message to RabbitMQ with automatic reconnection
   */
  async publish(routingKey: string, message: any): Promise<void> {
    // Try to connect if not connected
    if (!this.isConnected || !this.channel) {
      if (this.isConnecting) {
        // Wait for ongoing connection attempt
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Attempt connection
      await this.connect();

      // If still not connected after reconnection attempt, drop the message
      if (!this.isConnected || !this.channel) {
        console.warn(`⚠️ RabbitMQ not available - message to '${routingKey}' was not published`);
        return;
      }
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    // Use the first exchange or 'events' exchange
    const exchangeKey = Object.keys(this.exchanges).find((k) => k === 'events') ||
      Object.keys(this.exchanges)[0];

    if (!exchangeKey || !this.exchanges[exchangeKey]) {
      console.warn(`⚠️ No exchange available for publishing to '${routingKey}'`);
      return;
    }

    const exchange = this.exchanges[exchangeKey];
    const published = this.channel.publish(
      exchange.name,
      routingKey,
      messageBuffer,
      {
        persistent: true,
        timestamp: Date.now(),
      }
    );

    // AMQP backpressure is not fatal - just log a warning
    if (!published) {
      console.warn(
        `⚠️ RabbitMQ backpressure — message to '${routingKey}' not sent (buffer full)`
      );
    } else {
      console.log(`📤 Published message to routing key '${routingKey}'`);
    }
  }

  async close(): Promise<void> {
    // Signal shutdown to prevent reconnection attempts
    this.shutdown = true;

    // Clear any pending reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      try {
        await this.channel.close();
      } catch {
        // Ignore errors during shutdown
      }
      this.channel = null;
    }
    if (this.connection) {
      try {
        await this.connection.close();
      } catch {
        // Ignore errors during shutdown
      }
      this.connection = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    console.log('🔌 RabbitMQ connection closed');
  }
}

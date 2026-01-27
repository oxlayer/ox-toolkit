import mqtt from 'mqtt';
import type {
  MQTTConnectionConfig,
  MQTTContext,
  MQTTPublishOptions,
  MQTTSubscribeOptions,
} from './types.js';

/**
 * MQTT client wrapper
 *
 * Compatible with:
 * - Mosquitto
 * - HiveMQ
 * - EMQX
 * - RabbitMQ (MQTT plugin)
 * - Apache ActiveMQ (Artemis)
 * - VerneMQ
 */
export class MQTTClient implements MQTTContext {
  client: mqtt.MqttClient | null = null;
  private config: MQTTConnectionConfig;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: MQTTConnectionConfig) {
    this.config = config;
  }

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const clientId = this.config.clientId || `mqtt_${Math.random().toString(16).substr(2, 8)}`;

      const clientOptions: mqtt.IClientOptions = {
        clientId,
        username: this.config.username,
        password: this.config.password,
        connectTimeout: this.config.connectTimeout || 30000,
        keepalive: this.config.keepalive || 60,
        clean: this.config.clean !== false,
        rejectUnauthorized: this.config.rejectUnauthorized !== false,
        ...(this.config.ca && { ca: this.config.ca as any }),
        ...(this.config.cert && { cert: this.config.cert as any }),
        ...(this.config.key && { key: this.config.key as any }),
        ...(this.config.will && { will: this.config.will as any }),
        ...this.config.additionalOptions,
      };

      this.client = mqtt.connect(this.config.url, clientOptions);

      this.client.on('connect', () => {
        console.log(`✅ MQTT connected to ${this.config.url}`);
        this._isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('❌ MQTT connection error:', err.message);
        reject(err);
      });

      this.client.on('close', () => {
        if (this._isConnected) {
          console.warn('⚠️ MQTT connection closed');
          this._isConnected = false;
        }
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          console.log(`🔄 MQTT reconnecting... (attempt ${this.reconnectAttempts})`);
        } else {
          console.error('❌ MQTT max reconnection attempts reached');
          this.client?.end(true);
        }
      });

      this.client.on('offline', () => {
        console.warn('⚠️ MQTT client offline');
        this._isConnected = false;
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  async publish(
    topic: string,
    message: any,
    options: MQTTPublishOptions = {}
  ): Promise<void> {
    if (!this._isConnected || !this.client) {
      throw new Error('MQTT client not connected');
    }

    const payload = JSON.stringify(message);

    return new Promise((resolve, reject) => {
      this.client!.publish(
        topic,
        payload,
        {
          qos: options.qos || 0,
          retain: options.retain || false,
          dup: options.dup,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`📤 Published to topic '${topic}'`);
            resolve();
          }
        }
      );
    });
  }

  /**
   * Subscribe to a topic
   */
  async subscribe(
    topic: string,
    callback: (topic: string, message: any) => void | Promise<void>,
    options: MQTTSubscribeOptions = {}
  ): Promise<void> {
    if (!this._isConnected || !this.client) {
      throw new Error('MQTT client not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.subscribe(
        topic,
        {
          qos: options.qos || 0,
          nl: options.nl,
          rap: options.rap,
          rh: options.rh,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`🔔 Subscribed to topic '${topic}'`);
            resolve();
          }
        }
      );
    });

    // Set up message handler
    this.client?.on('message', async (receivedTopic: string, payload: Buffer) => {
      if (this.topicMatches(receivedTopic, topic)) {
        try {
          const message = JSON.parse(payload.toString());
          await callback(receivedTopic, message);
        } catch (error) {
          console.error(`❌ Error parsing MQTT message from '${receivedTopic}':`, error);
        }
      }
    });
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribe(topic: string): Promise<void> {
    if (!this._isConnected || !this.client) {
      throw new Error('MQTT client not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🔕 Unsubscribed from topic '${topic}'`);
          resolve();
        }
      });
    });
  }

  /**
   * Check if connected
   */
  isConnectedToBroker(): boolean {
    return this._isConnected && this.client?.connected === true;
  }

  /**
   * Alias for compatibility
   */
  isConnected(): boolean {
    return this.isConnectedToBroker();
  }

  /**
   * End connection
   */
  async end(force = false): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(force, () => {
          this._isConnected = false;
          console.log('🔌 MQTT connection closed');
          resolve();
        });
      });
    }
  }

  /**
   * Match received topic to subscribed topic (supports wildcards)
   */
  private topicMatches(receivedTopic: string, subscribedTopic: string): boolean {
    // Convert MQTT wildcard patterns to regex
    // + matches single level, # matches multi-level
    const pattern = subscribedTopic
      .replace(/\+/g, '[^/]+')
      .replace(/#/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(receivedTopic);
  }
}

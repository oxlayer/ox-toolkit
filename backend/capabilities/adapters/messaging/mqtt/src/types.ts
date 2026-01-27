import type { IClientOptions } from 'mqtt';

/**
 * MQTT connection configuration
 * Compatible with Mosquitto, HiveMQ, EMQX, RabbitMQ, ActiveMQ, VerneMQ
 */
export interface MQTTConnectionConfig {
  /**
   * MQTT broker URL
   * Examples:
   * - mqtt://localhost:1883
   * - mqtts://localhost:8883 (secure)
   * - ws://localhost:8083 (WebSocket)
   * - wss://localhost:8084 (secure WebSocket)
   */
  url: string;

  /**
   * Client identifier
   * @default 'mqtt_' + random string
   */
  clientId?: string;

  /**
   * Username for authentication
   */
  username?: string;

  /**
   * Password for authentication
   */
  password?: string;

  /**
   * Connect timeout in milliseconds
   * @default 30000
   */
  connectTimeout?: number;

  /**
   * Keepalive interval in seconds
   * @default 60
   */
  keepalive?: number;

  /**
   * Clean session
   * @default true
   */
  clean?: boolean;

  /**
   * Minimum MQTT version (3, 4, or 5)
   * @default 4
   */
  protocolVersion?: 3 | 4 | 5;

  /**
   * Reject unauthorized certificates (for mqtts://)
   * @default true
   */
  rejectUnauthorized?: boolean;

  /**
   * CA certificate (for mqtts://)
   */
  ca?: string | Buffer | Array<string | Buffer>;

  /**
   * Client certificate (for mqtts://)
   */
  cert?: string | Buffer | Array<string | Buffer>;

  /**
   * Client key (for mqtts://)
   */
  key?: string | Buffer | Array<string | Buffer>;

  /**
   * Last will message
   */
  will?: {
    topic: string;
    payload: string;
    qos?: 0 | 1 | 2;
    retain?: boolean;
  };

  /**
   * Additional MQTT client options
   */
  additionalOptions?: Partial<IClientOptions>;
}

/**
 * MQTT QoS levels
 */
export type MQTTQoS = 0 | 1 | 2;

/**
 * MQTT publish options
 */
export interface MQTTPublishOptions {
  /**
   * Quality of Service
   * 0: at most once (fire and forget)
   * 1: at least once (acknowledged delivery)
   * 2: exactly once (assured delivery)
   * @default 0
   */
  qos?: MQTTQoS;

  /**
   * Retain flag
   * When true, the broker keeps the last message on the topic
   * @default false
   */
  retain?: boolean;

  /**
   * Duplicate flag
   * Set by the client when retrying a publish
   */
  dup?: boolean;
}

/**
 * MQTT subscribe options
 */
export interface MQTTSubscribeOptions {
  /**
   * Quality of Service
   * @default 0
   */
  qos?: MQTTQoS;

  /**
   * No local flag (MQTT 5.0)
   * When true, the broker doesn't send messages from the client back to itself
   */
  nl?: boolean;

  /**
   * Retain as published (MQTT 5.0)
   * When true, the retain flag is preserved
   */
  rap?: boolean;

  /**
   * Retain handling (MQTT 5.0)
   * 0: send retained messages at subscribe
   * 1: send retained messages only if new subscription
   * 2: don't send retained messages
   */
  rh?: number;
}

/**
 * MQTT context interface
 */
export interface MQTTContext {
  client: any;
  isConnected(): boolean;
}

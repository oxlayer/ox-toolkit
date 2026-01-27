import type { SQSClientConfig } from '@aws-sdk/client-sqs';

/**
 * SQS connection configuration
 */
export interface SQSConnectionConfig {
  /**
   * AWS region
   */
  region: string;

  /**
   * AWS access key ID
   * @default process.env.AWS_ACCESS_KEY_ID
   */
  accessKeyId?: string;

  /**
   * AWS secret access key
   * @default process.env.AWS_SECRET_ACCESS_KEY
   */
  secretAccessKey?: string;

  /**
   * AWS session token (for temporary credentials)
   */
  sessionToken?: string;

  /**
   * Account ID (for constructing queue URLs)
   */
  accountId?: string;

  /**
   * Custom endpoint URL (for localstack/testing)
   */
  endpoint?: string;
}

/**
 * SQS queue configuration
 */
export interface SQSQueueConfig {
  /**
   * Queue name (without account ID and region prefix)
   */
  name: string;

  /**
   * Whether the queue should use FIFO ordering
   */
  fifo?: boolean;

  /**
   * Message retention period in seconds
   * @default 345600 (4 days)
   */
  retentionPeriod?: number;

  /**
   * Visibility timeout in seconds
   * @default 30
   */
  visibilityTimeout?: number;

  /**
   * Delivery delay in seconds
   */
  deliveryDelay?: number;

  /**
   * Maximum message size in bytes
   * @default 262144 (256 KB)
   */
  maxMessageSize?: number;

  /**
   * Receive message wait time in seconds (long polling)
   * @default 0
   */
  waitTimeSeconds?: number;

  /**
   * Maximum receive count before dead letter queue
   */
  maxReceiveCount?: number;

  /**
   * Dead letter queue ARN
   */
  deadLetterQueueArn?: string;
}

/**
 * SQS publish options
 */
export interface SQSPublishOptions {
  /**
   * Message group ID (required for FIFO queues)
   */
  messageGroupId?: string;

  /**
   * Message deduplication ID (required for FIFO queues)
   */
  messageDeduplicationId?: string;

  /**
   * Delivery delay in seconds
   */
  delaySeconds?: number;

  /**
   * Message attributes
   */
  messageAttributes?: Record<string, string>;
}

/**
 * SQS context interface
 */
export interface SQSContext {
  client: any;
  getQueueUrl(queueName: string): string;
}

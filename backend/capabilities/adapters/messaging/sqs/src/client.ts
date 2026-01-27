import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, type SQSClientConfig } from '@aws-sdk/client-sqs';
import type {
  SQSConnectionConfig,
  SQSQueueConfig,
  SQSContext,
  SQSPublishOptions,
} from './types.js';

/**
 * SQS client for event publishing and consumption
 */
export class SQSClientAdapter implements SQSContext {
  client: SQSClient;
  private config: SQSConnectionConfig;
  private queues = new Map<string, string>();
  private isConnected = false;

  constructor(config: SQSConnectionConfig) {
    this.config = config;

    const clientConfig: SQSClientConfig = {
      region: config.region,
    };

    if (config.accessKeyId || config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: config.sessionToken || process.env.AWS_SESSION_TOKEN,
      };
    }

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    this.client = new SQSClient(clientConfig);
  }

  /**
   * Initialize SQS client and resolve queue URLs
   */
  async connect(queues: Record<string, SQSQueueConfig> = {}): Promise<void> {
    try {
      // Resolve queue URLs
      for (const [key, queueConfig] of Object.entries(queues)) {
        const queueUrl = await this.resolveQueueUrl(queueConfig);
        this.queues.set(key, queueUrl);
        console.log(`✅ SQS queue '${queueConfig.name}' resolved: ${queueUrl}`);
      }

      this.isConnected = true;
      console.log('✅ SQS connection established');
    } catch (error: any) {
      console.error('❌ Failed to initialize SQS:', error);
      console.warn('⚠️ Continuing without SQS - the service will start but SQS features will be unavailable');
    }
  }

  /**
   * Publish a message to a queue
   */
  async publish(
    queueKey: string,
    message: any,
    options: SQSPublishOptions = {}
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn(`⚠️ SQS not available - message to '${queueKey}' was not published`);
      return;
    }

    const queueUrl = this.queues.get(queueKey);
    if (!queueUrl) {
      throw new Error(`Queue '${queueKey}' not found`);
    }

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: options.messageGroupId,
      MessageDeduplicationId: options.messageDeduplicationId,
      DelaySeconds: options.delaySeconds,
      MessageAttributes: options.messageAttributes
        ? Object.entries(options.messageAttributes).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: {
                DataType: 'String',
                StringValue: value,
              },
            }),
            {}
          )
        : undefined,
    });

    await this.client.send(command);
    console.log(`📤 Published message to queue '${queueKey}'`);
  }

  /**
   * Receive messages from a queue
   */
  async receive(
    queueKey: string,
    options: {
      maxMessages?: number;
      waitTimeSeconds?: number;
      visibilityTimeout?: number;
    } = {}
  ): Promise<any[] | null> {
    if (!this.isConnected) {
      return null;
    }

    const queueUrl = this.queues.get(queueKey);
    if (!queueUrl) {
      throw new Error(`Queue '${queueKey}' not found`);
    }

    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: options.maxMessages || 1,
      WaitTimeSeconds: options.waitTimeSeconds || 0,
      VisibilityTimeout: options.visibilityTimeout || 30,
      AttributeNames: ['All'],
    });

    const response = await this.client.send(command);

    if (!response.Messages || response.Messages.length === 0) {
      return null;
    }

    return response.Messages.map((msg: any) => ({
      ...msg,
      Body: JSON.parse(msg.Body),
    }));
  }

  /**
   * Delete a message from a queue
   */
  async deleteMessage(queueKey: string, receiptHandle: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    const queueUrl = this.queues.get(queueKey);
    if (!queueUrl) {
      throw new Error(`Queue '${queueKey}' not found`);
    }

    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.client.send(command);
  }

  /**
   * Get queue URL
   */
  getQueueUrl(queueKey: string): string {
    const url = this.queues.get(queueKey);
    if (!url) {
      throw new Error(`Queue '${queueKey}' not found`);
    }
    return url;
  }

  /**
   * Close the SQS client
   */
  async close(): Promise<void> {
    await this.client.destroy();
    this.isConnected = false;
    console.log('🔌 SQS connection closed');
  }

  /**
   * Resolve queue URL from queue config
   */
  private async resolveQueueUrl(config: SQSQueueConfig): Promise<string> {
    // If custom endpoint is set (e.g., LocalStack), construct URL differently
    if (this.config.endpoint) {
      return `${this.config.endpoint}/queue/${config.name}`;
    }

    // Standard AWS SQS URL format
    const accountId = this.config.accountId || process.env.AWS_ACCOUNT_ID || '';
    const region = this.config.region;
    return `https://sqs.${region}.amazonaws.com/${accountId}/${config.name}`;
  }
}

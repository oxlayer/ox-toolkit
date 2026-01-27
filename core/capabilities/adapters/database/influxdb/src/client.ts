import { InfluxDB, Point, type WriteApi } from '@influxdata/influxdb-client';
import type { MetricsConfig, MetricPoint, PerformanceMetrics, TimerResult } from './types.js';

export class MetricsClient {
  private client: InfluxDB;
  private writeApi: WriteApi;
  private bucket: string;

  constructor(config: MetricsConfig = {}) {
    const url = config.url || process.env.INFLUXDB_URL || 'http://localhost:8086';
    const token = config.token || process.env.INFLUXDB_TOKEN || 'influx_admin_token';
    const org = config.org || process.env.INFLUXDB_ORG || 'fator-h';
    const bucket = config.bucket || process.env.INFLUXDB_BUCKET || 'metrics';

    this.bucket = bucket;
    this.client = new InfluxDB({ url, token });
    this.writeApi = this.client.getWriteApi(org, bucket);

    // Set default tags
    this.writeApi.useDefaultTags({
      service: process.env.SERVICE_NAME || 'fator-h',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.SERVICE_VERSION || '1.0.0'
    });

    console.log(`📊 Metrics client initialized - ${url}/${org}/${bucket}`);
  }

  writePoint(point: MetricPoint): void {
    try {
      const influxPoint = new Point(point.measurement);

      // Add tags
      if (point.tags) {
        Object.entries(point.tags).forEach(([key, value]) => {
          influxPoint.tag(key, value);
        });
      }

      // Add fields
      Object.entries(point.fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          influxPoint.floatField(key, value);
        } else if (typeof value === 'string') {
          influxPoint.stringField(key, value);
        } else if (typeof value === 'boolean') {
          influxPoint.booleanField(key, value);
        }
      });

      // Set timestamp
      if (point.timestamp) {
        influxPoint.timestamp(point.timestamp);
      }

      this.writeApi.writePoint(influxPoint);
    } catch (error) {
      console.error('❌ Error writing metric point:', error);
    }
  }

  writePoints(points: MetricPoint[]): void {
    points.forEach(point => this.writePoint(point));
  }

  counter(measurement: string, value: number = 1, tags?: Record<string, string>): void {
    this.writePoint({
      measurement,
      tags,
      fields: { count: value }
    });
  }

  gauge(measurement: string, value: number, tags?: Record<string, string>): void {
    this.writePoint({
      measurement,
      tags,
      fields: { value }
    });
  }

  timing(measurement: string, duration: number, tags?: Record<string, string>): void {
    this.writePoint({
      measurement,
      tags,
      fields: { duration_ms: duration }
    });
  }

  error(measurement: string, error: Error, tags?: Record<string, string>): void {
    this.writePoint({
      measurement,
      tags: { ...tags, error_type: error.name },
      fields: {
        error_message: error.message,
        error_count: 1
      }
    });
  }

  performance(measurement: string, metrics: PerformanceMetrics, tags?: Record<string, string>): void {
    const fields: Record<string, number> = {};

    if (metrics.response_time) fields.response_time_ms = metrics.response_time;
    if (metrics.memory_usage) fields.memory_mb = metrics.memory_usage;
    if (metrics.cpu_usage) fields.cpu_percent = metrics.cpu_usage;
    if (metrics.request_count) fields.request_count = metrics.request_count;

    this.writePoint({
      measurement,
      tags,
      fields
    });
  }

  timer(measurement: string, tags?: Record<string, string>): TimerResult {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.timing(measurement, duration, tags);
        return duration;
      }
    };
  }

  async flush(): Promise<void> {
    try {
      await this.writeApi.flush();
      console.log('✅ Metrics flushed to InfluxDB');
    } catch (error) {
      console.error('❌ Error flushing metrics:', error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.writeApi.close();
      console.log('🔌 Metrics client connection closed');
    } catch (error) {
      console.error('❌ Error closing metrics client:', error);
    }
  }
}

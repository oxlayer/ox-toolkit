import type { MetricsConfig } from './types.js';

/**
 * Simple in-memory metrics client
 * In production, this would integrate with OpenTelemetry or Prometheus
 */
export class MetricsClient {
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, Map<string, number[]>>();
  private config: Required<MetricsConfig>;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      defaultLabels: config.defaultLabels ?? {},
      port: config.port ?? 9090,
      path: config.path ?? '/metrics',
    };
  }

  /**
   * Increment a counter metric
   */
  counter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const mergedLabels = { ...this.config.defaultLabels, ...labels };
    const key = this.getLabelKey(name, mergedLabels);

    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }

    const currentValue = this.counters.get(name)!.get(key) || 0;
    this.counters.get(name)!.set(key, currentValue + value);
  }

  /**
   * Set a gauge metric
   */
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const mergedLabels = { ...this.config.defaultLabels, ...labels };
    const key = this.getLabelKey(name, mergedLabels);

    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }

    this.gauges.get(name)!.set(key, value);
  }

  /**
   * Record a value in a histogram metric
   */
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const mergedLabels = { ...this.config.defaultLabels, ...labels };
    const key = this.getLabelKey(name, mergedLabels);

    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Map());
    }

    if (!this.histograms.get(name)!.has(key)) {
      this.histograms.get(name)!.set(key, []);
    }

    this.histograms.get(name)!.get(key)!.push(value);
  }

  /**
   * Start a timer for a histogram metric
   * Returns a function that when called, records the elapsed time
   */
  timer(name: string, labels: Record<string, string> = {}): () => void {
    if (!this.config.enabled) {
      return () => {};
    }

    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.histogram(name, duration, labels);
    };
  }

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): string {
    if (!this.config.enabled) {
      return '# Metrics disabled\n';
    }

    const lines: string[] = [];

    // Counters
    for (const [name, labelMap] of this.counters) {
      for (const [key, value] of labelMap) {
        const labels = this.parseLabelKey(key);
        lines.push(`${name}{${labels}} ${value}`);
      }
    }

    // Gauges
    for (const [name, labelMap] of this.gauges) {
      for (const [key, value] of labelMap) {
        const labels = this.parseLabelKey(key);
        lines.push(`${name}{${labels}} ${value}`);
      }
    }

    // Histograms
    for (const [name, labelMap] of this.histograms) {
      for (const [key, values] of labelMap) {
        const labels = this.parseLabelKey(key);
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = count > 0 ? sum / count : 0;

        lines.push(`${name}_count{${labels}} ${count}`);
        lines.push(`${name}_sum{${labels}} ${sum}`);
        lines.push(`${name}{${labels}} ${avg}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Create a unique key for a metric with labels
   */
  private getLabelKey(name: string, labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  /**
   * Parse a label key back into a label string
   */
  private parseLabelKey(key: string): string {
    return key || '';
  }
}

/**
 * Default metrics client instance
 */
export const metricsClient = new MetricsClient();

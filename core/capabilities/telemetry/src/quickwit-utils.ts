/**
 * Quickwit Index Management Utilities
 */

/**
 * OTEL Traces Schema
 * Based on Quickwit default otel-traces-v0_7 schema
 */
/**
 * OTEL Traces Schema
 * Based on Quickwit default otel-traces-v0_7 schema
 * See: https://quickwit.io/docs/configuration/otel-traces
 */
const TRACES_SCHEMA = {
    version: '0.8',
    index_config: {
        version: '0.8',
        doc_mapping: {
            mode: 'strict',
            field_mappings: [
                { name: 'trace_id', type: 'bytes', input_format: 'hex', output_format: 'hex', fast: true },
                { name: 'trace_state', type: 'text', indexed: false },
                { name: 'service_name', type: 'text', tokenizer: 'raw', fast: true },
                { name: 'resource_attributes', type: 'json', tokenizer: 'raw' },
                { name: 'resource_dropped_attributes_count', type: 'u64', indexed: false },
                { name: 'scope_name', type: 'text', indexed: false },
                { name: 'scope_version', type: 'text', indexed: false },
                { name: 'scope_attributes', type: 'json', indexed: false },
                { name: 'scope_dropped_attributes_count', type: 'u64', indexed: false },
                { name: 'span_id', type: 'bytes', input_format: 'hex', output_format: 'hex', fast: true },
                { name: 'span_kind', type: 'u64' },
                { name: 'span_name', type: 'text', tokenizer: 'raw', fast: true },
                { name: 'span_fingerprint', type: 'text', tokenizer: 'raw' },
                { name: 'span_start_timestamp_nanos', type: 'datetime', input_formats: ['unix_timestamp'], output_format: 'unix_timestamp_nanos', indexed: false, fast: true, fast_precision: 'milliseconds' },
                { name: 'span_end_timestamp_nanos', type: 'datetime', input_formats: ['unix_timestamp'], output_format: 'unix_timestamp_nanos', indexed: false, fast: false },
                { name: 'span_duration_millis', type: 'u64', indexed: false, fast: true },
                { name: 'span_attributes', type: 'json', tokenizer: 'raw', fast: true },
                { name: 'span_dropped_attributes_count', type: 'u64', indexed: false },
                { name: 'span_dropped_events_count', type: 'u64', indexed: false },
                { name: 'span_dropped_links_count', type: 'u64', indexed: false },
                { name: 'span_status', type: 'json', indexed: true },
                { name: 'parent_span_id', type: 'bytes', input_format: 'hex', output_format: 'hex', indexed: false },
                { name: 'events', type: 'array<json>', tokenizer: 'raw', fast: true },
                { name: 'event_names', type: 'array<text>', tokenizer: 'default', record: 'position', stored: false },
                { name: 'links', type: 'array<json>', tokenizer: 'raw' },
            ],
            timestamp_field: 'span_start_timestamp_nanos',
            tag_fields: ['service_name'],
        },
        indexing_settings: {
            commit_timeout_secs: 10,
        },
        search_settings: {
            default_search_fields: ['service_name', 'span_name'],
        },
    }
};

/**
 * OTEL Logs Schema
 * Based on Quickwit default otel-logs-v0_7 schema
 * See: https://quickwit.io/docs/configuration/otel-logs
 */
const LOGS_SCHEMA = {
    version: '0.8',
    index_config: {
        version: '0.8',
        doc_mapping: {
            mode: 'strict',
            field_mappings: [
                { name: 'timestamp_nanos', type: 'datetime', input_formats: ['unix_timestamp'], output_format: 'unix_timestamp_nanos', indexed: false, fast: true, fast_precision: 'milliseconds' },
                { name: 'observed_timestamp_nanos', type: 'datetime', input_formats: ['unix_timestamp'], output_format: 'unix_timestamp_nanos' },
                { name: 'service_name', type: 'text', tokenizer: 'raw', fast: true },
                { name: 'severity_text', type: 'text', tokenizer: 'raw', fast: true },
                { name: 'severity_number', type: 'u64', fast: true },
                { name: 'body', type: 'json', tokenizer: 'default' },
                { name: 'attributes', type: 'json', tokenizer: 'raw', fast: true },
                { name: 'dropped_attributes_count', type: 'u64', indexed: false },
                { name: 'trace_id', type: 'bytes', input_format: 'hex', output_format: 'hex', fast: true },
                { name: 'span_id', type: 'bytes', input_format: 'hex', output_format: 'hex', fast: true },
                { name: 'trace_flags', type: 'u64', indexed: false },
                { name: 'resource_attributes', type: 'json', tokenizer: 'raw', fast: true },
                { name: 'resource_dropped_attributes_count', type: 'u64', indexed: false },
                { name: 'scope_name', type: 'text', indexed: false },
                { name: 'scope_version', type: 'text', indexed: false },
                { name: 'scope_attributes', type: 'json', indexed: false },
                { name: 'scope_dropped_attributes_count', type: 'u64', indexed: false },
            ],
            timestamp_field: 'timestamp_nanos',
            tag_fields: ['service_name'],
        },
        indexing_settings: {
            commit_timeout_secs: 10,
        },
        search_settings: {
            default_search_fields: ['body.message'],
        },
    }
};

/**
 * Index check cache
 * Key: indexId
 * Value: Expiry timestamp (ms)
 */
const indexCache = new Map<string, number>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Ensure an index exists in Quickwit
 */
export async function ensureIndex(url: string, indexId: string, type: 'traces' | 'logs'): Promise<void> {
    // Check cache
    const expiry = indexCache.get(indexId);
    if (expiry && Date.now() < expiry) {
        // Cache hit
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const indexUrl = `${baseUrl}/api/v1/indexes/${indexId}`;

    try {
        // Check if index exists
        const checkResponse = await fetch(indexUrl);
        if (checkResponse.ok) {
            console.log(`[Quickwit] Index '${indexId}' already exists.`);
            // Update cache
            indexCache.set(indexId, Date.now() + CACHE_TTL_MS);
            return;
        }

        if (checkResponse.status === 404) {
            console.log(`[Quickwit] Index '${indexId}' not found. Creating...`);

            // Create index
            const config = {
                index_id: indexId,
                ...(type === 'traces' ? TRACES_SCHEMA.index_config : LOGS_SCHEMA.index_config)
            };

            const createResponse = await fetch(`${baseUrl}/api/v1/indexes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (!createResponse.ok) {
                throw new Error(`Failed to create index: ${createResponse.status} ${createResponse.statusText} - ${await createResponse.text()}`);
            }

            console.log(`[Quickwit] Index '${indexId}' created successfully.`);
            // Update cache
            indexCache.set(indexId, Date.now() + CACHE_TTL_MS);
        } else {
            throw new Error(`Failed to check index: ${checkResponse.status} ${checkResponse.statusText}`);
        }
    } catch (error) {
        console.error(`[Quickwit] Error ensuring index '${indexId}':`, error);
        // Don't throw, just log. Telemetry shouldn't crash the app.
    }
}

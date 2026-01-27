# Performance Tests

K6 performance tests for the Alo Manager API.

## Prerequisites

Install k6: https://k6.io/docs/get-started/installation/

## Running Tests

### Quick Test (Smoke Test)

Quick health check and basic functionality test.

```bash
k6 run quick-test.js
```

### Load Test

Main load test with ramping load up to 3000 RPS.

```bash
k6 run load-test.js
```

With HTML report:
```bash
k6 run --out html=report.html load-test.js
```

### Soak Test

Long-running test (1 hour) to detect memory leaks.

```bash
k6 run soak-test.js
```

### Custom URL

Override the default URL:

```bash
BASE_URL=http://localhost:3001 k6 run load-test.js
```

## Test Scenarios

| Test | Duration | Load | Purpose |
|------|----------|------|---------|
| quick-test | 30s | 10 VUs | Smoke test |
| load-test | 5min | 100-10000 RPS | Performance & capacity |
| soak-test | 1h | 100 RPS | Memory leak detection |

## Thresholds

- **P95 Latency**: < 200ms (normal), < 300ms (soak)
- **P99 Latency**: < 500ms
- **Error Rate**: < 1%
- **Max Latency**: < 1000ms

## Interpreting Results

### Key Metrics

- **RPS**: Requests per second
- **P95/P99**: Latency percentiles
- **Failure Rate**: Percentage of failed requests

### Pass Criteria

All tests pass if:
- Error rate < 1%
- P95 latency < 200ms
- No HTTP errors (5xx) from server

## Tips

1. Start with `quick-test.js` to verify basic functionality
2. Run `load-test.js` before deploying to production
3. Use `soak-test.js` to catch memory leaks in long-running processes
4. Generate HTML reports for better visualization: `--out html=report.html`

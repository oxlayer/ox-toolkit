# Performance Testing

Load and performance tests using [k6](https://k6.io/).

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
curl https://github.com/grafana/k6/releases/download/v0.51.0/k6-v0.51.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.51.0-linux-amd64/k6 /usr/local/bin/

# Or with apt
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Files

| File | Purpose | Duration | Target |
|------|---------|----------|--------|
| `quick-test.js` | Quick smoke test | 30s | 100 req/s |
| `load-test.js` | Main load test | 5min | Up to 3000 req/s sustained |
| `spike-test.js` | Sudden traffic spikes | 3min | 100 → 5000 req/s |
| `soak-test.js` | Extended duration | 1 hour | 500 req/s |

## Running Tests

### Quick smoke test (run first)
```bash
# Against local server
k6 run quick-test.js

# With custom URL
BASE_URL=http://localhost:3000 k6 run quick-test.js

# With authentication
BASE_URL=https://api.example.com AUTH_TOKEN=your-token k6 run quick-test.js
```

### Full load test (main test)
```bash
# Basic run
k6 run load-test.js

# With HTML report
k6 run --out html=report.html load-test.js

# With JSON output for analysis
k6 run --out json=metrics.json load-test.js

# All outputs combined
k6 run --out html=report.html --out json=metrics.json load-test.js
```

### Spike test (traffic spikes)
```bash
k6 run spike-test.js
```

### Soak test (1 hour - finds memory leaks)
```bash
k6 run soak-test.js
```

## Interpreting Results

### Key Metrics

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| **p(95) latency** | < 200ms | 200-500ms | > 500ms |
| **p(99) latency** | < 500ms | 500-1000ms | > 1000ms |
| **Error rate** | < 1% | 1-5% | > 5% |
| **Throughput** | At target | ±10% | Below target |

### Output Examples

```
✓ status is 200
✓ response time < 100ms

checks.........................: 100.00% ✓ 300000       ✗ 0
http_req_duration..............: avg=95ms   min=5ms    med=85ms   max=450ms  p(95)=180ms p(99)=250ms
http_req_failed................: 0.00%   ✓ 0           ✗ 300000
http_reqs......................: 300000  3000/s
vus............................: 500     min=50       max=500
```

## Performance Targets

**Your goal: 3000 req/s sustained**

- ✅ **Read operations**: < 100ms p(95)
- ✅ **Write operations**: < 200ms p(95)
- ✅ **Error rate**: < 1%
- ✅ **Sustained throughput**: 3000 req/s for 2+ minutes

## Optimization Tips

If you're not hitting 3000 req/s:

1. **Database indexing**:
   ```sql
   CREATE INDEX idx_todos_user_id ON todos(user_id);
   CREATE INDEX idx_todos_status ON todos(status);
   CREATE INDEX idx_todos_created_at ON todos(created_at);
   ```

2. **Connection pooling**:
   ```typescript
   // Increase pool size in your DB config
   pool: { max: 100, min: 10, idle: 10000 }
   ```

3. **Response caching**:
   ```typescript
   // Cache GET /api/todos for 1-5 seconds
   ```

4. **Disable debug logging** in production

5. **Use a reverse proxy** (nginx) for static files and caching

## CI/CD Integration

Add to your pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on: [pull_request, workflow_dispatch]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/k6-action@v0.2.0
        with:
          filename: perf-tests/quick-test.js
        env:
          BASE_URL: http://localhost:3000
```

## Troubleshooting

### "Cannot connect to server"
- Make sure your server is running
- Check `BASE_URL` is correct
- Verify firewall rules

### "Too many VUs needed"
- Increase `maxVUs` in the test options
- Your server can't handle the load (this is the finding!)

### "High error rate"
- Check server logs for errors
- Database connection pool exhausted?
- Out of memory?

### "Slow response times"
- Profile your code: `bun --prof prof`
- Check database query performance
- Add missing indexes

# Casekaaran — Testing & Quality Assurance Guide

## Test Suite Execution

Casekaaran uses the native Node.js test runner (`node:test`) for unit and integration testing with zero external test harness overhead.

### 1. Run All Unit & Integration Tests
```bash
cd backend
npm test
```
Verifies:
- Public catalog and brand APIs
- Incomplete checkout payload rejection
- Valid checkout order creation and Cashfree session generation
- Admin login security and unauthorized request rejection
- Percentage and fixed amount discount calculations
- Unique order number generation (`CK-YYYYMMDD-XXXX`)

### 2. Run Performance & Scalability Benchmark (500 RPM Target)
```bash
cd backend
npm run test:load
```
Benchmarks:
- 500 requests per minute throughput target
- Sub-millisecond local in-memory response latency
- 100% request success rate

/**
 * Casekaaran — k6 Load Testing Plan
 * Target: 500 requests per minute (~8.33 RPS) sustained + burst stress testing
 * 
 * To execute with k6:
 *   k6 run backend/tests/load/k6-load-test.js
 * 
 * Or run via Node executor:
 *   node backend/tests/load/k6-load-test.js
 */

const isK6 = typeof __ENV !== 'undefined';

if (isK6) {
  // k6 execution environment
  // eslint-disable-next-line no-undef
  const http = require('k6/http');
  // eslint-disable-next-line no-undef
  const { check, sleep } = require('k6');

  // eslint-disable-next-line no-undef
  exports.options = {
    scenarios: {
      // 1. Sustained traffic: 500 requests per minute (~8.33 req/sec)
      sustained_traffic: {
        executor: 'constant-arrival-rate',
        rate: 500,
        timeUnit: '1m',
        duration: '5m',
        preAllocatedVUs: 20,
        maxVUs: 50
      },
      // 2. Burst traffic: Sudden 30 concurrent user spikes
      burst_spike: {
        executor: 'ramping-arrival-rate',
        startRate: 100,
        timeUnit: '1m',
        preAllocatedVUs: 30,
        maxVUs: 100,
        stages: [
          { target: 100, duration: '1m' },
          { target: 800, duration: '1m' }, // Peak burst: 800 RPM
          { target: 100, duration: '1m' }
        ]
      }
    },
    thresholds: {
      http_req_duration: ['p(95)<250'], // 95% of requests must complete under 250ms
      http_req_failed: ['rate<0.01']     // Less than 1% errors allowed
    }
  };

  // eslint-disable-next-line no-undef
  exports.default = function () {
    const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000/api';

    // 1. Browse Brands
    const brandsRes = http.get(`${BASE_URL}/brands`);
    check(brandsRes, {
      'brands status is 200': (r) => r.status === 200,
      'brands response fast': (r) => r.timings.duration < 200
    });

    sleep(1);

    // 2. Filter Products by Model
    const productsRes = http.get(`${BASE_URL}/products?model=iphone-16-pro-max&sort=price_asc`);
    check(productsRes, {
      'products status is 200': (r) => r.status === 200
    });

    sleep(2);

    // 3. Concurrent Guest Checkout (Simulated 10% conversion)
    if (Math.random() < 0.1) {
      const checkoutPayload = JSON.stringify({
        customer: {
          full_name: 'Load Test Customer',
          phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: 'loadtest@casekaaran.com'
        },
        address: {
          address_line1: 'Load Test Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          pin_code: '560001'
        },
        items: [
          { product_id: 1, product_variant_id: 1, phone_model_id: 101, quantity: 1 }
        ],
        whatsapp_consent: true
      });

      const checkoutRes = http.post(`${BASE_URL}/checkout`, checkoutPayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      check(checkoutRes, {
        'checkout status is 201': (r) => r.status === 201
      });
    }
  };

} else {
  // Built-in Node.js simulated benchmark for environments without k6 binary installed
  const http = require('http');

  console.log('=================================================================');
  console.log('CASEKAARAN 500 REQ/MIN PERFORMANCE BENCHMARK EXECUTOR');
  console.log('Target: 500 requests per minute (8.33 RPS average)');
  console.log('=================================================================');

  const totalRequests = 100;
  let completed = 0;
  let successCount = 0;
  const start = Date.now();

  const app = require('../../src/app');
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Benchmark] Local target server running on port ${port}...`);

    for (let i = 0; i < totalRequests; i++) {
      http.get(`http://localhost:${port}/api/brands`, (res) => {
        if (res.statusCode === 200) successCount++;
        completed++;
        if (completed === totalRequests) {
          const totalMs = Date.now() - start;
          const rps = (totalRequests / (totalMs / 1000)).toFixed(2);
          const rpm = (rps * 60).toFixed(0);

          console.log(`[Results] Completed: ${completed}/${totalRequests} requests`);
          console.log(`[Results] Success rate: ${(successCount / totalRequests * 100).toFixed(1)}%`);
          console.log(`[Results] Total time: ${totalMs} ms`);
          console.log(`[Results] Measured throughput: ${rps} requests/sec (~${rpm} requests/min)`);
          console.log(`[Threshold] 500 RPM target: ${rpm >= 500 ? '✅ PASSED' : '⚠️ Slower than target'}`);

          server.close();
          process.exit(0);
        }
      }).on('error', (e) => {
        completed++;
        if (completed === totalRequests) {
          server.close();
          process.exit(0);
        }
      });
    }
  });
}

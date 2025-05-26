import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  scenarios: {
    // Constant load test
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
    // Stress test
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 200 },  // Ramp up to 200 requests/s
        { duration: '5m', target: 200 },  // Stay at 200 requests/s
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% can fail
    errors: ['rate<0.05'],             // Error rate should be below 5%
  },
};

// Simulated user behavior
export default function () {
  // 1. Health Check
  const healthCheck = http.get('http://localhost:5000/api/v1/health');
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Authentication
  const loginRes = http.post('http://localhost:5000/api/v1/auth/login', {
    email: 'test@test.com',
    password: 'password',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has auth token': (r) => JSON.parse(r.body).token !== undefined,
  }) || errorRate.add(1);

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // 3. Protected API calls
    const userProfile = http.get('http://localhost:5000/api/v1/user/profile', { headers });
    check(userProfile, {
      'profile access successful': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // 4. Data-intensive operation
    const transactions = http.get('http://localhost:5000/api/v1/transactions', { headers });
    check(transactions, {
      'transactions retrieved': (r) => r.status === 200,
      'has transaction data': (r) => JSON.parse(r.body).length > 0,
    }) || errorRate.add(1);

    sleep(2);

    // 5. Complex operation (fraud detection)
    const fraudCheck = http.post('http://localhost:5000/api/v1/transactions/check', {
      amount: 1000,
      merchant: 'Test Store',
      category: 'retail',
    }, { headers });
    
    check(fraudCheck, {
      'fraud check completed': (r) => r.status === 200,
      'has risk score': (r) => JSON.parse(r.body).riskScore !== undefined,
    }) || errorRate.add(1);
  }

  sleep(3);
}

// Test cleanup
export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      metrics: {
        http_req_duration: data.metrics.http_req_duration,
        http_reqs: data.metrics.http_reqs,
        error_rate: data.metrics.errors,
      },
      checks: data.metrics.checks,
    }, null, 2),
  };
} 
const request = require('supertest');
const app = require('../src/app');

describe('Security Tests', () => {
  // Test security headers
  describe('Security Headers', () => {
    it('should have security headers set', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  // Test rate limiting
  describe('Rate Limiting', () => {
    it('should limit repeated requests to auth endpoints', async () => {
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'password' });
        
        if (i < 5) {
          expect(response.status).not.toBe(429);
        } else {
          expect(response.status).toBe(429);
          expect(response.body).toHaveProperty('error');
        }
      }
    });
  });

  // Test XSS Protection
  describe('XSS Protection', () => {
    it('should block XSS attempts', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@test.com'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Potential XSS attack detected');
    });
  });

  // Test SQL Injection Protection
  describe('SQL Injection Protection', () => {
    it('should block SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ search: 'SELECT * FROM users' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Potential SQL injection detected');
    });
  });

  // Test CORS
  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://naps-personal.vercel.app');

      expect(response.headers['access-control-allow-origin']).toBe('https://naps-personal.vercel.app');
    });

    it('should block requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-site.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // Test Request Size Limits
  describe('Request Size Limits', () => {
    it('should reject large payloads', async () => {
      const largePayload = { data: 'x'.repeat(15000) };
      const response = await request(app)
        .post('/api/v1/data')
        .send(largePayload);

      expect(response.status).toBe(413);
    });
  });

  // Test Authentication
  describe('Authentication', () => {
    it('should require valid JWT for protected routes', async () => {
      const response = await request(app)
        .get('/api/v1/protected-resource');

      expect(response.status).toBe(401);
    });

    it('should reject invalid JWTs', async () => {
      const response = await request(app)
        .get('/api/v1/protected-resource')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token or token expired');
    });
  });
});

// Run the tests with: npm test tests/security.test.js 
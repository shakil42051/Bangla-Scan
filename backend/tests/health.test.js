'use strict';
const request = require('supertest');
const app = require('../src/server');

describe('GET /health - Health Check Endpoint', () => {
  it('serves the actual website and its modules from the allowlisted directory', async () => {
    const page = await request(app).get('/').expect(200).expect('Content-Type', /html/);
    expect(page.text).toContain('/assets/app.mjs');
    await request(app).get('/assets/styles.css').expect(200).expect('Content-Type', /css/);
    await request(app).get('/assets/app.mjs').expect(200);
  });
  it('should return 200 OK and valid status parameters', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('env');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app)
      .get('/api/unknown-endpoint-route-test')
      .expect(404);

    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('message');
  });
});

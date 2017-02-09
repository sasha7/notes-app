/* global describe, it */

const request = require('supertest');
const server = require('../app');

describe('GET /', () => {
  it('should render ok', (done) => {
    request(server)
    .get('/')
    .expect(200, done);
  });
});

describe('GET /contact', () => {
  it('should render ok', (done) => {
    request(server)
    .get('/contact')
    .expect(200, done);
  });
});

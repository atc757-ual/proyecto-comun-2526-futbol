const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Importación directa, no desestructurada

describe('Contract Tests - Node.js Backend', () => {

  // Cerramos la conexión a la DB al terminar
  afterAll(async () => {
    await mongoose.connection.close();
    console.log('[NODE-TEST] Conexión DB cerrada y proceso finalizado.');
  });

  test('GET /api/players should return standardized ApiResult structure', async () => {
    // Supertest levanta el servidor automáticamente si le pasamos 'app'
    const response = await request(app).get('/api/players');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body).toHaveProperty('data');

    const { result } = response.body;
    expect(result).toHaveProperty('transactionId');
    expect(result).toHaveProperty('code', '200');
    expect(result).toHaveProperty('description', 'OK');
  });

  test('GET /non-existent should return standardized 404 ApiResult', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.result.code).toBe('404');
    expect(response.body.result.description).toBe('NOK');
  });
});

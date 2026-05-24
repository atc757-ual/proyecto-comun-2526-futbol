// backend-node/app_api/tests/ai.controller.full.test.js
/**
 * Tests de cobertura completa para el controlador AI (analyzeMyTeam).
 * Se mockea el modelo Mongoose y el servicio AI para cubrir los caminos
 * de éxito, error de cuota (429) y error genérico (500).
 */

jest.mock('mongoose', () => {
  const mockFind = jest.fn();
  const mockModel = {
    find: mockFind,
    findOne: jest.fn()
  };
  return { model: jest.fn(() => mockModel) };
});

jest.mock('../services/ai.service', () => ({
  analyzePlayers: jest.fn()
}));

const mongoose = require('mongoose');
const aiService = require('../services/ai.service');
const { analyzeMyTeam } = require('../controllers/ai');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AI Controller - analyzeMyTeam', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('ruta exitosa devuelve 200 con análisis', async () => {
    const fakePlayers = [{ name: 'P1' }, { name: 'P2' }];
    const mockModel = mongoose.model();
    const mockQuery = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValueOnce(fakePlayers) };
    mockModel.find.mockReturnValue(mockQuery);
    const analysisResult = { analysis: 'ok' };
    aiService.analyzePlayers.mockResolvedValueOnce(analysisResult);

    const req = { user: { firebaseUid: 'uid123' } };
    const res = mockRes();

    await analyzeMyTeam(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: analysisResult }));
  });

  test('sin jugadores devuelve 404', async () => {
    const mockModel = mongoose.model();
    const mockQueryEmpty = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValueOnce([]) };
    mockModel.find.mockReturnValue(mockQueryEmpty);
    const req = { user: { firebaseUid: 'uid123' } };
    const res = mockRes();
    await analyzeMyTeam(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('error 429 devuelve 429', async () => {
    const fakePlayers = [{ name: 'P1' }];
    const mockModel = mongoose.model();
    const mockQuery429 = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValueOnce(fakePlayers) };
    mockModel.find.mockReturnValue(mockQuery429);
    const error = new Error('429'); // message includes 429
    aiService.analyzePlayers.mockRejectedValueOnce(error);
    const req = { user: { firebaseUid: 'uid123' } };
    const res = mockRes();
    await analyzeMyTeam(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ description: expect.any(String) }) }));
  });

  test('error genérico devuelve 500', async () => {
    const fakePlayers = [{ name: 'P' }];
    const mockModel = mongoose.model();
    const mockQuery500 = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValueOnce(fakePlayers) };
    mockModel.find.mockReturnValue(mockQuery500);
    const error = new Error('Unexpected error');
    aiService.analyzePlayers.mockRejectedValueOnce(error);
    const req = { user: { firebaseUid: 'uid' } };
    const res = mockRes();
    await analyzeMyTeam(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ description: expect.any(String) }) }));
  });
});

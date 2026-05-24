// backend-node/app_api/tests/news.controller.edge.test.js
/**
 * Edge case tests for news controller to improve branch and function coverage.
 */

jest.mock('../services/news.service', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  bulkCreate: jest.fn()
}));

jest.mock('../controllers/apiResult', () => ({
  sendApiResult: jest.fn()
}));

const newsService = require('../services/news.service');
const { sendApiResult } = require('../controllers/apiResult');
const newsController = require('../controllers/news');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// ... later in error path tests, change expectations


describe('News Controller - success paths', () => {
  afterEach(() => jest.clearAllMocks());

  test('getNews success sin paginación', async () => {
    const data = [{ id: '1' }];
    newsService.findAll.mockResolvedValue({ data, pagination: null });
    const req = { query: {}, user: { role: 'user' } };
    const res = mockRes();
    await newsController.getNews(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data }));
  });

  test('getNews success con paginación', async () => {
    const data = [{ id: '1' }];
    const pagination = { page: 1, limit: 5, total: 10, totalPages: 2 };
    newsService.findAll.mockResolvedValue({ data, pagination });
    const req = { query: { page: '1', limit: '5' }, user: { role: 'user' } };
    const res = mockRes();
    await newsController.getNews(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data, pagination }));
  });

  test('createNews success', async () => {
    const created = { id: 'new' };
    newsService.create.mockResolvedValue(created);
    const req = { body: { title: 'T' } };
    const res = mockRes();
    await newsController.createNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 201, expect.any(String), created);
  });

  test('updateNews success', async () => {
    const updated = { id: '1' };
    newsService.update.mockResolvedValue(updated);
    const req = { params: { id: '1' }, body: { title: 'New' } };
    const res = mockRes();
    await newsController.updateNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 200, expect.any(String), updated);
  });

  test('deleteNews success', async () => {
    newsService.remove.mockResolvedValue();
    const req = { params: { id: '1' } };
    const res = mockRes();
    await newsController.deleteNews(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('bulkCreateNews success', async () => {
    const result = { ids: ['a'] };
    newsService.bulkCreate.mockResolvedValue(result);
    const req = { body: [{ title: 'A' }] };
    const res = mockRes();
    await newsController.bulkCreateNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 201, expect.any(String), result);
  });
});

describe('News Controller - error paths', () => {
  afterEach(() => jest.clearAllMocks());

  test('getNews error -> 500', async () => {
    const err = new Error('fail');
    newsService.findAll.mockRejectedValue(err);
    const req = { query: {}, user: { role: 'user' } };
    const res = mockRes();
    await newsController.getNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Error en Bridge'));
  });

  test('createNews error -> 500', async () => {
    newsService.create.mockRejectedValue(new Error('boom'));
    const req = { body: {} };
    const res = mockRes();
    await newsController.createNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Error al crear noticia'));
  });

  test('updateNews error -> 500', async () => {
    newsService.update.mockRejectedValue(new Error('boom'));
    const req = { params: { id: '1' }, body: {} };
    const res = mockRes();
    await newsController.updateNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Error al actualizar noticia'));
  });

  test('bulkCreateNews error -> 500', async () => {
    newsService.bulkCreate.mockRejectedValue(new Error('boom'));
    const req = { body: [] };
    const res = mockRes();
    await newsController.bulkCreateNews(req, res);
    expect(sendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Error en carga masiva'));
  });
});

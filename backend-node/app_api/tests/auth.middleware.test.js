// backend-node/app_api/tests/auth.middleware.edge.test.js
/**
 * Edge case tests for auth.middleware – increase branch coverage > 80%.
 * Mocks:
 *   - jsonwebtoken.verify (callback style)
 *   - mongoose.model('User') returning a mock with findOne (supporting .select) and create
 *   - sendApiResult (captures status/message)
 *   - fs & path for public key loading (uses default secret)
 */

// Ensure the middleware does NOT take the test‑user shortcut
process.env.NODE_ENV = 'production';
// Provide a secret so the middleware can initialize without public_key.pem
process.env.JWT_SECRET = 'test-secret-key';

jest.mock('jsonwebtoken');
jest.mock('mongoose', () => ({
  model: jest.fn()
}));
jest.mock('fs');
jest.mock('path', () => ({
  join: jest.fn(() => '/fake/public_key.pem')
}));
jest.mock('../controllers/apiResult', () => ({
  sendApiResult: jest.fn((res, status, msg) => {
    // emulate Express response object – useful for expectations
    res.statusCode = status;
    res.body = msg;
    return res;
  })
}));

const { sendApiResult } = require('../controllers/apiResult');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

describe('auth.middleware - authorizeRequest', () => {
  const next = jest.fn();
  let req, res;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    // jest.resetModules(); // removed to retain mocks across tests
    req = { headers: {} };
    res = {};
    next.mockClear();
    sendApiResult.mockClear();
    // Default mock for mongoose.model – will be overridden per test when needed
    const mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn()
    };
    mongoose.model.mockReturnValue(mockUserModel);
  });

  test('fails when Authorization header missing', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    await authorizeRequest(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(res, 401, 'Acceso no autorizado');
    expect(next).not.toHaveBeenCalled();
  });

  test('fails when header does not start with Bearer', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    req.headers.authorization = 'Basic abcdef';
    await authorizeRequest(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(res, 401, 'Acceso no autorizado');
    expect(next).not.toHaveBeenCalled();
  });

  test('fails on invalid JWT token', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    req.headers.authorization = 'Bearer badtoken';
    jwt.verify.mockImplementation((tok, key, opts, cb) => cb(new Error('Invalid token'), null));
    await authorizeRequest(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(
      res,
      401,
      'No autorizado: Token inválido o expirado'
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('fails when user not found in DB', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    req.headers.authorization = 'Bearer goodtoken';
    jwt.verify.mockImplementation((tok, key, opts, cb) => cb(null, { id: 'uid123' }));
    const mockUserModel = {
      // findOne returns a query‑like object with .select()
      findOne: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(null)
      })),
      create: jest.fn()
    };
    mongoose.model.mockReturnValue(mockUserModel);
    await authorizeRequest(req, res, next);
    expect(mockUserModel.findOne).toHaveBeenCalled();
    expect(sendApiResult).toHaveBeenCalledWith(
      res,
      401,
      'No autorizado: El usuario no existe'
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('handles DB error and returns 500', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    req.headers.authorization = 'Bearer goodtoken';
    jwt.verify.mockImplementation((tok, key, opts, cb) => cb(null, { id: 'uid123' }));
    const mockUserModel = {
      findOne: jest.fn(() => {
        // Simulate a rejected promise when .select() is awaited
        return { select: jest.fn().mockRejectedValue(new Error('DB error')) };
      }),
      create: jest.fn()
    };
    mongoose.model.mockReturnValue(mockUserModel);
    await authorizeRequest(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(
      res,
      500,
      'Error interno al verificar autorización'
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('successful verification calls next()', async () => {
    const { authorizeRequest } = require('../middleware/auth.middleware');
    req.headers.authorization = 'Bearer goodtoken';
    const decoded = { id: 'uid123', master: true };
    jwt.verify.mockImplementation((tok, key, opts, cb) => cb(null, decoded));
    const userObj = { _id: 'uid123', role: 'admin', is_active: true, blocked: false };
    const mockUserModel = {
      findOne: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(userObj)
      })),
      create: jest.fn()
    };
    mongoose.model.mockReturnValue(mockUserModel);
    await authorizeRequest(req, res, next);
    expect(req.user).toBe(userObj);
    expect(req.tokenClaims).toBe(decoded);
    expect(next).toHaveBeenCalled();
  });
});

describe('auth.middleware - isAdmin & isMaster', () => {
  const next = jest.fn();
  let req, res;

  beforeEach(() => {
    req = { user: {}, tokenClaims: {} };
    res = {};
    next.mockClear();
    sendApiResult.mockClear();
  });

  test('isAdmin passes for admin role', () => {
    const { isAdmin } = require('../middleware/auth.middleware');
    req.user.role = 'admin';
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('isAdmin blocks non‑admin', () => {
    const { isAdmin } = require('../middleware/auth.middleware');
    req.user.role = 'user';
    isAdmin(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(
      res,
      403,
      'Acceso denegado: Se requiere rol de Administrador'
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('isMaster passes when tokenClaims.master true', () => {
    const { isMaster } = require('../middleware/auth.middleware');
    req.tokenClaims.master = true;
    isMaster(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('isMaster blocks otherwise', () => {
    const { isMaster } = require('../middleware/auth.middleware');
    req.tokenClaims.master = false;
    isMaster(req, res, next);
    expect(sendApiResult).toHaveBeenCalledWith(
      res,
      403,
      'Acceso denegado: Solo el Administrador Maestro puede realizar esta acción'
    );
    expect(next).not.toHaveBeenCalled();
  });
});

// backend-node/app_api/tests/jwt.util.edge.test.js
/**
 * Edge case tests for JWT utility – validates loading of the private key and error handling.
 */

jest.mock('fs');
jest.mock('path', () => ({
  join: jest.fn(() => '/fake/private_key.pem') // mocked path used by jwt.util
}));
// Mock jsonwebtoken to avoid needing a real RSA key
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'FAKE_JWT_TOKEN')
}));

describe('jwt.util - generateJWT', () => {
  afterEach(() => jest.clearAllMocks());

  test('successful token generation when private key loads', () => {
    // Reset module cache **before** configuring fs mocks, then set them
    jest.resetModules();
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('FAKE_PRIVATE_KEY');
    const { generateJWT } = require('../utils/jwt.util');
    const token = generateJWT('user123', 'admin', true);
    expect(typeof token).toBe('string');
    expect(token).toBe('FAKE_JWT_TOKEN');
    const jwt = require('jsonwebtoken');
    expect(jwt.sign).toHaveBeenCalled();
  });

  test('throws when private key file missing', () => {
    jest.resetModules();
    const fs = require('fs');
    fs.existsSync.mockReturnValue(false);
    const { generateJWT } = require('../utils/jwt.util');
    expect(() => generateJWT('uid')).toThrow();
  });

  test('throws when generateJWT called after load failure', () => {
    jest.resetModules();
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => { throw new Error('IO error'); });
    const { generateJWT } = require('../utils/jwt.util');
    expect(() => generateJWT('uid')).toThrow('No se puede generar JWT');
  });
});

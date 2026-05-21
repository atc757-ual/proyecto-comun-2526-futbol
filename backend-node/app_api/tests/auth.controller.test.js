const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn()
};

const mockAdmin = {
  apps: [],
  auth: jest.fn()
};

const mockSendApiResult = jest.fn();
const mockGenerateJWT = jest.fn();

jest.mock('mongoose', () => ({
  model: jest.fn(() => mockUserModel)
}));

jest.mock('../models/firebase', () => mockAdmin);
jest.mock('../utils/jwt.util', () => ({ generateJWT: mockGenerateJWT }));
jest.mock('../controllers/apiResult', () => ({ sendApiResult: mockSendApiResult }));

const {
  loginFirebase,
  setAdminRole,
  removeAdminRole,
  getUsers,
  toggleUserStatus
} = require('../controllers/auth');

describe('Auth controller (unit)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INITIAL_ADMIN_EMAIL = 'admin@test.com';

    req = { body: {}, query: {}, user: {} };
    res = {};

    mockGenerateJWT.mockReturnValue('jwt-test-token');
  });

  test('loginFirebase returns 400 when idToken is missing', async () => {
    await loginFirebase(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(res, 400, 'Falta el idToken de Firebase');
  });

  test('loginFirebase creates user in development simulation and returns 200', async () => {
    process.env.NODE_ENV = 'development';
    req.body.idToken = 'token-dev';

    mockUserModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const savedUser = {
      _id: 'mongo-id-1',
      firebaseUid: 'simulated_uid_123',
      name: 'Admin Simulado',
      email: process.env.INITIAL_ADMIN_EMAIL,
      role: 'admin',
      save: jest.fn().mockResolvedValue(true)
    };

    mockUserModel.create.mockResolvedValue(savedUser);

    await loginFirebase(req, res);

    expect(mockUserModel.create).toHaveBeenCalled();
    expect(mockGenerateJWT).toHaveBeenCalledWith('simulated_uid_123', 'admin', true);
    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      'Login exitoso',
      expect.objectContaining({ token: 'jwt-test-token' })
    );
  });

  test('loginFirebase returns 401 on firebase error outside development', async () => {
    process.env.NODE_ENV = 'test';
    req.body.idToken = 'bad-token';
    mockAdmin.apps = [{}];
    mockAdmin.auth.mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('invalid token'))
    });

    await loginFirebase(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      401,
      expect.stringContaining('Firebase')
    );
  });

  test('setAdminRole returns 400 when email is missing', async () => {
    await setAdminRole(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(res, 400, 'Falta el email del usuario a promover');
  });

  test('setAdminRole promotes user and returns 200', async () => {
    req.body.email = 'user@test.com';
    const authClient = {
      getUserByEmail: jest.fn().mockResolvedValue({ uid: 'uid-1' }),
      setCustomUserClaims: jest.fn().mockResolvedValue(true)
    };
    mockAdmin.auth.mockReturnValue(authClient);
    mockUserModel.findOneAndUpdate.mockResolvedValue({ email: 'user@test.com', role: 'admin' });

    await setAdminRole(req, res);

    expect(authClient.getUserByEmail).toHaveBeenCalledWith('user@test.com');
    expect(authClient.setCustomUserClaims).toHaveBeenCalledWith('uid-1', { admin: true });
    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      expect.stringContaining('ahora es Administrador')
    );
  });

  test('removeAdminRole demotes user and returns 200', async () => {
    req.body.email = 'user@test.com';
    const authClient = {
      getUserByEmail: jest.fn().mockResolvedValue({ uid: 'uid-1' }),
      setCustomUserClaims: jest.fn().mockResolvedValue(true)
    };
    mockAdmin.auth.mockReturnValue(authClient);
    mockUserModel.findOneAndUpdate.mockResolvedValue({ email: 'user@test.com', role: 'user' });

    await removeAdminRole(req, res);

    expect(authClient.setCustomUserClaims).toHaveBeenCalledWith('uid-1', { admin: false });
    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      expect.stringContaining('ya no es Administrador')
    );
  });

  test('getUsers returns users with optional email filter', async () => {
    req.query.email = 'alex';

    const users = [{ name: 'Alex', email: 'alex@test.com', role: 'user', is_active: true }];
    const select = jest.fn().mockResolvedValue(users);
    const limit = jest.fn().mockReturnValue({ select });
    mockUserModel.find.mockReturnValue({ limit });

    await getUsers(req, res);

    expect(mockUserModel.find).toHaveBeenCalledWith({ email: { $regex: 'alex', $options: 'i' } });
    expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, 'Usuarios encontrados', users);
  });

  test('toggleUserStatus updates firebase and mongo', async () => {
    req.body = { email: 'user@test.com', disabled: true };

    const authClient = {
      getUserByEmail: jest.fn().mockResolvedValue({ uid: 'uid-1' }),
      updateUser: jest.fn().mockResolvedValue(true)
    };
    mockAdmin.auth.mockReturnValue(authClient);

    const updated = { email: 'user@test.com', is_active: false };
    mockUserModel.findOneAndUpdate.mockResolvedValue(updated);

    await toggleUserStatus(req, res);

    expect(authClient.updateUser).toHaveBeenCalledWith('uid-1', { disabled: true });
    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      expect.stringContaining('INHABILITADO'),
      updated
    );
  });
});
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

jest.mock('mongoose', () => ({ model: jest.fn(() => mockUserModel) }));
jest.mock('../models/firebase', () => mockAdmin);
jest.mock('../utils/jwt.util', () => ({ generateJWT: mockGenerateJWT }));
jest.mock('../controllers/apiResult', () => ({ sendApiResult: mockSendApiResult }));

const { loginFirebase, setAdminRole, removeAdminRole, getUsers, toggleUserStatus } = require('../controllers/auth');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.INITIAL_ADMIN_EMAIL = 'admin@test.com';
        delete process.env.ALLOW_FAKE_AUTH;
        mockAdmin.apps = [];
        req = { body: {}, query: {}, user: {} };
        res = {};
        mockGenerateJWT.mockReturnValue('jwt-test-token');
    });

    // ── loginFirebase ─────────────────────────────────────────────────────────

    test('loginFirebase returns 400 when idToken is missing', async () => {
        await loginFirebase(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 400, 'Falta el idToken de Firebase');
    });

    test('loginFirebase creates user with ALLOW_FAKE_AUTH and returns 200', async () => {
        process.env.ALLOW_FAKE_AUTH = 'true';
        req.body.idToken = 'token-dev';
        mockUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
        const savedUser = {
            _id: 'mongo-id-1', firebaseUid: 'simulated_uid_123',
            name: 'Admin Simulado', email: process.env.INITIAL_ADMIN_EMAIL,
            role: 'admin', save: jest.fn().mockResolvedValue(true)
        };
        mockUserModel.create.mockResolvedValue(savedUser);

        await loginFirebase(req, res);

        expect(mockUserModel.create).toHaveBeenCalled();
        expect(mockGenerateJWT).toHaveBeenCalledWith('simulated_uid_123', 'admin', true);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, 'Login exitoso',
            expect.objectContaining({ token: 'jwt-test-token' }));
    });

    test('loginFirebase returns 401 on firebase error when ALLOW_FAKE_AUTH is not set', async () => {
        req.body.idToken = 'bad-token';
        mockAdmin.apps = [{}];
        mockAdmin.auth.mockReturnValue({
            verifyIdToken: jest.fn().mockRejectedValue(new Error('invalid token'))
        });
        await loginFirebase(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 401, expect.stringContaining('Firebase'));
    });

    test('loginFirebase handles duplicate key error (11000) and recovers', async () => {
        process.env.ALLOW_FAKE_AUTH = 'true';
        req.body.idToken = 'valid_token';
        const existingUser = { _id: 'mongo123', email: 'admin@test.com', role: 'admin', save: jest.fn().mockResolvedValue(true) };
        mockUserModel.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(existingUser);
        mockUserModel.create.mockImplementationOnce(() => {
            const err = new Error('Duplicate');
            err.code = 11000;
            throw err;
        });
        await loginFirebase(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, 'Login exitoso', expect.any(Object));
    });

    test('loginFirebase propagates generic DB error on create', async () => {
        process.env.ALLOW_FAKE_AUTH = 'true';
        req.body.idToken = 'valid_token';
        mockUserModel.findOne.mockResolvedValue(null);
        mockUserModel.create.mockImplementationOnce(() => { throw new Error('Generic DB Error'); });
        await loginFirebase(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 401, expect.stringContaining('Generic DB Error'));
    });

    test('loginFirebase returns 401 when user cannot be created nor found', async () => {
        process.env.ALLOW_FAKE_AUTH = 'true';
        req.body.idToken = 'valid_token';
        mockUserModel.findOne.mockResolvedValue(null);
        mockUserModel.create.mockResolvedValueOnce(null);
        await loginFirebase(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 401, expect.stringContaining('No se pudo crear ni encontrar'));
    });

    // ── setAdminRole ──────────────────────────────────────────────────────────

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
        expect(authClient.setCustomUserClaims).toHaveBeenCalledWith('uid-1', { admin: true });
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, expect.stringContaining('ahora es Administrador'));
    });

    test('setAdminRole returns 500 on firebase error', async () => {
        req.body.email = 'user@test.com';
        mockAdmin.auth.mockReturnValue({
            getUserByEmail: jest.fn().mockRejectedValue(new Error('Firebase Error'))
        });
        await setAdminRole(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Firebase Error'));
    });

    // ── removeAdminRole ───────────────────────────────────────────────────────

    test('removeAdminRole returns 400 when email is missing', async () => {
        await removeAdminRole(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 400, 'Falta el email del usuario a degradar');
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
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, expect.stringContaining('ya no es Administrador'));
    });

    test('removeAdminRole returns 500 on firebase error', async () => {
        req.body.email = 'user@test.com';
        mockAdmin.auth.mockReturnValue({
            getUserByEmail: jest.fn().mockRejectedValue(new Error('Firebase Error'))
        });
        await removeAdminRole(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Firebase Error'));
    });

    // ── getUsers ──────────────────────────────────────────────────────────────

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

    test('getUsers returns 500 on DB error', async () => {
        mockUserModel.find.mockImplementationOnce(() => { throw new Error('DB Error'); });
        await getUsers(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('DB Error'));
    });

    // ── toggleUserStatus ──────────────────────────────────────────────────────

    test('toggleUserStatus returns 400 when email is missing', async () => {
        await toggleUserStatus(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 400, 'Falta el email del usuario');
    });

    test('toggleUserStatus disables user and returns 200', async () => {
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
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 200, expect.stringContaining('INHABILITADO'), updated);
    });

    test('toggleUserStatus returns 500 on firebase error', async () => {
        req.body = { email: 'user@test.com', disabled: false };
        mockAdmin.auth.mockReturnValue({
            getUserByEmail: jest.fn().mockRejectedValue(new Error('Firebase Error'))
        });
        await toggleUserStatus(req, res);
        expect(mockSendApiResult).toHaveBeenCalledWith(res, 500, expect.stringContaining('Firebase Error'));
    });
});

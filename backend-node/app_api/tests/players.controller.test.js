const mongoose = require('mongoose');
require('../models/players');
const { sendApiResult } = require('../controllers/apiResult');
const playersCtrl = require('../controllers/players');

// Mockear apiResult
jest.mock('../controllers/apiResult', () => ({
    sendApiResult: jest.fn()
}));

describe('Players Controller Edge Cases', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            params: {},
            query: {},
            body: {},
            user: { firebaseUid: 'uid123', role: 'user', _id: 'mongo123' },
            log: jest.fn()
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('playersPublicList', () => {
        test('catches error and returns 500', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'find').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });

            await playersCtrl.playersPublicList(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error en vista pública: DB Error');
        });
    });

    describe('playersList', () => {
        test('returns 401 if user is missing', async () => {
            mockReq.user = null;
            await playersCtrl.playersList(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 401, 'No se pudo identificar al usuario activo');
        });

        test('applies name filter', async () => {
            mockReq.query.name = 'Messi';
            const Player = mongoose.model('Player');
            const findSpy = jest.spyOn(Player, 'find').mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
            });
            await playersCtrl.playersList(mockReq, mockRes);
            expect(findSpy).toHaveBeenCalledWith({ user_id: 'uid123', name: { $regex: 'Messi', $options: 'i' } });
        });

        test('applies team filter', async () => {
            mockReq.query.team = 'Barca';
            const Player = mongoose.model('Player');
            const findSpy = jest.spyOn(Player, 'find').mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
            });
            await playersCtrl.playersList(mockReq, mockRes);
            expect(findSpy).toHaveBeenCalledWith({ user_id: 'uid123', team: { $regex: 'Barca', $options: 'i' } });
        });

        test('catches error and returns 500', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'find').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await playersCtrl.playersList(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al listar jugadores: DB Error');
        });
    });

    describe('playersListAll', () => {
        test('catches error and returns 500', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'find').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await playersCtrl.playersListAll(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al recuperar todos los jugadores: DB Error');
        });
    });

    describe('playersReadOne', () => {
        test('catches error and returns 500', async () => {
            mockReq.params.playerid = 'invalid_id';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await playersCtrl.playersReadOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al buscar el jugador: DB Error');
        });
    });

    describe('playersUpdateOne', () => {
        test('returns 404 if player not found', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await playersCtrl.playersUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'No se encontró el jugador para actualizar');
        });

        test('returns 403 if not owner and not admin', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue({ user_id: 'other_uid', save: jest.fn() })
            });
            await playersCtrl.playersUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 403, 'Acceso denegado: No tienes permiso para editar este jugador');
        });

        test('catches error and returns 400', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await playersCtrl.playersUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 400, 'Error al actualizar el jugador: DB Error');
        });
    });

    describe('playersDeleteOne', () => {
        test('returns 404 if player not found', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await playersCtrl.playersDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'No se encontró el jugador para borrar');
        });

        test('returns 403 if not owner and not admin', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue({ user_id: 'other_uid', deleteOne: jest.fn() })
            });
            await playersCtrl.playersDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 403, 'Acceso denegado: No tienes permisos para eliminar este jugador');
        });

        test('catches error and returns 500', async () => {
            mockReq.params.playerid = '123';
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await playersCtrl.playersDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al borrar el jugador: DB Error');
        });
    });
});

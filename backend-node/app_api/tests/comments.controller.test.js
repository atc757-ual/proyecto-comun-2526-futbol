const mongoose = require('mongoose');
require('../models/players');
const { sendApiResult } = require('../controllers/apiResult');
const commentsCtrl = require('../controllers/comments');

jest.mock('../controllers/apiResult', () => ({
    sendApiResult: jest.fn()
}));

describe('Comments Controller Edge Cases', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            params: { playerid: '123', commentid: 'abc' },
            body: { content: 'test comment' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('commentsCreate', () => {
        test('returns 404 if player not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await commentsCtrl.commentsCreate(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Jugador no encontrado');
        });

        test('catches error and returns 400', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await commentsCtrl.commentsCreate(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 400, 'Error al añadir comentario: DB Error');
        });
    });

    describe('commentsReadOne', () => {
        test('returns 404 if player not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null)
            });
            await commentsCtrl.commentsReadOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Jugador no encontrado');
        });

        test('returns 404 if comment not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue({ comments: { id: jest.fn().mockReturnValue(null) } })
            });
            await commentsCtrl.commentsReadOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Comentario no encontrado');
        });

        test('catches error and returns 500', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await commentsCtrl.commentsReadOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al leer comentario: DB Error');
        });
    });

    describe('commentsDeleteOne', () => {
        test('returns 404 if player not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await commentsCtrl.commentsDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Jugador no encontrado');
        });

        test('returns 404 if comment not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue({ comments: { id: jest.fn().mockReturnValue(null) } })
            });
            await commentsCtrl.commentsDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Comentario no encontrado para borrar');
        });

        test('catches error and returns 500', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await commentsCtrl.commentsDeleteOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 500, 'Error al borrar comentario: DB Error');
        });
    });

    describe('commentsUpdateOne', () => {
        test('returns 404 if player not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await commentsCtrl.commentsUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Jugador no encontrado');
        });

        test('returns 404 if comment not found', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockReturnValue({
                exec: jest.fn().mockResolvedValue({ comments: { id: jest.fn().mockReturnValue(null) } })
            });
            await commentsCtrl.commentsUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 404, 'Comentario no encontrado para actualizar');
        });

        test('catches error and returns 400', async () => {
            const Player = mongoose.model('Player');
            jest.spyOn(Player, 'findById').mockImplementationOnce(() => {
                throw new Error('DB Error');
            });
            await commentsCtrl.commentsUpdateOne(mockReq, mockRes);
            expect(sendApiResult).toHaveBeenCalledWith(mockRes, 400, 'Error al actualizar comentario: DB Error');
        });
    });
});

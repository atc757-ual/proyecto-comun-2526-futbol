const mockPlayerModel = {
  findById: jest.fn()
};

const mockSendApiResult = jest.fn();

jest.mock('mongoose', () => ({
  model: jest.fn(() => mockPlayerModel)
}));

jest.mock('../controllers/apiResult', () => ({ sendApiResult: mockSendApiResult }));

const { publicCommentsCreate } = require('../controllers/public-comments');

describe('Public comments controller (unit)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { playerid: 'player-id-1' },
      body: { content: 'Gran jugador', rating: 5, autor_name: 'Invitado' }
    };
    res = {};
  });

  test('returns 404 when player does not exist', async () => {
    mockPlayerModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await publicCommentsCreate(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(res, 404, 'Jugador no encontrado');
  });

  test('creates public comment and returns 201', async () => {
    const playerDoc = {
      comments: { push: jest.fn() },
      save: jest.fn().mockResolvedValue({ comments: [{ _id: 'c1', content: 'Gran jugador', rating: 5, autor_name: 'Invitado' }] })
    };

    mockPlayerModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(playerDoc) });

    await publicCommentsCreate(req, res);

    expect(playerDoc.comments.push).toHaveBeenCalledWith(expect.objectContaining({ content: 'Gran jugador' }));
    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      201,
      expect.stringContaining('publicada'),
      expect.objectContaining({ content: 'Gran jugador' })
    );
  });

  test('returns 400 when save fails', async () => {
    const playerDoc = {
      comments: { push: jest.fn() },
      save: jest.fn().mockRejectedValue(new Error('validation failed'))
    };

    mockPlayerModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(playerDoc) });

    await publicCommentsCreate(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      400,
      expect.stringContaining('Error al publicar en la comunidad')
    );
  });
});
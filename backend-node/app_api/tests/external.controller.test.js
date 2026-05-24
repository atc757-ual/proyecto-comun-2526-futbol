// backend-node/app_api/tests/external.controller.full.test.js
/**
 * Pruebas de cobertura completa para el controlador externo (TSDB).
 * Se mockean todas las funciones del servicio `thesportsdb.service` y se verifica
 * que cada ruta devuelva 200 en caso de éxito y 500 en caso de error.
 */

jest.mock('../services/thesportsdb.service', () => ({
  searchPlayers: jest.fn(),
  getPlayerDetails: jest.fn(),
  getTeamDetails: jest.fn(),
  getLeagueDetails: jest.fn(),
  searchTeams: jest.fn(),
  getPlayersByTeam: jest.fn(),
  searchPlayersByTeam: jest.fn(),
  searchLeagues: jest.fn(),
  getLiveScores: jest.fn(),
  getTeamsByLeague: jest.fn(),
  getPlayerTeamsHistory: jest.fn(),
  getPlayerHonours: jest.fn(),
  getPlayerMilestones: jest.fn(),
  getTVByCountry: jest.fn(),
}));

const tsdbService = require('../services/thesportsdb.service');
const { 
  searchTSDBPlayers,
  getTSDBPlayerDetails,
  getTSDBTeamDetails,
  getTSDBLeagueDetails,
  searchTSDBTeams,
  getTSDBPlayersByTeam,
  searchTSDBPlayersByTeam,
  searchTSDBLeagues,
  getTSDBLiveScores,
  getTSDBTeamsByLeague,
  getTSDBPlayerTeams,
  getTSDBPlayerHonours,
  getTSDBPlayerMilestones,
  getTSDBTVByCountry,
} = require('../controllers/external.controller');

// Helper to create a mock response object
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('External Controller - TSDB endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const successData = { dummy: 'data' };
  const error = new Error('Service failure');

  // Generic test generator for success & error cases
  const testEndpoint = (name, controllerFn, mockFn, reqFactory) => {
    test(`${name} - success 200`, async () => {
      mockFn.mockResolvedValueOnce(successData);
      const req = reqFactory();
      const res = mockRes();
      await controllerFn(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: successData }));
    });

    test(`${name} - error 500`, async () => {
      mockFn.mockRejectedValueOnce(error);
      const req = reqFactory();
      const res = mockRes();
      await controllerFn(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.any(Object) }));
    });
  };

  // 1. searchTSDBPlayers (query param required)
  testEndpoint(
    'searchTSDBPlayers',
    searchTSDBPlayers,
    tsdbService.searchPlayers,
    () => ({ query: { name: 'Messi' } })
  );

  // 2. getTSDBPlayerDetails (param id)
  testEndpoint(
    'getTSDBPlayerDetails',
    getTSDBPlayerDetails,
    tsdbService.getPlayerDetails,
    () => ({ params: { id: '123' } })
  );

  // 3. getTSDBTeamDetails
  testEndpoint(
    'getTSDBTeamDetails',
    getTSDBTeamDetails,
    tsdbService.getTeamDetails,
    () => ({ params: { id: 'team1' } })
  );

  // 4. getTSDBLeagueDetails
  testEndpoint(
    'getTSDBLeagueDetails',
    getTSDBLeagueDetails,
    tsdbService.getLeagueDetails,
    () => ({ params: { id: 'league1' } })
  );

  // 5. searchTSDBTeams
  testEndpoint(
    'searchTSDBTeams',
    searchTSDBTeams,
    tsdbService.searchTeams,
    () => ({ query: { name: 'Barcelona' } })
  );

  // 6. getTSDBPlayersByTeam
  testEndpoint(
    'getTSDBPlayersByTeam',
    getTSDBPlayersByTeam,
    tsdbService.getPlayersByTeam,
    () => ({ params: { id: 'teamX' } })
  );

  // 7. searchTSDBPlayersByTeam
  testEndpoint(
    'searchTSDBPlayersByTeam',
    searchTSDBPlayersByTeam,
    tsdbService.searchPlayersByTeam,
    () => ({ query: { team: 'Madrid' } })
  );

  // 8. searchTSDBLeagues
  testEndpoint(
    'searchTSDBLeagues',
    searchTSDBLeagues,
    tsdbService.searchLeagues,
    () => ({ query: { name: 'Premier' } })
  );

  // 9. getTSDBLiveScores (no params)
  test('getTSDBLiveScores - success 200', async () => {
    tsdbService.getLiveScores.mockResolvedValueOnce(successData);
    const req = {};
    const res = mockRes();
    await getTSDBLiveScores(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: successData }));
  });

  test('getTSDBLiveScores - error 500', async () => {
    tsdbService.getLiveScores.mockRejectedValueOnce(error);
    const req = {};
    const res = mockRes();
    await getTSDBLiveScores(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // 10. getTSDBTeamsByLeague
  testEndpoint(
    'getTSDBTeamsByLeague',
    getTSDBTeamsByLeague,
    tsdbService.getTeamsByLeague,
    () => ({ params: { id: 'leagueX' } })
  );

  // 11. getTSDBPlayerTeams
  testEndpoint(
    'getTSDBPlayerTeams',
    getTSDBPlayerTeams,
    tsdbService.getPlayerTeamsHistory,
    () => ({ params: { id: 'playerX' } })
  );

  // 12. getTSDBPlayerHonours
  testEndpoint(
    'getTSDBPlayerHonours',
    getTSDBPlayerHonours,
    tsdbService.getPlayerHonours,
    () => ({ params: { id: 'playerY' } })
  );

  // 13. getTSDBPlayerMilestones
  testEndpoint(
    'getTSDBPlayerMilestones',
    getTSDBPlayerMilestones,
    tsdbService.getPlayerMilestones,
    () => ({ params: { id: 'playerZ' } })
  );

  // 14. getTSDBTVByCountry
  testEndpoint(
    'getTSDBTVByCountry',
    getTSDBTVByCountry,
    tsdbService.getTVByCountry,
    () => ({ params: { country: 'Spain' } })
  );
});

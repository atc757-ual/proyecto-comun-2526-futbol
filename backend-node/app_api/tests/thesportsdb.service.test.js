// backend-node/app_api/tests/thesportsdb.service.fullCoverage2.test.js
/*
  Comprehensive test suite for thesportsdb.service.js (full coverage).
  Includes success paths, null responses, error propagation, and sorting logic.
*/

const axios = require('axios');
const tsdbService = require('../services/thesportsdb.service');

// Mock opossum circuit breaker
jest.mock('opossum', () => {
  const mockInst = { fire: jest.fn(), fallback: jest.fn(), on: jest.fn() };
  const Mock = jest.fn(() => mockInst);
  Mock.__instance = mockInst;
  return Mock;
});

const opossum = require('opossum');
const breaker = opossum.__instance;

beforeEach(() => {
  jest.clearAllMocks();
  // ensure a fresh mock for each test
  breaker.fire = jest.fn();
});

describe('thesportsdb.service – full coverage 2', () => {
  // helpers
  const mockFireSuccess = (data) => breaker.fire.mockResolvedValueOnce({ data });
  const mockFireReject = (msg) => breaker.fire.mockRejectedValueOnce(new Error(msg));

  // ---------- searchPlayers ----------
  test('searchPlayers filters only soccer players', async () => {
    mockFireSuccess({ search: [
      { idPlayer: '1', strSport: 'Soccer', strPlayer: 'A' },
      { idPlayer: '2', strSport: 'Baseball', strPlayer: 'B' }
    ] });
    const result = await tsdbService.searchPlayers('test');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ strSport: 'Soccer' });
  });

  test('searchPlayers returns [] when API returns null', async () => {
    mockFireSuccess({ search: null });
    const result = await tsdbService.searchPlayers('none');
    expect(result).toEqual([]);
  });

  // ---------- getPlayerDetails ----------
  test('getPlayerDetails returns null when lookup is null', async () => {
    mockFireSuccess({ lookup: null });
    const result = await tsdbService.getPlayerDetails('123');
    expect(result).toBeNull();
  });

  test('getPlayerDetails maps player fields correctly', async () => {
    mockFireSuccess({ lookup: [{ idPlayer: '5', strPlayer: 'John', strSport: 'Soccer' }] });
    const result = await tsdbService.getPlayerDetails('5');
    expect(result).toMatchObject({ idPlayer: '5', strPlayer: 'John' });
  });

  // ---------- getTeamDetails ----------
  test('getTeamDetails returns null when lookup is null', async () => {
    mockFireSuccess({ lookup: null });
    const result = await tsdbService.getTeamDetails('200');
    expect(result).toBeNull();
  });

  test('getTeamDetails maps team fields', async () => {
    mockFireSuccess({ lookup: [{ idTeam: '200', strTeam: 'TeamX', strSport: 'Soccer' }] });
    const result = await tsdbService.getTeamDetails('200');
    expect(result).toMatchObject({ idTeam: '200', strTeam: 'TeamX' });
  });

  // ---------- getLeagueDetails ----------
  test('getLeagueDetails returns null when lookup is null', async () => {
    mockFireSuccess({ lookup: null });
    const result = await tsdbService.getLeagueDetails('300');
    expect(result).toBeNull();
  });

  test('getLeagueDetails maps league fields', async () => {
    mockFireSuccess({ lookup: [{ idLeague: '300', strLeague: 'LigaX', strSport: 'Soccer' }] });
    const result = await tsdbService.getLeagueDetails('300');
    expect(result).toMatchObject({ idLeague: '300', strLeague: 'LigaX' });
  });

  // ---------- searchTeams ----------
  test('searchTeams filters only soccer teams', async () => {
    mockFireSuccess({ search: [
      { idTeam: 't1', strSport: 'Soccer', strTeam: 'TeamA' },
      { idTeam: 't2', strSport: 'Rugby', strTeam: 'TeamB' }
    ] });
    const result = await tsdbService.searchTeams('test');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ strSport: 'Soccer' });
  });

  test('searchTeams returns [] when response.search is null', async () => {
    mockFireSuccess({ search: null });
    const result = await tsdbService.searchTeams('none');
    expect(result).toEqual([]);
  });

  // ---------- searchPlayersByTeam ----------
  test('searchPlayersByTeam filters soccer players', async () => {
    mockFireSuccess({ search: [
      { idPlayer: 'p1', strSport: 'Soccer', strTeam: 'TeamA' },
      { idPlayer: 'p2', strSport: 'Baseball', strTeam: 'TeamA' }
    ] });
    const result = await tsdbService.searchPlayersByTeam('TeamA');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ strSport: 'Soccer' });
  });

  test('searchPlayersByTeam returns [] when no data', async () => {
    mockFireSuccess({ search: null });
    const result = await tsdbService.searchPlayersByTeam('TeamX');
    expect(result).toEqual([]);
  });

  // ---------- getTeamsByLeague ----------
  test('getTeamsByLeague returns list of teams', async () => {
    mockFireSuccess({ list: [
      { idTeam: 't1', strTeam: 'A' },
      { idTeam: 't2', strTeam: 'B' }
    ] });
    const result = await tsdbService.getTeamsByLeague('100');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ idTeam: 't1', strTeam: 'A' });
  });

  // ---------- getPlayersByTeam ----------
  test('getPlayersByTeam returns list of players', async () => {
    mockFireSuccess({ list: [
      { idPlayer: 'p1', strTeam: 'X' },
      { idPlayer: 'p2', strTeam: 'X' }
    ] });
    const result = await tsdbService.getPlayersByTeam('10');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ idPlayer: 'p1', strTeam: 'X' });
  });

  // ---------- searchLeagues ----------
  test('searchLeagues filters only soccer leagues', async () => {
    mockFireSuccess({ search: [
      { idLeague: 'l1', strSport: 'Soccer', strLeague: 'Liga1' },
      { idLeague: 'l2', strSport: 'Cricket', strLeague: 'Liga2' }
    ] });
    const result = await tsdbService.searchLeagues('any');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ strSport: 'Soccer' });
  });

  test('searchLeagues returns [] when response.search is null', async () => {
    mockFireSuccess({ search: null });
    const result = await tsdbService.searchLeagues('none');
    expect(result).toEqual([]);
  });

  // ---------- getPlayerHonours (sorting) ----------
  test('getPlayerHonours sorts honours by season descending', async () => {
    mockFireSuccess({ lookup: [
      { strHonour: 'Cup A', strSeason: '2020' },
      { strHonour: 'Cup B', strSeason: '2022' },
      { strHonour: 'Cup C', strSeason: '2021' }
    ] });
    const result = await tsdbService.getPlayerHonours('5');
    expect(result.map(r => r.strSeason)).toEqual(['2022', '2021', '2020']);
  });

  // ---------- getPlayerMilestones (sorting) ----------
  test('getPlayerMilestones sorts milestones by season descending', async () => {
    mockFireSuccess({ lookup: [
      { strMilestone: 'M1', dateMilestone: '2019-05-01' },
      { strMilestone: 'M2', dateMilestone: '2021-08-15' },
      { strMilestone: 'M3', dateMilestone: '2020-03-10' }
    ] });
    const result = await tsdbService.getPlayerMilestones('5');
    expect(result.map(r => r.strSeason)).toEqual(['2021', '2020', '2019']);
  });

  // ---------- getPlayerTeamsHistory (sorting) ----------
  test('getPlayerTeamsHistory sorts history by start year descending', async () => {
    mockFireSuccess({ lookup: [
      { strFormerTeam: 'A', strJoined: '2015', strDeparted: '2018' },
      { strFormerTeam: 'B', strJoined: '2020', strDeparted: null },
      { strFormerTeam: 'C', strJoined: '2010', strDeparted: '2014' }
    ] });
    const result = await tsdbService.getPlayerTeamsHistory('5');
    expect(result.map(r => r.strTeam)).toEqual(['B', 'A', 'C']);
  });

  // ---------- getTVByCountry ----------
  test('getTVByCountry filters soccer events', async () => {
    mockFireSuccess({ results: [
      { strSport: 'Soccer', strEvent: 'Match1' },
      { strSport: 'Baseball', strEvent: 'Match2' }
    ] });
    const result = await tsdbService.getTVByCountry('Spain');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ strSport: 'Soccer' });
  });

  test('getTVByCountry returns [] when no results', async () => {
    mockFireSuccess({ results: null });
    const result = await tsdbService.getTVByCountry('Nowhere');
    expect(result).toEqual([]);
  });

  // ---------- getLiveScores ----------
  test('getLiveScores returns livescore array', async () => {
    mockFireSuccess({ livescore: [
      { match: 'A vs B' },
      { match: 'C vs D' }
    ] });
    const result = await tsdbService.getLiveScores();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ match: 'A vs B' });
  });

  // ---------- error propagation for every function ----------
  const errorFunctions = [
    ['searchPlayers', () => tsdbService.searchPlayers('err')],
    ['getPlayerDetails', () => tsdbService.getPlayerDetails('err')],
    ['getTeamDetails', () => tsdbService.getTeamDetails('err')],
    ['getLeagueDetails', () => tsdbService.getLeagueDetails('err')],
    ['searchTeams', () => tsdbService.searchTeams('err')],
    ['searchPlayersByTeam', () => tsdbService.searchPlayersByTeam('err')],
    ['getTeamsByLeague', () => tsdbService.getTeamsByLeague('err')],
    ['getPlayersByTeam', () => tsdbService.getPlayersByTeam('err')],
    ['searchLeagues', () => tsdbService.searchLeagues('err')],
    ['getPlayerHonours', () => tsdbService.getPlayerHonours('err')],
    ['getPlayerMilestones', () => tsdbService.getPlayerMilestones('err')],
    ['getPlayerTeamsHistory', () => tsdbService.getPlayerTeamsHistory('err')],
    ['getTVByCountry', () => tsdbService.getTVByCountry('err')],
    ['getLiveScores', () => tsdbService.getLiveScores('err')]
  ];

  test.each(errorFunctions)('throws on breaker error for %s', async (name, fn) => {
    mockFireReject('breaker error');
    await expect(fn()).rejects.toThrow('breaker error');
  });
});

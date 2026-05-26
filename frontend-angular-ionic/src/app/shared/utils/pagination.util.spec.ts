import { filterPlayersByTerm, buildPageNumbers } from './pagination.util';
import { Player } from '../../core/models/player.model';

const players: Player[] = [
  { _id: '1', name: 'Lionel Messi', team: 'Inter Miami', league: 'MLS', nationality: 'Argentina' } as Player,
  { _id: '2', name: 'Cristiano Ronaldo', team: 'Al Nassr', league: 'Saudi Pro', nationality: 'Portugal' } as Player,
  { _id: '3', name: 'Pedri', team: 'FC Barcelona', league: 'LaLiga', nationality: 'España' } as Player,
];

describe('filterPlayersByTerm', () => {
  it('should return all players when term is empty', () => {
    expect(filterPlayersByTerm(players, '').length).toBe(3);
  });

  it('should filter by name (case insensitive)', () => {
    const res = filterPlayersByTerm(players, 'messi');
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Lionel Messi');
  });

  it('should filter by team', () => {
    const res = filterPlayersByTerm(players, 'barcelona');
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Pedri');
  });

  it('should filter by league', () => {
    const res = filterPlayersByTerm(players, 'laliga');
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Pedri');
  });

  it('should filter by nationality', () => {
    const res = filterPlayersByTerm(players, 'portugal');
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Cristiano Ronaldo');
  });

  it('should return empty array when no match', () => {
    expect(filterPlayersByTerm(players, 'zzz').length).toBe(0);
  });
});

describe('buildPageNumbers', () => {
  it('should return all pages when total <= maxVisible', () => {
    expect(buildPageNumbers(3, 1)).toEqual([1, 2, 3]);
  });

  it('should return maxVisible pages when total > maxVisible', () => {
    const pages = buildPageNumbers(10, 1);
    expect(pages.length).toBe(5);
    expect(pages[0]).toBe(1);
  });

  it('should center window around current page', () => {
    const pages = buildPageNumbers(10, 5);
    expect(pages).toContain(5);
    expect(pages.length).toBe(5);
  });

  it('should not exceed total pages', () => {
    const pages = buildPageNumbers(10, 10);
    expect(pages[pages.length - 1]).toBe(10);
  });

  it('should return single page [1] for total=1', () => {
    expect(buildPageNumbers(1, 1)).toEqual([1]);
  });
});

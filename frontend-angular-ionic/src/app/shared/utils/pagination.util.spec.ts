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

  it('should return empty array when no match', () => {
    expect(filterPlayersByTerm(players, 'zzz').length).toBe(0);
  });

  [
    { term: 'messi',     expectedName: 'Lionel Messi',      field: 'name'        },
    { term: 'barcelona', expectedName: 'Pedri',             field: 'team'        },
    { term: 'laliga',    expectedName: 'Pedri',             field: 'league'      },
    { term: 'portugal',  expectedName: 'Cristiano Ronaldo', field: 'nationality' },
  ].forEach(({ term, expectedName, field }) => {
    it(`should filter by ${field} (case insensitive)`, () => {
      const res = filterPlayersByTerm(players, term);
      expect(res.length).toBe(1);
      expect(res[0].name).toBe(expectedName);
    });
  });
});

describe('buildPageNumbers', () => {
  it('should return all pages when total <= maxVisible', () => {
    expect(buildPageNumbers(3, 1)).toEqual([1, 2, 3]);
  });

  it('should return single page [1] for total=1', () => {
    expect(buildPageNumbers(1, 1)).toEqual([1]);
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
});

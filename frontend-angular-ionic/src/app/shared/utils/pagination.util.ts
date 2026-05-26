import { Player } from '../../core/models/player.model';

export function filterPlayersByTerm(players: Player[], searchTerm: string): Player[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return players;

  return players.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(term);
    const teamMatch = p.team?.toLowerCase().includes(term);
    const leagueMatch = p.league?.toLowerCase().includes(term);
    const countryMatch = p.nationality?.toLowerCase().includes(term);

    let dateMatch = false;
    if (p.created_at) {
      const date = new Date(p.created_at);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      dateMatch = `${day}/${month}/${year}`.includes(term);
    }

    return nameMatch || teamMatch || leagueMatch || countryMatch || dateMatch;
  });
}

export function buildPageNumbers(total: number, current: number, maxVisible = 5): number[] {
  const pages: number[] = [];
  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    let start = Math.max(current - 2, 1);
    let end = Math.min(start + maxVisible - 1, total);
    if (end === total) start = Math.max(end - maxVisible + 1, 1);
    for (let i = start; i <= end; i++) pages.push(i);
  }
  return pages;
}

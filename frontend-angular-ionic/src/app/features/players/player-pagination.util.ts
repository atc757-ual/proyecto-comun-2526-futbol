import { computed, Signal } from '@angular/core';
import { Player } from '../../core/models/player.model';

export function createTotalPages(
  filteredPlayers: Signal<Player[]>,
  itemsPerPage: Signal<number>
) {
  return computed(() => Math.ceil(filteredPlayers().length / itemsPerPage()));
}

export function createPagedPlayers(
  filteredPlayers: Signal<Player[]>,
  currentPage: Signal<number>,
  itemsPerPage: Signal<number>
) {
  return computed(() => {
    const start = (currentPage() - 1) * itemsPerPage();
    return filteredPlayers().slice(start, start + itemsPerPage());
  });
}

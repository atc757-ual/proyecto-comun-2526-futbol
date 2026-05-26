import { inject, signal, computed } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/players/player.service.token';
import { Player } from '../../core/models/player.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { LayoutService } from '../../core/services/ui/layout.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { buildPageNumbers } from '../../shared/utils/pagination.util';

export abstract class PlayerListBase {
  protected readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  protected readonly authService = inject(AuthService);
  protected readonly layoutService = inject(LayoutService);
  protected readonly modalCtrl = inject(ModalController);
  protected readonly toastService = inject(ToastService);

  protected _allPlayers = signal<Player[]>([]);
  protected searchTerm = signal<string>('');
  protected isLoading = signal<boolean>(false);
  protected isAdmin = false;

  protected currentPage = signal<number>(1);
  protected itemsPerPage = signal<number>(8);
  protected totalPlayersCount = signal<number>(0);

  protected filteredPlayers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const players = this._allPlayers();

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
  });

  protected totalPages = computed(() =>
    Math.ceil(this.filteredPlayers().length / this.itemsPerPage())
  );

  protected pagedPlayers = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredPlayers().slice(start, start + this.itemsPerPage());
  });

  onSearchChange(event: { detail: { value?: string | null } }) {
    this.searchTerm.set(event.detail.value || '');
    this.currentPage.set(1);
  }

  onClear() {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadPlayers();
  }

  clearFilters() {
    this.onClear();
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPages(): number[] {
    return buildPageNumbers(this.totalPages(), this.currentPage());
  }

  abstract loadPlayers(event?: any): void;

  async deletePlayer(player: Player) {
    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar jugador?',
        message: `Estás a punto de borrar a "${player.name}". Esta acción no se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'No, cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data === true) {
      this.executeDeletion(player._id!);
    }
  }

  protected executeDeletion(id: string) {
    this.playerService.deletePlayer(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Jugador eliminado correctamente');
        this.loadPlayers();
      },
      error: () => {
        this.toastService.showError('Error al eliminar el jugador');
      }
    });
  }

  handleImageError(event: any) {
    event.target.onerror = null;
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgODAwIDgwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiM0NzU1NjkiPjQwNDwvdGV4dD48L3N2Zz4=';
  }

  trackByPlayerId(index: number, player: Player): string | number {
    return player._id ?? player.external_id ?? String(index);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

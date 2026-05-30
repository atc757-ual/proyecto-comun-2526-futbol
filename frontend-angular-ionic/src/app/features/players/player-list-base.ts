import { inject, signal, computed } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/players/player.service.token';
import { Player } from '../../core/models/player.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { LayoutService } from '../../core/services/ui/layout.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { buildPageNumbers, filterPlayersByTerm } from '../../shared/utils/pagination.util';

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
    const filtered = filterPlayersByTerm(this._allPlayers(), this.searchTerm());
    return filtered.sort((a, b) => {
      const aFav = a.isFavorite || a.is_favorite ? 1 : 0;
      const bFav = b.isFavorite || b.is_favorite ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
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

  getPlayerImage(url: string | null | undefined): string {
    if (!url || url.includes('dummyimage.com')) return 'assets/img/placeholder.jpg';
    return url;
  }

  handleImageError(event: any) {
    event.target.onerror = null;
    event.target.src = 'assets/img/placeholder.jpg';
  }

  trackByPlayerId(index: number, player: Player): string | number {
    return player._id ?? player.external_id ?? String(index);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

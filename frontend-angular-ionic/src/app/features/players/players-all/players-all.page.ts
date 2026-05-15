import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSearchbar, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonThumbnail, ModalController, ToastController,
  IonBadge
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline, filterOutline, personOutline, happyOutline,
  thumbsUpOutline, sadOutline, shieldOutline, searchOutline, trashOutline, createOutline,
  personAddOutline, optionsOutline, flagOutline, chevronForwardOutline, calendarOutline, settingsOutline,
  closeCircleOutline, closeCircle, chevronBackOutline, eyeOutline, alertCircleOutline, checkmarkCircleOutline, checkmarkCircle,
  peopleOutline, homeOutline, closeOutline
} from 'ionicons/icons';
import { PlayerService, Player } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-players-all',
  templateUrl: './players-all.page.html',
  styleUrls: ['./players-all.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonThumbnail, IonBadge
  ]
})
export class PlayersAllPage implements OnInit {
  private playerService = inject(PlayerService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  // --- SIGNALS DE ESTADO ---
  private _allPlayers = signal<Player[]>([]);
  public searchTerm = signal<string>('');
  public isLoading = signal<boolean>(false);
  public isAdmin = false;
  public focusedField: string | null = null;

  // Paginación con Signals
  public currentPage = signal<number>(1);
  public itemsPerPage = signal<number>(8);

  // Signal Computado para el total
  public totalPlayersCount = signal<number>(0);

  // Signal Computado para el total de páginas
  public totalPages = computed(() => {
    const total = this.filteredPlayers().length;
    return Math.ceil(total / this.itemsPerPage());
  });

  // Signal Computado para la lista filtrada
  public filteredPlayers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    
    // USAMOS SIGNALS para que sea reactivo
    const user = this.authService.currentUser();
    const userData = this.authService.userData();
    
    const fbUid = user?.uid;
    const mongoId = userData?._id || userData?.id;
    
    // Ya no filtramos por "isMine", los queremos todos
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
        const formattedDate = `${day}/${month}/${year}`;
        dateMatch = formattedDate.includes(term);
      }

      return nameMatch || teamMatch || leagueMatch || countryMatch || dateMatch;
    });
  });

  // Signal Computado para jugadores paginados
  public pagedPlayers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredPlayers().slice(startIndex, endIndex);
  });

  constructor() {
    addIcons({
      addOutline, filterOutline, personOutline, shieldOutline,
      searchOutline, trashOutline, createOutline, personAddOutline,
      optionsOutline, flagOutline, chevronForwardOutline, calendarOutline,
      settingsOutline, closeCircleOutline, closeCircle, chevronBackOutline, eyeOutline,
      alertCircleOutline, checkmarkCircleOutline, checkmarkCircle, happyOutline,
      thumbsUpOutline, sadOutline, peopleOutline, homeOutline, closeOutline
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Todos los Jugadores',
      subtitle: 'Explora la base de datos completa de futbolistas',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Todos los Jugadores' },
    ]);

    this.isAdmin = this.authService.isAdmin();
    this.loadPlayers();
  }

  loadPlayers(event?: any) {
    if (!event) this.isLoading.set(true);

    this.playerService.getAllPlayers().subscribe({
      next: (data) => {
        this._allPlayers.set(data);
        this.totalPlayersCount.set(data.length);
        this.isLoading.set(false);
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading.set(false);
        if (event) event.target.complete();
      }
    });
  }

  onSearchChange(event: any) {
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
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

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

  async deletePlayer(player: Player) {
    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar jugador?',
        message: `Estás a punto de borrar a "${player.name}". Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar ahora',
        cancelText: 'Cancelar',
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

  private executeDeletion(id: string) {
    this.playerService.deletePlayer(id).subscribe({
      next: () => {
        this.showToast('Jugador eliminado correctamente', 'success', 'checkmark-circle-outline');
        this.loadPlayers();
      },
      error: () => {
        this.showToast('Error al eliminar el jugador', 'error', 'alert-circle-outline');
      }
    });
  }

  async showToast(message: string, type: 'success' | 'error', icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      icon: icon,
      cssClass: `toast-${type}`,
      buttons: [{ icon: icon, side: 'start', handler: () => { } }]
    });
    toast.present();
  }

  handleImageError(event: any) {
    event.target.src = 'assets/img/player-placeholder.png';
  }

  isMine(p: Player): boolean {
    const user = this.authService.currentUser();
    const userData = this.authService.userData();
    
    const fbUid = user?.uid;
    const mongoId = userData?._id || userData?.id;

    return p.user_id === fbUid || p.user_id === mongoId;
  }
}

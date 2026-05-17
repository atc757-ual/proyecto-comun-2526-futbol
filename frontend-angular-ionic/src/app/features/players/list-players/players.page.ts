import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSearchbar,
  IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonThumbnail, ModalController, ToastController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline, filterOutline, personOutline, happyOutline,
  thumbsUpOutline, sadOutline, shieldOutline, searchOutline, trashOutline, createOutline,
  personAddOutline, optionsOutline, flagOutline, chevronForwardOutline, calendarOutline, settingsOutline,
  closeCircleOutline, chevronBackOutline, eyeOutline, alertCircleOutline, checkmarkCircleOutline, peopleOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/player.service.token';
import { Player } from '../../../core/models/player.model';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-players',
  templateUrl: './players.page.html',
  styleUrls: ['./players.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonThumbnail
  ]
})
export class PlayersPage implements OnInit {
  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  // --- SIGNALS DE ESTADO ---
  // ... (rest of signals stay the same)
  private _allPlayers = signal<Player[]>([]);
  public searchTerm = signal<string>('');
  public isLoading = signal<boolean>(false);
  public isAdmin = false;
  public focusedField: string | null = null;

  // Paginación con Signals
  public currentPage = signal<number>(1);
  public itemsPerPage = signal<number>(8); // 8 por página para que la cuadrícula se vea bien

  // Signal Computado para el total (Readonly)
  public totalPlayersCount = signal<number>(0); // Se actualizará al cargar

  // Signal Computado para el total de páginas
  public totalPages = computed(() => {
    const total = this.filteredPlayers().length;
    return Math.ceil(total / this.itemsPerPage());
  });

  // Signal Computado (Readonly) que expone la lista filtrada por múltiples campos
  public filteredPlayers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const players = this._allPlayers();

    if (!term) return players;

    return players.filter(p => {
      // 1. Nombre
      const nameMatch = p.name?.toLowerCase().includes(term);
      // 2. Equipo o Liga
      const teamMatch = p.team?.toLowerCase().includes(term);
      const leagueMatch = p.league?.toLowerCase().includes(term);
      // 3. País (Nacionalidad)
      const countryMatch = p.nationality?.toLowerCase().includes(term);
      // 4. Fecha de creación (Formato dd/mm/yyyy)
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

  // Signal Computado que entrega solo los jugadores de la página actual
  public pagedPlayers = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredPlayers().slice(startIndex, endIndex);
  });

  public filters = {
    name: '',
    teamLeague: '',
    dateFrom: ''
  };

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.filters.dateFrom);
  }

  get availableLeagues(): string[] {
    const leagues = this._allPlayers()
      .map(p => p.league)
      .filter((l): l is string => !!l);
    return [...new Set(leagues)].sort();
  }

  constructor() {
    addIcons({
      addOutline,
      filterOutline,
      personOutline,
      shieldOutline,
      searchOutline,
      trashOutline,
      createOutline,
      personAddOutline,
      optionsOutline,
      flagOutline,
      chevronForwardOutline,
      calendarOutline,
      settingsOutline,
      closeCircleOutline,
      chevronBackOutline,
      eyeOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      happyOutline,
      thumbsUpOutline,
      sadOutline,
      peopleOutline
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Jugadores',
      subtitle: 'Gestiona y explora tu base de datos de futbolistas',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Jugadores' },
    ]);

    this.isAdmin = this.authService.isAdmin();
    this.loadPlayers();
  }

  loadPlayers(event?: any) {
    if (!event) this.isLoading.set(true);

    this.playerService.getPlayers().subscribe({
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

      if (end === total) {
        start = Math.max(end - maxVisible + 1, 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  onFilterClick() {
    console.log('Abrir filtros avanzados');
    // Aquí podrías abrir un modal o un panel lateral de filtros
  }

  setFocus(field: string | null) {
    this.focusedField = field;
  }

  applyFilters() {
    this.playerService.searchPlayers(this.filters).subscribe(data => {
      this._allPlayers.set(data);
    });
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
      position: 'top', // Ahora arriba
      icon: icon,     // Propiedad directa para asegurar visibilidad
      cssClass: `toast-${type}`,
      buttons: [{ icon: icon, side: 'start', handler: () => { } }]
    });
    toast.present();
  }

  handleImageError(event: any) {
    // Si la imagen falla, la ocultamos para que se vea el icono de fondo
    event.target.style.display = 'none';
  }
}

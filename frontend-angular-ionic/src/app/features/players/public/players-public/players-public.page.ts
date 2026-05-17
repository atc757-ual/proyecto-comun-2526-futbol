import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonSearchbar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonSpinner, IonLabel, IonItem, IonThumbnail,
  NavController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  personAddOutline, searchOutline, shieldOutline,
  eyeOutline, closeCircleOutline, chevronBackOutline,
  chevronForwardOutline, footballOutline, personOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/player.service.token';
import { Player } from '../../../../core/models/player.model';
import { LayoutService } from '../../../../core/services/layout.service';
import { PlatformService } from '../../../../core/services/platform.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-players-public',
  templateUrl: './players-public.page.html',
  styleUrls: ['./players-public.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonSearchbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonSpinner, IonLabel, IonItem, IonThumbnail
  ]
})
export class PlayersPublicPage implements OnInit {
  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private layoutService = inject(LayoutService);
  public platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);

  // Signals
  public _allPlayers = signal<Player[]>([]);
  public searchTerm = signal('');
  public isLoading = signal(true);
  public currentPage = signal(1);
  public itemsPerPage = 8;

  // Filtrado reactivo
  public filteredPlayers = computed(() => {
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
        const formattedDate = `${day}/${month}/${year}`;
        dateMatch = formattedDate.includes(term);
      }

      return nameMatch || teamMatch || leagueMatch || countryMatch || dateMatch;
    });
  });

  // Paginación reactiva
  public totalPages = computed(() => Math.ceil(this.filteredPlayers().length / this.itemsPerPage));

  public pagedPlayers = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPlayers().slice(start, end);
  });

  constructor() {
    addIcons({
      personAddOutline, searchOutline, shieldOutline,
      eyeOutline, closeCircleOutline, chevronBackOutline,
      chevronForwardOutline, footballOutline, personOutline
    });

    // Redirección reactiva
    effect(() => {
      if (this.authService.currentUser()) {
        console.warn('[PlayersPublic] Sesión detectada. Redirigiendo...');
        this.navCtrl.navigateRoot('/players');
      }
    });
  }

  ngOnInit() {
    // Si hay sesión iniciada, expulsamos al usuario a la lista privada
    if (this.authService.currentUser()) {
      console.warn('[PlayersPublic] Sesión activa detectada. Redirigiendo a Players.');
      this.navCtrl.navigateRoot('/players');
      return;
    }

    this.layoutService.setHeader({
      title: 'Nuestros jugadores',
      subtitle: 'Descubre el talento de nuestra base de datos pública',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: 'Login', url: '/login', icon: '' },
      { label: 'Jugadores', url: '' }
    ]);

    this.loadPlayers();
  }

  loadPlayers() {
    this.isLoading.set(true);
    this.playerService.getPublicPlayers().subscribe({
      next: (data) => {
        this._allPlayers.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.detail.value || '');
    this.currentPage.set(1);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  // Métodos de navegación
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  getPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    let start = Math.max(current - Math.floor(maxVisible / 2), 1);
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}

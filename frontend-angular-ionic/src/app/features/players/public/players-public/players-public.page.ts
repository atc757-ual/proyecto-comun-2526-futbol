import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonSearchbar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonIcon, IonSpinner, IonLabel, IonItem, IonThumbnail,
  NavController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  personAddOutline, searchOutline, shieldOutline,
  eyeOutline, closeCircleOutline, chevronBackOutline,
  chevronForwardOutline, footballOutline, personOutline,
  logInOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { Player } from '../../../../core/models/player.model';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { PlatformService } from '../../../../core/services/system/platform.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-players-public',
  templateUrl: './players-public.page.html',
  styleUrls: ['./players-public.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonSearchbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonIcon, IonSpinner, IonLabel, IonItem, IonThumbnail,
    PaginationComponent
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
      chevronForwardOutline, footballOutline, personOutline,
      logInOutline
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Nuestros jugadores',
      subtitle: 'Descubre el talento de nuestra base de datos pública',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/login', icon: 'log-in-outline' },
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

  goToPlayerDetail(playerId?: string) {
    if (!playerId) {
      return;
    }

    this.navCtrl.navigateForward(`/player-detail-public/${playerId}`);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }
}

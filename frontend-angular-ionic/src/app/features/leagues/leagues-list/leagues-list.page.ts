import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
  IonBadge, IonCard, IonCardContent, IonAvatar, IonThumbnail, IonGrid, IonRow, IonCol,
  IonToast, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, shieldOutline, personOutline, addOutline,
  chevronBackOutline, checkmarkCircleOutline, footballOutline,
  searchOutline, arrowBackOutline, closeOutline, checkmarkDoneOutline,
  closeCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, cloudDownloadOutline
} from 'ionicons/icons';
import { PlayerService } from '../../../core/services/player.service';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-leagues-list',
  templateUrl: './leagues-list.page.html',
  styleUrls: ['./leagues-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonItem, IonCheckbox, IonSpinner,
    IonBadge, IonCard, IonCardContent, IonAvatar, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonThumbnail, IonChip
  ]
})
export class LeaguesListPage implements OnInit {
  private playerService = inject(PlayerService);
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public searchType: 'player' | 'team' | 'league' = 'player';
  public apiSearchQuery = '';
  public leagueResults: any[] = [];
  public teamResults: any[] = [];
  public players: any[] = [];

  public selectedLeague: any = null;
  public selectedTeam: any = null;
  public selectedLeagueId: string | null = null;
  public selectedTeamId: string | null = null;
  public selectedPlayerIds: Set<string> = new Set<string>();

  public currentView: 'leagues' | 'teams' | 'players' = 'leagues';
  public isLoading = false;
  public isSearchingAutocomplete = false;
  public isImporting = false;
  public myPlayers: any[] = [];
  public showToast = false;
  public toastMessage = '';
  public toastColor: 'success' | 'danger' | 'warning' = 'success';
  public toastIcon: string = '';

  constructor() {
    addIcons({
      trophyOutline, shieldOutline, personOutline, addOutline,
      chevronBackOutline, checkmarkCircleOutline, footballOutline,
      searchOutline, arrowBackOutline, closeOutline,
      'close-circle-outline': closeCircleOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'cloud-download-outline': cloudDownloadOutline
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Centro de búsqueda',
      subtitle: 'Busca por liga, equipo o jugador y añádelo a tu lista',
      showHero: true
    });
    this.layoutService.setBreadcrumbs(
      [
        { label: '', url: '/home', icon: 'home-outline' },
        { label: 'Búsqueda', url: '', icon: 'search-outline' },
      ]
    );

    this.loadMyPlayers();
  }

  loadMyPlayers() {
    this.playerService.getPlayers().subscribe(data => this.myPlayers = data);
  }

  onSearchInput() {
    if (!this.apiSearchQuery || this.apiSearchQuery.length < 3) {
      this.leagueResults = [];
      this.teamResults = [];
      return;
    }

    if (this.searchType === 'league') {
      this.searchLeagues();
    } else if (this.searchType === 'team') {
      this.searchTeams();
    } else if (this.searchType === 'player') {
      this.searchPlayers();
    }
  }

  searchLeagues() {
    this.isSearchingAutocomplete = true;
    this.playerService.searchTSDBLeagues(this.apiSearchQuery).subscribe({
      next: (res) => {
        this.leagueResults = res;
        this.isSearchingAutocomplete = false;
      },
      error: () => this.isSearchingAutocomplete = false
    });
  }

  searchTeams() {
    this.isSearchingAutocomplete = true;
    this.playerService.searchTSDBTeams(this.apiSearchQuery).subscribe({
      next: (res) => {
        this.teamResults = res;
        this.isSearchingAutocomplete = false;
      },
      error: () => this.isSearchingAutocomplete = false
    });
  }

  searchPlayers() {
    this.isLoading = true;
    this.playerService.searchTSDBPlayers(this.apiSearchQuery).subscribe({
      next: (res) => {
        this.players = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
  isAlreadyAdded(playerName: string): boolean {
    if (!playerName) return false;
    return this.myPlayers.some(p => p.name.toLowerCase() === playerName.toLowerCase());
  }

  selectLeague(league: any) {
    this.selectedLeague = league;
    this.apiSearchQuery = '';
    this.leagueResults = [];
    this.isLoading = true;
    this.playerService.getTeamsByLeague(league.idLeague).subscribe({
      next: (res) => {
        this.teamResults = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  selectTeam(team: any) {
    this.selectedTeam = team;
    this.teamResults = [];
    this.apiSearchQuery = '';
    this.isLoading = true;
    this.playerService.getTSDBPlayersByTeam(team.idTeam).subscribe({
      next: (res) => {
        this.players = res.sort((a: any, b: any) => {
          const aInStaff = this.isAlreadyAdded(a.strPlayer);
          const bInStaff = this.isAlreadyAdded(b.strPlayer);
          if (aInStaff && !bInStaff) return 1;
          if (!aInStaff && bInStaff) return -1;
          return 0;
        });
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  clearAll() {
    this.apiSearchQuery = '';
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.players = [];
    this.leagueResults = [];
    this.teamResults = [];
  }

  goBack() {
    this.selectedLeagueId = null;
    this.selectedTeamId = null;
  }

  clearSelection() {
    this.selectedPlayerIds.clear();
    this.selectedPlayerIds = new Set();
  }

  togglePlayer(playerId: string) {
    if (this.selectedPlayerIds.has(playerId)) {
      this.selectedPlayerIds.delete(playerId);
    } else {
      this.selectedPlayerIds.add(playerId);
    }
    // IMPORTANTE: Disparar detección de cambios
    this.selectedPlayerIds = new Set(this.selectedPlayerIds);
  }

  selectAll() {
    if (this.selectedPlayerIds.size === this.players.length) {
      this.selectedPlayerIds.clear();
    } else {
      this.players.forEach(p => this.selectedPlayerIds.add(p.idPlayer));
    }
    this.selectedPlayerIds = new Set(this.selectedPlayerIds);
  }

  importPlayers() {
    if (this.selectedPlayerIds.size === 0) return;

    const playersToImport = this.players.filter(p => this.selectedPlayerIds.has(p.idPlayer));
    this.isImporting = true;

    let importedCount = 0;
    playersToImport.forEach(p => {
      const newPlayer = {
        name: p.strPlayer,
        team: this.selectedTeam?.strTeam || p.strTeam || 'Desconocido',
        secondary_team: p.strTeam2 || '',
        league: this.selectedLeague?.strLeague || 'Liga externa',
        position: p.strPosition || 'Desconocida',
        image_url: p.strCutout || p.strThumb,
        user_id: this.authService.currentUser()?.uid || 'manual',
        is_manual: false,
        nationality: p.strNationality,
        summary: p.strDescriptionES || p.strDescriptionEN || '',
        created_by: this.authService.currentUser()?.email || 'admin',
        updated_by: this.authService.currentUser()?.email || 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        tsdb_ids: {
          player_id: p.idPlayer,
          team_id: p.idTeam,
          team_id2: p.idTeam2,
          league_id: this.selectedLeague?.idLeague || p.idLeague
        }
      };

      this.playerService.addPlayer(newPlayer as any).subscribe(() => {
        importedCount++;
        if (importedCount === playersToImport.length) {
          this.finishImport();
        }
      });
    });
  }

  finishImport() {
    this.isImporting = false;
    this.fireConfetti();

    // Redirigir a la lista de jugadores con un mensaje de éxito
    setTimeout(() => {
      this.router.navigate(['/players']);
    }, 2000);
  }

  fireConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#002eff', '#ffffff', '#ffd700']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#002eff', '#ffffff', '#ffd700']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  handleImageError(event: any) {
    event.target.src = 'https://ui-avatars.com/api/?name=FT&background=1e88e5&color=ffffff&bold=true';
  }
}

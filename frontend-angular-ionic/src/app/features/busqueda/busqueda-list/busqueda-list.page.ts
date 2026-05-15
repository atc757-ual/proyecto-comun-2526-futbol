import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
  IonBadge, IonCard, IonCardContent, IonAvatar, IonThumbnail, IonSegment, IonSegmentButton, IonChip,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, shieldOutline, personOutline, addOutline,
  chevronBackOutline, checkmarkCircleOutline, footballOutline,
  searchOutline, arrowBackOutline, closeOutline, checkmarkDoneOutline,
  closeCircleOutline, closeCircle, chevronForwardOutline, chevronDownOutline,
  chevronUpOutline, cloudDownloadOutline, cloudUploadOutline, footstepsOutline,
  alertCircleOutline, peopleOutline
} from 'ionicons/icons';
import { PlayerService } from '../../../core/services/player.service';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-busqueda-list',
  templateUrl: './busqueda-list.page.html',
  styleUrls: ['./busqueda-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonItem, IonSpinner,
    IonBadge, IonCard, IonCardContent, IonAvatar, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonChip, IonCheckbox
  ]
})
export class BusquedaListPage implements OnInit {
  private playerService = inject(PlayerService);
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  public searchType: 'player' | 'team' | 'league' = 'player';
  public apiSearchQuery = '';
  public leagueResults: any[] = [];
  public teamResults: any[] = [];
  public players: any[] = [];

  public selectedLeague: any = null;
  public selectedTeam: any = null;

  // Usamos un Map para persistir los objetos de los jugadores seleccionados
  public selectedPlayers: Map<string, any> = new Map<string, any>();
  public isImporting = false;

  // Paginación Multivel
  public leaguePage = 1;
  public teamPage = 1;
  public playerPage = 1;
  public pageSize = 8;

  // Identifica qué lista estamos paginando actualmente
  get currentActiveList(): any[] {
    if (this.players.length > 0) return this.players;
    if (this.teamResults.length > 0 && (this.selectedLeague || this.searchType === 'team')) return this.teamResults;
    if (this.leagueResults.length > 0 && !this.selectedLeague) return this.leagueResults;
    return [];
  }

  get activePage(): number {
    if (this.players.length > 0) return this.playerPage;
    if (this.teamResults.length > 0 && (this.selectedLeague || this.searchType === 'team')) return this.teamPage;
    if (this.leagueResults.length > 0 && !this.selectedLeague) return this.leaguePage;
    return 1;
  }

  set activePage(val: number) {
    if (this.players.length > 0) this.playerPage = val;
    else if (this.teamResults.length > 0 && (this.selectedLeague || this.searchType === 'team')) this.teamPage = val;
    else if (this.leagueResults.length > 0 && !this.selectedLeague) this.leaguePage = val;
  }

  get pagedResults() {
    const start = (this.activePage - 1) * this.pageSize;
    return this.currentActiveList.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.currentActiveList.length / this.pageSize);
  }

  // Helpers Paginación
  nextPage() {
    if (this.activePage < this.totalPages) this.activePage++;
  }

  prevPage() {
    if (this.activePage > 1) this.activePage--;
  }

  goToPage(page: number) {
    this.activePage = page;
  }

  getPages(): number[] {
    const total = this.totalPages;
    if (total <= 1) return [];

    // Solo mostrar hasta 5 páginas
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, this.activePage - 2);
    let end = Math.min(total, start + 4);

    if (end === total) {
      start = Math.max(1, total - 4);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  public isLoading = false;
  public isSearchingAutocomplete = false;
  public myPlayers: any[] = [];

  constructor() {
    addIcons({
      trophyOutline, shieldOutline, personOutline, addOutline,
      chevronBackOutline, checkmarkCircleOutline, footballOutline,
      searchOutline, arrowBackOutline, closeOutline, closeCircle, footstepsOutline,
      closeCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline,
      checkmarkDoneOutline, cloudDownloadOutline, cloudUploadOutline, alertCircleOutline,
      peopleOutline
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Centro de búsqueda',
      subtitle: 'Busca por liga, equipo o jugador y añádelo a tu lista',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Búsqueda', url: '' },
    ]);
    this.loadMyPlayers();
  }

  loadMyPlayers() {
    this.playerService.getPlayers().subscribe(data => this.myPlayers = data);
  }

  onSearchInput() {
    // Si la query está vacía, no reseteamos todo, ya que podría ser un reset programático
    // tras seleccionar un equipo/liga. El botón de "X" (clear) ya llama a clearAll().
    if (!this.apiSearchQuery || this.apiSearchQuery.trim().length === 0) {
      return;
    }

    // Solo reseteamos selecciones si estamos escribiendo activamente
    // pero mantenemos el searchType
    this.players = [];
    this.leaguePage = 1;
    this.teamPage = 1;
    this.playerPage = 1;

    // Si el usuario empieza a escribir, invalidamos la selección actual
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.teamResults = [];

    if (this.apiSearchQuery.length < 3) {
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

  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'player': return 'Busca al próximo Balón de Oro...';
      case 'team': return 'Busca un club o equipo...';
      case 'league': return 'Busca una liga o competición...';
      default: return 'Escribe para buscar...';
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
    this.playerPage = 1;
    this.playerService.searchTSDBPlayers(this.apiSearchQuery).subscribe({
      next: (res) => {
        this.players = res.sort((a: any, b: any) => {
          const aInStaff = this.isAlreadyAdded(a.strPlayer);
          const bInStaff = this.isAlreadyAdded(b.strPlayer);
          if (!aInStaff && bInStaff) return -1;
          if (aInStaff && !bInStaff) return 1;
          return 0;
        });
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
    this.players = [];
    this.teamPage = 1;
    this.playerPage = 1;
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
    this.apiSearchQuery = '';
    this.players = [];
    this.playerPage = 1;
    this.isLoading = true;

    // Combinamos la plantilla oficial con una búsqueda por nombre de equipo para ser más exhaustivos
    forkJoin({
      official: this.playerService.getTSDBPlayersByTeam(team.idTeam).pipe(catchError(() => of([]))),
      search: this.playerService.searchTSDBPlayersByTeam(team.strTeam).pipe(catchError(() => of([])))
    }).subscribe({
      next: (results: any) => {
        console.log(`[DEBUG] Official: ${results.official.length}, Search: ${results.search.length}`);
        // Combinamos y eliminamos duplicados por idPlayer
        const combined = [...results.official, ...results.search];
        const unique = Array.from(new Map(combined.map(p => [p.idPlayer, p])).values());
        console.log(`[DEBUG] Unique players found: ${unique.length}`);

        this.players = unique.sort((a: any, b: any) => {
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

  // Helpers de Navegación "Atrás" (Pills)
  backToLeagues() {
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.teamResults = [];
    this.players = [];
    this.apiSearchQuery = '';
    // No reseteamos leagueResults si ya los teníamos de una búsqueda
  }

  backToTeams() {
    this.selectedTeam = null;
    this.players = [];
    this.apiSearchQuery = '';
    // Al volver a equipos, ya tenemos teamResults de la llamada selectLeague
  }

  clearAll() {
    this.apiSearchQuery = '';
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.players = [];
    this.leagueResults = [];
    this.teamResults = [];
    this.leaguePage = 1;
    this.teamPage = 1;
    this.playerPage = 1;
  }

  clearSelection() {
    this.selectedPlayers.clear();
  }

  // Getters para el Basket
  getSelectedPlayersList() {
    return Array.from(this.selectedPlayers.keys());
  }

  getPlayerName(id: string) {
    return this.selectedPlayers.get(id)?.strPlayer || 'Jugador';
  }

  getPlayerTeam(id: string) {
    return this.selectedPlayers.get(id)?.strTeam || 'Equipo';
  }

  getPlayerThumb(id: string) {
    const p = this.selectedPlayers.get(id);
    if (!p) return 'assets/img/player-placeholder.png';

    const cutout = p.strCutout;
    const thumb = p.strThumb;

    if (cutout && cutout !== '' && cutout !== 'null') return cutout;
    if (thumb && thumb !== '' && thumb !== 'null') return thumb;

    return null; // Devolvemos null para que el HTML decida mostrar el icono
  }

  togglePlayer(player: any) {
    const playerId = player.idPlayer;
    if (this.selectedPlayers.has(playerId)) {
      this.selectedPlayers.delete(playerId);
    } else {
      if (this.selectedPlayers.size >= 11) {
        // Podríamos usar un Toast aquí si estuviera inyectado, 
        // pero por ahora bloqueamos la acción.
        return;
      }
      this.selectedPlayers.set(playerId, player);
    }
  }

  selectAll() {
    // Si ya tenemos 11, deseleccionamos los de la lista actual para poder "limpiar"
    const allOfCurrentSelected = this.players
      .filter(p => !this.isAlreadyAdded(p.strPlayer))
      .every(p => this.selectedPlayers.has(p.idPlayer));

    if (allOfCurrentSelected && this.players.length > 0) {
      this.players.forEach(p => this.selectedPlayers.delete(p.idPlayer));
    } else {
      for (const p of this.players) {
        // Solo intentamos seleccionar si NO está en el staff
        if (!this.isAlreadyAdded(p.strPlayer) && !this.selectedPlayers.has(p.idPlayer)) {
          if (this.selectedPlayers.size < 11) {
            this.selectedPlayers.set(p.idPlayer, p);
          } else {
            // Ya llegamos al límite de 11, paramos
            break;
          }
        }
      }
    }
  }

  importPlayers() {
    if (this.selectedPlayers.size === 0) return;

    const playersToImport = Array.from(this.selectedPlayers.values());
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
    this.showToast(`¡Fichajes completados! Se han importado ${this.selectedPlayers.size} jugadores.`, 'success');
    
    setTimeout(() => {
      this.router.navigate(['/players']);
    }, 2000);
  }

  fireConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#002eff', '#ffffff', '#ffd700'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#002eff', '#ffffff', '#ffd700'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }

  handleImageError(event: any) {
    // Si la imagen falla, la ocultamos para que se vea el icono de fondo o el fallback del HTML
    event.target.style.display = 'none';
  }

  private async showToast(message: string, type: 'success' | 'danger' | 'warning', icon?: string) {
    const iconMap = {
      'success': 'checkmark-circle-outline',
      'danger': 'alert-circle-outline',
      'warning': 'alert-circle-outline'
    };

    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      cssClass: type === 'success' ? 'toast-success' : 'toast-error',
      icon: icon || iconMap[type],
      mode: 'ios',
      buttons: [{ role: 'cancel' }]
    });
    await toast.present();
  }
}

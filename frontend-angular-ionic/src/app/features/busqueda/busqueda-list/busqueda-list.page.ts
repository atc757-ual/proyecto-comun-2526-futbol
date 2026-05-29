import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TsdbLeague, TsdbTeam, TsdbPlayer } from '../../../core/models/tsdb.model';
import {
  IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
  IonBadge, IonCard, IonCardContent, IonAvatar, IonSegment, IonSegmentButton, IonChip,
  ModalController, IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, shieldOutline, personOutline, addOutline,
  chevronBackOutline, checkmarkCircleOutline, footballOutline, informationCircleOutline,
  searchOutline, arrowBackOutline, closeOutline, checkmarkDoneOutline,
  closeCircleOutline, closeCircle, chevronForwardOutline, chevronDownOutline,
  chevronUpOutline, cloudDownloadOutline, cloudUploadOutline, footstepsOutline,
  alertCircleOutline, peopleOutline, navigateOutline, navigateCircleOutline,
  shieldCheckmarkOutline, lockClosedOutline, locationOutline,
  person, informationCircle
} from 'ionicons/icons';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LocationPlugin } from '../../../core/plugins/location-plugin';
import { MapPlugin } from '../../../core/plugins/maps-plugin';
import { PermissionModalComponent } from '../../../shared/components/modals/permission-modal/permission-modal.component';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { ConfettiService } from '../../../core/services/ui/confetti.service';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { GpsPermissionCardComponent } from '../../../shared/components/ui/gps-permission-card/gps-permission-card.component';
import { PageFullContentComponent } from '../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../shared/components/layout/layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-busqueda-list',
  templateUrl: './busqueda-list.page.html',
  styleUrls: ['./busqueda-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
    IonBadge, IonCard, IonCardContent, IonAvatar, IonSegment, IonSegmentButton, IonChip,
    PaginationComponent, GpsPermissionCardComponent, IonContent, PageFullContentComponent, PageFooterComponent
  ]
})
export class BusquedaListPage implements OnInit, OnDestroy {

  // 1. INYECCIONES DE DEPENDENCIAS

  private readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly confettiService = inject(ConfettiService);
  private readonly locationPlugin = inject(LocationPlugin);
  private readonly modalCtrl = inject(ModalController);
  private readonly mapPlugin = inject(MapPlugin);
  private readonly cdr = inject(ChangeDetectorRef);


  // 2. PROPIEDADES DE ESTADO

  public hasGeoPermission = false;
  public hasLocation = false;
  public isCapturingLocation = false;
  public isCheckingGeo = true;
  public currentLocation: { type: string; coordinates: number[] } | null = null;
  public currentAddress: string = 'Localizando...';
  public isRevGeocoding: boolean = false;

  private readonly destroy$ = new Subject<void>();

  // -- Búsqueda --
  public searchType: 'player' | 'team' | 'league' = 'player';
  public apiSearchQuery = '';
  public leagueResults: TsdbLeague[] = [];
  public teamResults: TsdbTeam[] = [];
  public players: TsdbPlayer[] = [];
  public selectedLeague: TsdbLeague | null = null;
  public selectedTeam: TsdbTeam | null = null;
  public isLoading = false;
  public isSearchingAutocomplete = false;

  // -- Datos del Usuario --
  public myPlayers: any[] = [];

  // -- Basket de Selección --
  public selectedPlayers: Map<string, TsdbPlayer> = new Map<string, TsdbPlayer>();
  public isImporting = false;

  // -- Paginación --
  public leaguePage = 1;
  public teamPage = 1;
  public playerPage = 1;
  public pageSize = 8;


  // 3. GETTERS Y SETTERS (Paginación)

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


  // 4. CONSTRUCTOR Y CICLO DE VIDA

  constructor() {
    addIcons({
      trophyOutline, shieldOutline, personOutline, addOutline, informationCircleOutline,
      chevronBackOutline, checkmarkCircleOutline, footballOutline,
      searchOutline, arrowBackOutline, closeOutline, closeCircle, footstepsOutline,
      closeCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline,
      checkmarkDoneOutline, cloudDownloadOutline, cloudUploadOutline, alertCircleOutline,
      peopleOutline, navigateOutline, navigateCircleOutline, shieldCheckmarkOutline, lockClosedOutline,
      locationOutline, person, informationCircle
    });
  }

  public pageTitle = 'Centro de búsqueda';
  public pageSubtitle = 'Busca por liga, equipo o jugador y añádelo a tu lista';
  public breadcrumbs = [
    { label: '', url: '/home', icon: 'home-outline' },
    { label: 'Búsqueda', url: '' }
  ];

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.loadMyPlayers();

    // Permisos y Localización inicial
    this.checkGeoPermission().then(() => {
      this.checkPermissionsOnboarding();
      if (this.hasGeoPermission) {
        this.captureLocation(true);
      }
    });
  }


  // 5. INICIALIZACIÓN DE DATOS LOCALES

  loadMyPlayers() {
    this.playerService.getPlayers().pipe(takeUntil(this.destroy$)).subscribe(data => this.myPlayers = data);
  }


  // 6. GESTIÓN GPS Y MAPAS

  async checkGeoPermission() {
    this.isCheckingGeo = true;
    try {
      this.hasGeoPermission = await this.locationPlugin.isGeolocationPermissionGranted();
    } catch (e) {
      this.hasGeoPermission = false;
    }
    this.isCheckingGeo = false;
    this.cdr.detectChanges();
  }

  async checkPermissionsOnboarding() {
    if (this.hasGeoPermission) return;
    const now = Date.now();
    const lastPrompt = Number(localStorage.getItem('last_permission_prompt_busqueda') || '0');
    const hoursSince = (now - lastPrompt) / (1000 * 60 * 60);
    if (hoursSince < 24) return;

    try {
      const modal = await this.modalCtrl.create({
        component: PermissionModalComponent,
        cssClass: 'premium-modal',
        backdropDismiss: false,
        componentProps: { mode: 'commenting' }
      });
      await modal.present();

      await modal.onWillDismiss();
      localStorage.setItem('last_permission_prompt_busqueda', now.toString());

      await this.checkGeoPermission();
      if (this.hasGeoPermission && !this.hasLocation) {
        this.captureLocation(true);
      }
    } catch {
      // permisos no disponibles
    }
  }

  async handlePermissionToggle() {
    this.isCapturingLocation = true;
    this.cdr.detectChanges();

    try {
      const granted = await this.locationPlugin.requestGeolocationPermission();
      this.ngZone.run(async () => {
        this.hasGeoPermission = granted;
        this.isCapturingLocation = false;
        if (granted) {
          this.toastService.showSuccess('¡Permisos de ubicación activos!');
          await this.captureLocation();
        }
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        this.isCapturingLocation = false;
        this.cdr.detectChanges();
      });
    }
  }

  async captureLocation(silent: boolean = false) {
    if (this.isCapturingLocation) return;
    this.isCapturingLocation = true;
    try {
      const pos = await this.locationPlugin.getCurrentPosition();
      if (!pos) throw new Error('Sin posición');
      this.currentLocation = {
        type: 'Point',
        coordinates: [pos.coords.longitude, pos.coords.latitude]
      };
      this.hasLocation = true;
      this.isCapturingLocation = false;
      this.cdr.detectChanges();
      setTimeout(() => this.initMap(), 500);
    } catch {
      this.isCapturingLocation = false;
      this.cdr.detectChanges();
    }
  }

  async initMap(retryCount = 0) {
    if (!this.currentLocation?.coordinates || this.currentLocation.coordinates.length < 2) return;
    const [lng, lat] = this.currentLocation.coordinates;

    const mapContainer = document.getElementById('busqueda-map');
    if (!mapContainer) {
      if (retryCount < 15) {
        setTimeout(() => this.initMap(retryCount + 1), 200);
      }
      return;
    }

    try {
      const mapObj = await this.mapPlugin.initMap('busqueda-map', lat, lng, 14);
      if (!mapObj) return;

      const marker = this.mapPlugin.addMarker(lat, lng, 'Ubicación de Scouting', true);

      setTimeout(() => {
        try {
          if (mapObj && (mapObj as any)._container) {
            mapObj.invalidateSize();
          }
        } catch (e) { }
      }, 400);

      marker.on('dragend', (event: any) => {
        const pos = event.target.getLatLng();
        this.currentLocation = {
          type: 'Point',
          coordinates: [pos.lng, pos.lat]
        };
        this.updateAddress();
      });

      this.updateAddress();
    } catch {
      // mapa no disponible
    }
  }

  updateAddress() {
    if (this.currentLocation?.coordinates) {
      this.isRevGeocoding = true;
      const [lng, lat] = this.currentLocation.coordinates;
      this.playerService.reverseGeocode(lat, lng).pipe(takeUntil(this.destroy$)).subscribe({
        next: (addr) => {
          this.currentAddress = addr;
          this.isRevGeocoding = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.currentAddress = 'Ubicación de búsqueda';
          this.isRevGeocoding = false;
          this.cdr.detectChanges();
        }
      });
    }
  }


  // 7. LÓGICA DE BÚSQUEDA Y UI TRIGGERS

  onSearchInput() {
    if (!this.apiSearchQuery || this.apiSearchQuery.trim().length === 0) {
      return;
    }

    this.players = [];
    this.leaguePage = 1;
    this.teamPage = 1;
    this.playerPage = 1;
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.teamResults = [];

    if (this.apiSearchQuery.length < 3) {
      this.leagueResults = [];
      this.teamResults = [];
      return;
    }

    if (this.searchType === 'league') this.searchLeagues();
    else if (this.searchType === 'team') this.searchTeams();
    else if (this.searchType === 'player') this.searchPlayers();
  }

  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'player': return 'Busca al próximo Balón de Oro...';
      case 'team': return 'Busca un club o equipo...';
      case 'league': return 'Busca una liga o competición...';
      default: return 'Escribe para buscar...';
    }
  }

  backToLeagues() {
    this.selectedLeague = null;
    this.selectedTeam = null;
    this.teamResults = [];
    this.players = [];
    this.apiSearchQuery = '';
  }

  backToTeams() {
    this.selectedTeam = null;
    this.players = [];
    this.apiSearchQuery = '';
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


  // 8. SERVICIOS THE SPORTS DB

  searchLeagues() {
    this.isSearchingAutocomplete = true;
    this.playerService.searchTSDBLeagues(this.apiSearchQuery).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.leagueResults = res;
        this.isSearchingAutocomplete = false;
      },
      error: () => this.isSearchingAutocomplete = false
    });
  }

  searchTeams() {
    this.isSearchingAutocomplete = true;
    this.playerService.searchTSDBTeams(this.apiSearchQuery).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.teamResults = (res || []).map((t: any) => this.normalizeBadge(t));
        this.isSearchingAutocomplete = false;
      },
      error: () => this.isSearchingAutocomplete = false
    });
  }

  searchPlayers() {
    this.isLoading = true;
    this.playerPage = 1;
    this.playerService.searchTSDBPlayers(this.apiSearchQuery).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const uniqueMap = new Map<string, any>();
        (res || []).forEach((p: any) => {
          if (!p) return;
          if (p.idPlayer) {
            // Jugador con ID: confiar en el ID, nunca descartar por nombre
            uniqueMap.set(String(p.idPlayer), p);
          } else {
            // Sin ID: deduplicar por nombre como fallback
            const nameKey = `name_${p.strPlayer?.trim().toLowerCase()}`;
            if (!uniqueMap.has(nameKey)) uniqueMap.set(nameKey, p);
          }
        });

        this.players = Array.from(uniqueMap.values()).sort((a: any, b: any) => {
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

  selectLeague(league: any) {
    this.selectedLeague = league;
    this.apiSearchQuery = '';
    this.players = [];
    this.teamPage = 1;
    this.playerPage = 1;
    this.isLoading = true;
    this.playerService.getTeamsByLeague(league.idLeague).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.teamResults = (res || []).map((t: any) => this.normalizeBadge(t));
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

    this.playerService.getTSDBPlayersByTeam(team.idTeam).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results: any[]) => {
        const officialArr = Array.isArray(results) ? results : [];
        const uniqueMap = new Map<string, any>();
        officialArr.forEach(p => {
          if (!p) return;
          if (p.idPlayer) {
            // Jugador con ID: confiar en el ID, nunca descartar por nombre
            uniqueMap.set(String(p.idPlayer), p);
          } else {
            // Sin ID: deduplicar por nombre como fallback
            const nameKey = `name_${p.strPlayer?.trim().toLowerCase()}`;
            if (!uniqueMap.has(nameKey)) uniqueMap.set(nameKey, p);
          }
        });

        this.players = Array.from(uniqueMap.values()).sort((a: any, b: any) => {
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


  // 9. GESTIÓN DEL BASKET Y SELECCIÓN

  clearSelection() {
    this.selectedPlayers.clear();
  }

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
    if (!p) return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgODAwIDgwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiM0NzU1NjkiPjQwNDwvdGV4dD48L3N2Zz4=';
    if (p.strCutout && p.strCutout !== '' && p.strCutout !== 'null') return p.strCutout;
    if (p.strThumb && p.strThumb !== '' && p.strThumb !== 'null') return p.strThumb;
    return null;
  }

  togglePlayer(player: any) {
    const playerId = player.idPlayer;
    if (this.selectedPlayers.has(playerId)) {
      this.selectedPlayers.delete(playerId);
    } else {
      if (this.selectedPlayers.size >= 11) return;
      this.selectedPlayers.set(playerId, player);
    }
  }

  selectAll() {
    const allOfCurrentSelected = this.players
      .filter(p => !this.isAlreadyAdded(p.strPlayer))
      .every(p => this.selectedPlayers.has(p.idPlayer));

    if (allOfCurrentSelected && this.players.length > 0) {
      this.players.forEach(p => this.selectedPlayers.delete(p.idPlayer));
    } else {
      for (const p of this.players) {
        if (!this.isAlreadyAdded(p.strPlayer) && !this.selectedPlayers.has(p.idPlayer)) {
          if (this.selectedPlayers.size < 11) {
            this.selectedPlayers.set(p.idPlayer, p);
          } else break;
        }
      }
    }
  }


  // 10. IMPORTACIÓN DE JUGADORES A BASE DE DATOS

  importPlayers() {
    if (this.selectedPlayers.size === 0) return;
    if (!this.hasLocation || !this.currentLocation) {
      this.toastService.showError('Activa el GPS antes de importar jugadores.');
      return;
    }

    const locationPayload = {
      type: 'Point' as const,
      coordinates: [
        this.currentLocation.coordinates[0],
        this.currentLocation.coordinates[1]
      ]
    };

    const playersToImport = Array.from(this.selectedPlayers.values());
    this.isImporting = true;
    const imports$ = playersToImport.map(p => this.importSinglePlayer$(p, locationPayload));

    forkJoin(imports$).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.finishImport(),
      error: () => {
        this.finishImport();
      }
    });
  }

  private importSinglePlayer$(p: any, locationPayload: any): Observable<any> {
    const metadata = {
      user_id: this.authService.currentUser()?.uid || 'manual',
      userId: this.authService.currentUser()?.uid || 'manual',
      created_by: this.authService.currentUser()?.email || 'admin',
      updated_by: this.authService.currentUser()?.email || 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      location: locationPayload,
      team: this.selectedTeam?.strTeam || p.strTeam || 'Desconocido',
      league: this.selectedLeague?.strLeague || 'Liga externa'
    };

    return this.playerService.lookupTSDBPlayer(p.idPlayer).pipe(
      catchError(() => of(null)),
      switchMap(details => {
        const mapped = this.playerService.mapTSDBToPlayer(details, p);
        const newPlayer: any = { ...mapped, ...metadata };
        newPlayer.league = newPlayer.league && newPlayer.league !== 'Liga externa' ? newPlayer.league : metadata.league;
        return this.playerService.addPlayer(newPlayer);
      }),
      catchError(() => of(null))
    );
  }

  finishImport() {
    this.isImporting = false;
    this.confettiService.goldCelebrate();
    const count = this.selectedPlayers.size;
    const msg = count === 1
      ? '¡Fichaje completado! Se ha importado 1 jugador.'
      : `¡Fichajes completados! Se han importado ${count} jugadores.`;
    this.toastService.showSuccess(msg);

    setTimeout(() => {
      this.router.navigate(['/players']);
    }, 2000);
  }


  // 11. HELPERS Y UTILIDADES

  isAlreadyAdded(playerName: string): boolean {
    if (!playerName) return false;
    return this.myPlayers.some(p => p.name.toLowerCase() === playerName.toLowerCase());
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  /** Normaliza la URL del escudo de un equipo desde la API de TheSportsDB */
  private normalizeBadge(team: any): any {
    const badge = team.strTeamBadge || team.strBadge;
    if (badge) {
      team.strTeamBadge = badge.startsWith('http')
        ? badge
        : `https://www.thesportsdb.com/images/media/team/badge/${badge}`;
    }
    return team;
  }

  goToPage(page: number) {
    this.activePage = page;
  }

  trackByLeagueId(index: number, league: TsdbLeague): string {
    return league.idLeague || String(index);
  }

  trackByTeamId(index: number, team: TsdbTeam): string {
    return team.idTeam || String(index);
  }

  trackByPlayerId(index: number, player: TsdbPlayer): string {
    return player.idPlayer || String(index);
  }

  trackByStringId(_index: number, id: string): string {
    return id;
  }
}


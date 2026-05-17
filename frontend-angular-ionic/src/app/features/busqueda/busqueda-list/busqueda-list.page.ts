import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
  IonBadge, IonCard, IonCardContent, IonAvatar, IonThumbnail, IonSegment, IonSegmentButton, IonChip,
  ToastController, ModalController
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
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import { LocationPlugin } from '../../../core/plugins/location-plugin';
import { MapPlugin } from '../../../core/plugins/maps-plugin';
import { PermissionModalComponent } from '../../../shared/components/permission-modal/permission-modal.component';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/player.service.token';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-busqueda-list',
  templateUrl: './busqueda-list.page.html',
  styleUrls: ['./busqueda-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonSpinner,
    IonBadge, IonCard, IonCardContent, IonAvatar, IonThumbnail, IonSegment, IonSegmentButton, IonChip
  ]
})
export class BusquedaListPage implements OnInit {
  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private locationPlugin = inject(LocationPlugin);
  private modalCtrl = inject(ModalController);
  private mapPlugin = inject(MapPlugin);
  private cdr = inject(ChangeDetectorRef);

  // Estado de permisos GPS
  public hasGeoPermission = false;
  public hasLocation = false;
  public isCapturingLocation = false;
  public currentLocation: { type: string; coordinates: number[] } | null = null;
  private activePermissionModal: any = null;

  public currentAddress: string = 'Localizando...';
  public isRevGeocoding: boolean = false;

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
      trophyOutline, shieldOutline, personOutline, addOutline, informationCircleOutline,
      chevronBackOutline, checkmarkCircleOutline, footballOutline,
      searchOutline, arrowBackOutline, closeOutline, closeCircle, footstepsOutline,
      closeCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline,
      checkmarkDoneOutline, cloudDownloadOutline, cloudUploadOutline, alertCircleOutline,
      peopleOutline, navigateOutline, navigateCircleOutline, shieldCheckmarkOutline, lockClosedOutline,
      'location-outline': locationOutline,
      person, 'information-circle': informationCircle
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

    // Verificar permisos y lanzar modal de onboarding si hace falta
    this.checkGeoPermission().then(() => {
      this.checkPermissionsOnboarding();
      if (this.hasGeoPermission) {
        this.captureLocation(true);
      }
    });
  }

  async checkGeoPermission() {
    try {
      this.hasGeoPermission = await this.locationPlugin.isGeolocationPermissionGranted();
    } catch (e) {
      this.hasGeoPermission = false;
    }
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
      this.activePermissionModal = modal;
      await modal.present();

      await modal.onWillDismiss();
      localStorage.setItem('last_permission_prompt_busqueda', now.toString());

      await this.checkGeoPermission();
      if (this.hasGeoPermission && !this.hasLocation) {
        this.captureLocation(true);
      }
    } catch (error) {
      console.error('[BUSQUEDA] Error al abrir modal de permisos:', error);
    }
  }

  async handlePermissionToggle() {
    this.isCapturingLocation = true;
    this.cdr.detectChanges();

    try {
      // 1. Disparamos el prompt del navegador
      navigator.geolocation.getCurrentPosition(
        () => { /* Se maneja en la lógica de estado abajo */ },
        () => { /* Se maneja en la lógica de estado abajo */ },
        { timeout: 15000 }
      );

      // 2. Intentamos usar la Permissions API para esperar el cambio
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as any });

          if (status.state === 'prompt') {
            // Esperamos a que cambie (el usuario haga clic)
            await new Promise<void>((resolve) => {
              const onChange = () => {
                status.removeEventListener('change', onChange);
                resolve();
              };
              status.addEventListener('change', onChange);
              setTimeout(resolve, 15000);
            });
          }

          const finalStatus = await navigator.permissions.query({ name: 'geolocation' as any });

          this.ngZone.run(async () => {
            this.hasGeoPermission = finalStatus.state === 'granted';
            this.isCapturingLocation = false;
            if (this.hasGeoPermission) {
              this.showToast('¡Permisos de ubicación activos!', 'success', 'shield-checkmark-outline');
              await this.captureLocation();
            }
            this.cdr.detectChanges();
          });
          return;
        } catch (e) {
          // Fallback
        }
      }

      // Fallback para navegadores sin Permissions API
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigator.geolocation.getCurrentPosition(
        async () => {
          this.ngZone.run(async () => {
            this.hasGeoPermission = true;
            this.isCapturingLocation = false;
            this.showToast('¡Permisos de ubicación activos!', 'success', 'shield-checkmark-outline');
            await this.captureLocation();
            this.cdr.detectChanges();
          });
        },
        () => {
          this.ngZone.run(() => {
            this.hasGeoPermission = false;
            this.isCapturingLocation = false;
            this.cdr.detectChanges();
          });
        },
        { timeout: 5000 }
      );

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
      this.cdr.detectChanges(); // Forzar renderizado del ngIf

      // Inicializar el mapa tras obtener la ubicación
      setTimeout(() => this.initMap(), 500);
    } catch (error: any) {
      this.isCapturingLocation = false;
      this.hasGeoPermission = false;
      this.hasLocation = false;
      this.currentLocation = null;
    }
  }

  initMap() {
    if (!this.currentLocation?.coordinates || this.currentLocation.coordinates.length < 2) return;
    const [lng, lat] = this.currentLocation.coordinates;
    const mapObj = this.mapPlugin.initMap('busqueda-map', lat, lng, 14);
    const marker = this.mapPlugin.addMarker(lat, lng, 'Ubicación de Scouting', true);
    setTimeout(() => mapObj.invalidateSize(), 400);
    marker.on('dragend', (event: any) => {
      const pos = event.target.getLatLng();
      this.currentLocation = {
        type: 'Point',
        coordinates: [pos.lng, pos.lat]
      };
      this.updateAddress();
    });

    // Carga inicial
    this.updateAddress();
  }

  updateAddress() {
    if (this.currentLocation?.coordinates) {
      this.isRevGeocoding = true;
      const [lng, lat] = this.currentLocation.coordinates;
      this.playerService.reverseGeocode(lat, lng).subscribe({
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
    if (!this.hasLocation || !this.currentLocation) {
      this.showToast('Activa el GPS antes de importar jugadores.', 'warning', 'navigate-outline');
      return;
    }

    // Validar formato GeoJSON antes de enviar
    const locationPayload = {
      type: 'Point' as const,
      coordinates: [
        this.currentLocation.coordinates[0], // lng
        this.currentLocation.coordinates[1]  // lat
      ]
    };
    console.log('[BUSQUEDA] Ubicación GeoJSON a adjuntar:', JSON.stringify(locationPayload));

    const playersToImport = Array.from(this.selectedPlayers.values());
    this.isImporting = true;

    let importedCount = 0;
    playersToImport.forEach(p => {
      const newPlayer: any = {
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
        location: locationPayload,
        tsdb_ids: {
          player_id: p.idPlayer,
          team_id: p.idTeam,
          team_id2: p.idTeam2,
          league_id: this.selectedLeague?.idLeague || p.idLeague
        }
      };

      this.playerService.addPlayer(newPlayer).subscribe(() => {
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
    const count = this.selectedPlayers.size;
    const msg = count === 1 
      ? '¡Fichaje completado! Se ha importado 1 jugador.' 
      : `¡Fichajes completados! Se han importado ${count} jugadores.`;
    this.showToast(msg, 'success');

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

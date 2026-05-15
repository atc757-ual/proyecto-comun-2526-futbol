import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import {
  IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonButton, IonIcon, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonAvatar,
  IonSpinner, IonText, ToastController, NavController, LoadingController,
  IonSegment, IonSegmentButton, AlertController, IonToggle, IonSearchbar,
  IonCheckbox, IonList, IonListHeader, IonBadge, IonImg, IonTextarea,
  IonThumbnail, IonChip, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, searchOutline, saveOutline,
  shieldOutline, footballOutline, cloudDoneOutline,
  checkmarkCircleOutline, personOutline,
  imageOutline, locationOutline, mapOutline,
  cloudDownloadOutline, createOutline,
  chevronBackOutline, chevronForwardOutline,
  trophyOutline, syncOutline, trashOutline,
  cloudUploadOutline, closeCircleOutline,
  eyeOutline, statsChartOutline, earthOutline,
  shieldCheckmarkOutline, closeCircle,
  globeOutline, logoInstagram, logoFacebook, logoTwitter, documentTextOutline,
  shieldCheckmark, navigateOutline, navigateCircleOutline, personCircleOutline,
  shirtOutline, calendarOutline, resizeOutline, flagOutline, informationCircleOutline,
  alertCircleOutline, lockClosedOutline
} from 'ionicons/icons';
import { PlayerService, Player } from '@core/services/player.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutService } from '@core/services/layout.service';
import { StorageService } from '@core/services/storage.service';
import { CameraPlugin } from '@core/plugins/camera-plugin';
import { LocationPlugin } from '@core/plugins/location-plugin';
import { MapPlugin } from '@core/plugins/maps-plugin';
import { ConfettiService } from '@core/services/confetti.service';
import { AuthService } from '@core/services/auth.service';
import { PermissionModalComponent } from 'src/app/shared/components/permission-modal/permission-modal.component';

@Component({
  selector: 'app-add-edit-player',
  templateUrl: './add-edit-player.page.html',
  styleUrls: ['./add-edit-player.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonItem, IonAvatar, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader,
    IonSpinner,
    IonSegment, IonSegmentButton, IonSearchbar,
    IonCheckbox, IonList, IonBadge, IonImg, IonToggle, IonTextarea
  ]
})
export class AddEditPlayerPage implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private layoutService = inject(LayoutService);
  private cameraPlugin = inject(CameraPlugin) as CameraPlugin;
  private locationPlugin = inject(LocationPlugin) as LocationPlugin;
  private mapPlugin = inject(MapPlugin) as MapPlugin;
  private confettiService = inject(ConfettiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private activePermissionModal: any = null;

  public isEditMode = false;
  public playerId: string | null = null;
  public entryMode: string = 'import'; // Por defecto import para nuevos
  public apiSearchQuery = '';
  public isSearchingApi = false;
  public isImporting = false;
  public hasSearchedApi = false;
  public apiResults: any[] = [];
  public selectedApiPlayers: any[] = [];
  public hasGeoPermission = false;
  public hasCameraPermission = false;
  public localPlayers: Player[] = [];

  // Paginación
  public currentPage = 1;
  public pageSize = 11;

  get pagedResults() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.apiResults.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.apiResults.length / this.pageSize);
  }

  isImportMode() {
    return this.entryMode === 'import' && !this.isEditMode;
  }

  isManualMode() {
    return this.entryMode === 'manual' || this.isEditMode;
  }

  ionViewWillLeave() {
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
  }

  calculateAge() {
    if (this.player.birth_date) {
      const birthDate = new Date(this.player.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      this.player.age = age;
    }
  }

  getPages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
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

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  isInStaff(externalId: any): boolean {
    if (!externalId) return false;
    const idStr = String(externalId);
    return this.localPlayers.some(p =>
      String(p.external_id) === idStr ||
      String(p.tsdb_ids?.player_id) === idStr
    );
  }

  get importButtonLabel() {
    const count = this.selectedApiPlayers.length;
    if (count === 0) return 'Seleccionar Jugadores';
    return count === 1 ? 'Cargar 1 Jugador' : `Cargar ${count} Jugadores`;
  }

  public player: Player = {
    name: '',
    fullname: '',
    team: '',
    league: '',
    age: undefined,
    birth_date: '',
    birth_place: '',
    birth_country: '',
    nationality: '',
    height: '',
    weight: '',
    side: 'Derecho',
    number: undefined,
    position: 'Midfielder',
    image_url: '',
    user_id: '',
    summary: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: ''
    },
    images: {
      thumb: '',
      poster: '',
      cutout: '',
      cartoon: '',
      banner: ''
    },
    tsdb_ids: {
      player_id: '',
      team_id: '',
      team_id2: '',
      league_id: ''
    }
  };

  positions = [
    { value: 'Goalkeeper', label: 'Portero' },
    { value: 'Centre-Back', label: 'Central' },
    { value: 'Right-Back', label: 'Lateral Derecho' },
    { value: 'Left-Back', label: 'Lateral Izquierdo' },
    { value: 'Defensive Midfield', label: 'Pivote' },
    { value: 'Midfielder', label: 'Centrocampista' },
    { value: 'Attacking Midfield', label: 'Mediapunta' },
    { value: 'Left Winger', label: 'Extremo Izquierdo' },
    { value: 'Right Winger', label: 'Extremo Derecho' },
    { value: 'Centre-Forward', label: 'Delantero Centro' }
  ];

  feet = ['Derecho', 'Izquierdo', 'Ambidiestro'];

  // Estados de los inputs (Patrón Noticias)
  focusedField: string | null = null;
  nameTouched = false;
  teamTouched = false;
  leagueTouched = false;
  imageTouched = false;

  // Manejo de Imágenes (Patrón Noticias)
  selectedFile: File | null = null;
  previewImage: string | undefined | null = null;
  initialPreviewImage: string | undefined | null = null;
  isPublishing = false;

  // Mapa y Ubicación
  public hasLocation = false;
  public isCapturingLocation = false;

  constructor() {
    addIcons({
      cameraOutline, searchOutline, saveOutline, shieldOutline, footballOutline,
      cloudDoneOutline, checkmarkCircleOutline, personOutline, imageOutline,
      locationOutline, mapOutline, cloudDownloadOutline, createOutline,
      chevronBackOutline, chevronForwardOutline, trophyOutline, syncOutline,
      trashOutline, cloudUploadOutline, personCircleOutline, closeCircleOutline,
      eyeOutline, statsChartOutline, shieldCheckmarkOutline, shieldCheckmark,
      closeCircle, globeOutline, logoInstagram, logoFacebook, logoTwitter,
      documentTextOutline, navigateOutline, navigateCircleOutline, earthOutline,
      shirtOutline, calendarOutline, resizeOutline, flagOutline, informationCircleOutline,
      alertCircleOutline,
      'lock-closed-outline': lockClosedOutline
    });
  }

  async ngOnInit() {
    console.log('[ADD-PLAYER] ngOnInit disparado');
    
    // Lanzamos el onboarding de permisos con un pequeño retardo para asegurar que la vista cargó
    setTimeout(() => {
      this.checkPermissionsOnboarding();
    }, 1500);

    // Capturar el ID del usuario actual
    this.authService.user$.subscribe(user => {
      if (user) {
        this.player.user_id = user.uid;
      }
    });

    this.playerId = this.route.snapshot.paramMap.get('id');
    if (this.playerId) {
      this.isEditMode = true;
      this.layoutService.setHeader({
        title: 'Editar jugador',
        subtitle: 'Edita la información de tu jugador',
        showHero: true
      });
      this.loadPlayer(this.playerId);
      this.entryMode = 'manual'; // En edición siempre manual
    } else {
      this.layoutService.setHeader({
        title: 'Nuevo jugador',
        subtitle: 'Añade un nuevo jugador a tu base de datos',
        showHero: true
      });
    }

    this.layoutService.setBreadcrumbs([
      {
        label: '',
        url: '/home',
        icon: 'home-outline'
      }, {
        label: 'Jugadores',
        url: '/players',
      },
      {
        label: this.playerId ? 'Editar Jugador' : 'Nuevo Jugador',
        url: '',
      }
    ]);

    // Si ya tenemos permisos, capturamos ubicación automáticamente
    Promise.all([
      this.checkGeoPermission(),
      this.checkCameraPermission()
    ]).then(() => {
      if (this.hasGeoPermission && !this.isEditMode) {
        console.log('[GPS] Permiso detectado, capturando ubicación...');
        this.captureLocation();
      }
    });

    this.loadLocalPlayers();
  }

  /**
   * Lógica de onboarding de permisos con recordatorio de 24h
   */
  private async checkPermissionsOnboarding() {
    console.log('[ADD-PLAYER] Verificando onboarding de permisos...');
    const lastPrompt = localStorage.getItem('last_permission_prompt_add_player');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // 1. Si ya preguntamos en las últimas 24h, respetamos al usuario y salimos
    if (lastPrompt && (now - parseInt(lastPrompt)) < oneDay) {
      console.log('[ADD-PLAYER] Cooldown de 24h activo. No se muestra el modal.');
      return;
    }

    // 2. Verificación de permisos reales
    try {
      const geoResult = await navigator.permissions.query({ name: 'geolocation' as any });
      let cameraState: PermissionState = 'prompt';
      try {
        const camResult = await navigator.permissions.query({ name: 'camera' as any });
        cameraState = camResult.state;
      } catch (e) {
        cameraState = 'prompt';
      }

      console.log('[ADD-PLAYER] Estado Real:', { geolocation: geoResult.state, camera: cameraState });

      // Si AMBOS están concedidos ya, no hay nada que preguntar
      if (geoResult.state === 'granted' && cameraState === 'granted') {
        console.log('[ADD-PLAYER] Permisos ya concedidos. Saliendo...');
        return;
      }
    } catch (e) {
      console.warn('[ADD-PLAYER] Error consultando permisos:', e);
    }

    // 3. Abrimos el modal
    console.log('[ADD-PLAYER] Intentando abrir modal de permisos...');
    try {
      const modal = await this.modalCtrl.create({
        component: PermissionModalComponent,
        cssClass: 'premium-modal',
        backdropDismiss: false,
        componentProps: { mode: 'players' }
      });

      this.activePermissionModal = modal;
      console.log('[ADD-PLAYER] Modal creado, llamando a present()...');
      await modal.present();

      // REGISTRO DE HORA: Solo cuando el usuario cierra o termina con el modal
      const { data } = await modal.onWillDismiss();
      console.log('[ADD-PLAYER] Modal cerrado con data:', data);
      localStorage.setItem('last_permission_prompt_add_player', now.toString());
    } catch (error) {
      console.error('[ADD-PLAYER] ERROR FATAL al abrir modal:', error);
    }
  }

  loadLocalPlayers() {
    this.playerService.getPlayers().subscribe({
      next: (data) => this.localPlayers = data,
      error: () => console.warn('No se pudieron cargar los jugadores locales para comparación')
    });
  }

  async loadPlayer(id: string) {
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...', mode: 'ios' });
    await loading.present();

    this.playerService.getPlayer(id).subscribe({
      next: (data) => {
        this.player = data;

        // Inicializar objetos si no existen (datos antiguos)
        if (!this.player.social_media) {
          this.player.social_media = { facebook: '', instagram: '', twitter: '', website: '' };
        }
        if (!this.player.images) {
          this.player.images = { thumb: '', poster: '', cutout: '', cartoon: '', banner: '' };
        }
        if (!this.player.tsdb_ids) {
          this.player.tsdb_ids = { player_id: '', team_id: '', team_id2: '', league_id: '' };
        }

        this.previewImage = data.image_url;
        this.initialPreviewImage = data.image_url;
        this.hasLocation = !!data.location;
        if (this.hasLocation) {
          setTimeout(() => this.initMap(), 500);
        }
        loading.dismiss();
      },
      error: () => {
        this.showToast('Error al cargar el jugador', 'danger');
        loading.dismiss();
        this.navCtrl.back();
      }
    });
  }

  async checkGeoPermission() {
    this.hasGeoPermission = await this.locationPlugin.isGeolocationPermissionGranted();
  }

  async requestGeoPermission() {
    const granted = await this.locationPlugin.requestGeolocationPermission();
    this.hasGeoPermission = granted;
    if (granted) {
      this.showToast('¡Permisos de ubicación activos!', 'success', 'shield-checkmark-outline');
      await this.captureLocation();
    } else {
      this.showToast('¡GPS bloqueado! Usa el candado del navegador.', 'danger', 'lock-closed-outline');
    }
  }

  async requestCameraPermission() {
    try {
      const result = await this.cameraPlugin.requestCameraPermission();
      this.hasCameraPermission = result;
      if (result) {
        this.showToast('¡Permisos de cámara activos!', 'success', 'camera-outline');
      } else {
        this.showToast('¡Cámara bloqueada! Usa el candado del navegador.', 'danger', 'lock-closed-outline');
      }
    } catch (e) {
      console.error('Error al solicitar permiso de cámara:', e);
    }
  }

  async checkCameraPermission() {
    try {
      this.hasCameraPermission = await this.cameraPlugin.isCameraPermissionGranted();
    } catch (e) {
      console.warn('No se pudo verificar el permiso de cámara:', e);
    }
  }

  async handlePermissionToggle(event: any) {
    const isChecked = event.detail.checked;

    // Si el usuario lo activa y no tenemos permiso aún
    if (isChecked && !this.hasGeoPermission) {
      const granted = await this.locationPlugin.requestGeolocationPermission();

      if (granted) {
        this.hasGeoPermission = true;
        this.showToast('¡Permisos de ubicación activos!', 'success', 'shield-checkmark-outline');
        await this.captureLocation();
      } else {
        this.hasGeoPermission = false;
        this.showToast('¡GPS bloqueado! Usa el candado del navegador.', 'danger', 'lock-closed-outline');
        // Forzamos el reset visual del toggle
        if (event.target) {
          event.target.checked = false;
        }
      }
    } else if (!isChecked && this.hasGeoPermission) {
      // Si el usuario apaga el GPS manualmente, ocultamos el mapa
      this.hasLocation = false;
      this.hasGeoPermission = false;
    }
  }

  searchInExternalApi() {
    if (!this.apiSearchQuery || this.apiSearchQuery.length < 3) return;
    this.searchPlayersApi();
  }

  segmentChanged(event: any) {
    this.entryMode = event.detail.value;

    // Si cambiamos a manual, reseteamos los valores de búsqueda de IA
    if (this.entryMode === 'manual') {
      this.apiSearchQuery = '';
      this.apiResults = [];
      this.selectedApiPlayers = [];
      this.currentPage = 1;
    }
  }

  onApiSearch(event: any) {
    this.apiSearchQuery = event.target.value;
    this.searchInExternalApi();
  }

  handleImageError(event: any) {
    // Si la imagen falla, la ocultamos para que se vea el icono de fondo
    event.target.style.display = 'none';
  }

  private searchPlayersApi() {
    this.isSearchingApi = true; // El loader grande para jugadores
    this.playerService.searchTSDBPlayers(this.apiSearchQuery).subscribe({
      next: (results) => {
        this.apiResults = results.map(p => ({
          externalId: p.idPlayer,
          name: p.strPlayer,
          nationality: p.strNationality,
          team: p.strTeam,
          image_url: p.strThumb || p.strCutout || 'https://dummyimage.com/250/f2f2f2/ffffff.png',
          position: p.strPosition,
          idTeam: p.idTeam,
          idLeague: p.idLeague,
          country: p.strNationality
        })).sort((a, b) => {
          const aInStaff = this.isInStaff(a.externalId);
          const bInStaff = this.isInStaff(b.externalId);
          if (!aInStaff && bInStaff) return -1;
          if (aInStaff && !bInStaff) return 1;
          return 0;
        });
        this.currentPage = 1;
        this.isSearchingApi = false;
        this.hasSearchedApi = true;
      },
      error: (err) => {
        console.error('Error searching TSDB:', err);
        this.isSearchingApi = false;
        this.hasSearchedApi = true;
        this.showToast('Error al conectar con el servicio de scouting', 'danger', 'alert-circle-outline');
      }
    });
  }

  clearSearch() {
    this.apiSearchQuery = '';
    this.apiResults = [];
    this.currentPage = 1;
    this.hasSearchedApi = false;
  }

  async selectApiPlayer(apiPlayer: any) {
    const loading = await this.loadingCtrl.create({ message: 'Importando perfil completo...', mode: 'ios' });
    await loading.present();

    try {
      // 1. Obtener detalles completos del jugador
      const details = await firstValueFrom(this.playerService.lookupTSDBPlayer(apiPlayer.externalId)) as any;
      if (details) {
        // Usar el mapper centralizado para rellenar el objeto player
        const mappedPlayer = this.playerService.mapTSDBToPlayer(details, apiPlayer);
        Object.assign(this.player, mappedPlayer);

        // 3. Obtener Liga (sacamos el ID de los detalles)
        const leagueId = details?.idLeague;
        if (leagueId) {
          const leagueDetails = await firstValueFrom(this.playerService.lookupTSDBLeague(leagueId)) as any;
          if (leagueDetails) {
            this.player.league = leagueDetails.strLeague;
          }
        }
      }
    } catch (e) {
      console.warn('Error al completar datos desde TSDB:', e);
    }

    this.previewImage = this.player.image_url;
    this.apiResults = [];
    this.apiSearchQuery = '';
    loading.dismiss();
    this.showToast('Datos profesionales importados', 'success', 'checkmark-circle-outline');
  }

  isSelected(apiPlayer: any): boolean {
    return this.selectedApiPlayers.some(p => p.externalId === apiPlayer.externalId);
  }

  getSelectedPlayersArray(): any[] {
    return this.selectedApiPlayers;
  }

  async toggleApiSelection(apiPlayer: any) {
    if (!this.isSelected(apiPlayer) && this.selectedApiPlayers.length >= 11) {
      this.showToast('Has alcanzado el límite de 11 cracks', 'warning', 'alert-circle-outline');
      return;
    }

    const isAlreadySelected = this.isSelected(apiPlayer);

    if (isAlreadySelected) {
      // Quitar de la selección filtrando por ID
      this.selectedApiPlayers = this.selectedApiPlayers.filter(p => p.externalId !== apiPlayer.externalId);
    } else {
      // LÍMITE DE 11 JUGADORES
      if (this.selectedApiPlayers.length >= 11) {
        this.showToast('Solo puedes añadir hasta 11 cracks a la vez', 'warning', 'alert-circle-outline');
        return;
      }

      // Añadir a la selección
      this.selectedApiPlayers = [...this.selectedApiPlayers, apiPlayer];

      // Si no tiene los detalles aún, los cargamos en segundo plano
      if (!apiPlayer.details) {
        try {
          const details = await firstValueFrom(this.playerService.lookupTSDBPlayer(apiPlayer.externalId)) as any;
          if (details) {
            apiPlayer.details = details;
          }
        } catch (e) {
          console.warn(`No se pudieron cargar detalles para ${apiPlayer.name}`, e);
        }
      }
    }
  }

  selectAll11() {
    if (this.apiResults.length === 0) return;

    // Seleccionar los primeros 11 (o todos si hay menos de 11)
    const toSelect = this.apiResults.slice(0, 11);
    toSelect.forEach(p => {
      if (!this.isSelected(p) && !this.isInStaff(p.externalId)) {
        this.toggleApiSelection(p);
      }
    });
  }

  async importSelectedPlayers() {
    if (this.selectedApiPlayers.length === 0) return;

    this.isImporting = true;

    // 1. Asegurar ubicación antes de la importación masiva
    if (!this.player.location || !this.player.location.coordinates || (this.player.location.coordinates[0] === 0 && this.player.location.coordinates[1] === 0)) {
      await this.captureLocation();
    }

    // 2. Preparar los datos con ubicación y user_id
    const playersToImport = this.getSelectedPlayersArray().map(p => ({
      ...p,
      location: this.player.location,
      user_id: this.player.user_id
    }));

    this.playerService.bulkImportPlayers(playersToImport).subscribe({
      next: (res: any) => {
        this.isImporting = false;
        this.selectedApiPlayers = [];
        this.apiResults = [];
        this.apiSearchQuery = '';
        this.confettiService.celebrate();
        const count = playersToImport.length;
        this.showToast(
          count === 1 
            ? 'Se ha registrado el jugador con éxito' 
            : `Se han registrado ${count} jugadores con éxito`, 
          'success', 
          'checkmark-circle-outline'
        );
        setTimeout(() => this.navCtrl.back(), 1500);
      },
      error: (err: any) => {
        this.isImporting = false;
        const count = playersToImport.length;
        this.showToast(
          count === 1 
            ? 'Error al registrar el jugador' 
            : 'Error al registrar los jugadores', 
          'danger', 
          'alert-circle-outline'
        );
      }
    });
  }

  async takePhoto() {
    try {
      const photo = await this.cameraPlugin.takePhoto();
      if (photo && photo.webPath) {
        this.previewImage = photo.webPath;
        if (this.player.images) {
          this.player.images.thumb = photo.webPath;
        }

        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        this.selectedFile = new File([blob], `player_${Date.now()}.jpg`, { type: 'image/jpeg' });

        this.showToast('Foto capturada con éxito', 'success', 'checkmark-circle-outline');
      }
    } catch (error) {
      console.error('Error al capturar foto:', error);
      this.showToast('No se pudo abrir la cámara o galería', 'danger', 'alert-circle-outline');
    }
  }

  async captureLocation() {
    this.isCapturingLocation = true;
    try {
      const pos = await this.locationPlugin.getCurrentPosition();
      console.log('[GPS] Ubicación capturada:', pos);

      if (!pos) {
        throw new Error('No se obtuvo posición');
      }

      this.player.location = {
        type: 'Point',
        coordinates: [pos.coords.longitude, pos.coords.latitude]
      };

      this.hasLocation = true;
      this.isCapturingLocation = false;

      // Esperar a que el *ngIf de Angular pinte el div#player-map
      setTimeout(() => {
        this.initMap();
      }, 500);
    } catch (error) {
      console.error('[GPS] Error:', error);
      this.isCapturingLocation = false;
      this.showToast('No se pudo obtener la ubicación precisa', 'warning');
    }
  }

  initMap() {
    if (!this.player.location?.coordinates || this.player.location.coordinates.length < 2) {
      console.warn('[Map] No hay coordenadas válidas para inicializar el mapa');
      return;
    }

    const [lng, lat] = this.player.location.coordinates;
    console.log('[Map] Inicializando en:', lat, lng);

    // Inicializar el mapa
    const mapObj = this.mapPlugin.initMap('player-map', lat, lng, 15);
    const marker = this.mapPlugin.addMarker(lat, lng, 'Ubicación del Scouting', true);

    // Truco Leaflet: Forzar redibujo para evitar zonas grises
    setTimeout(() => {
      mapObj.invalidateSize();
    }, 400);

    // Listener para actualizar coordenadas al arrastrar el pin
    marker.on('dragend', (event: any) => {
      const position = event.target.getLatLng();
      this.player.location = {
        type: 'Point',
        coordinates: [position.lng, position.lat]
      };
      this.showToast('Ubicación ajustada', 'success', 'resize-outline');
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validación de tamaño (100KB = 100 * 1024 bytes) como en noticias
      const maxSize = 100 * 1024;
      if (file.size > maxSize) {
        this.showToast('La imagen es demasiado pesada. Máximo 100KB', 'danger', 'alert-circle-outline');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
        if (this.player.images) {
          this.player.images.thumb = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.previewImage = null;
    this.selectedFile = null;
    this.player.image_url = '';
    if (this.player.images) {
      this.player.images.thumb = '';
    }
  }
  async onSave() {
    if (!this.player.name || !this.player.team) {
      this.showToast('Nombre y Equipo son obligatorios', 'warning', 'alert-circle-outline');
      return;
    }

    this.isPublishing = true;

    // 0. Marcar si es manual
    if (!this.isEditMode && this.entryMode === 'manual') {
      this.player.is_manual = true;
    }

    // 1. Asegurar ubicación (si no es edición)
    if (!this.isEditMode && !this.player.location) {
      await this.captureLocation();
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEditMode ? 'Actualizando...' : 'Guardando...',
      mode: 'ios'
    });
    await loading.present();

    this.isPublishing = true;

    this.playerService.savePlayer(this.playerId, this.player, this.selectedFile, this.initialPreviewImage as string | null).subscribe({
      next: (res: any) => {
        loading.dismiss();
        this.isPublishing = false;
        this.confettiService.celebrate();
        if (res && res._id) {
          this.showToast(`Jugador ${this.isEditMode ? 'actualizado' : 'creado'} con éxito`, 'success', 'checkmark-circle-outline');
          setTimeout(() => this.router.navigate(['/players']), 1500);
        }
      },
      error: (err: any) => {
        this.isPublishing = false;
        console.error('[SAVE-PLAYER] Error:', err);
        this.showToast('Error al guardar el crack', 'danger', 'alert-circle-outline');
      }
    });
  }

  setFocus(field: string | null) {
    this.focusedField = field;
    if (field) {
      if (field === 'name') this.nameTouched = true;
      if (field === 'team') this.teamTouched = true;
      if (field === 'league') this.leagueTouched = true;
      if (field === 'image_url') this.imageTouched = true;
    }
  }

  onBlurName() {
    this.focusedField = null;
    this.nameTouched = true;
    if (this.player.name) {
      this.player.name = this.player.name
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }

  ngOnDestroy() {
    this.mapPlugin.destroyMap();
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

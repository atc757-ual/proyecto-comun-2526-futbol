import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import {
  IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonButton, IonIcon, IonCard, IonCardContent,
  IonCardHeader, IonAvatar,
  IonSpinner, ToastController, NavController, LoadingController,
  IonSegment, IonSegmentButton, AlertController, IonSearchbar,
  IonCheckbox, IonList, IonBadge, IonImg, IonTextarea, ModalController, IonModal
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
  cloudUploadOutline, closeCircleOutline, linkOutline,
  eyeOutline, statsChartOutline, earthOutline,
  shieldCheckmarkOutline, closeCircle,
  globeOutline, logoInstagram, logoFacebook, logoTwitter, documentTextOutline,
  shieldCheckmark, navigateOutline, navigateCircleOutline, personCircleOutline,
  shirtOutline, calendarOutline, resizeOutline, flagOutline, informationCircleOutline,
  alertCircleOutline, lockClosedOutline, cutOutline, cubeOutline, appsOutline, sparklesOutline,
  person, informationCircle
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '@core/services/players/player.service.token';
import { Player } from '@core/models/player.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutService } from '@core/services/ui/layout.service';
import { StorageService } from '@core/services/system/storage.service';
import { CameraPlugin } from '@core/plugins/camera-plugin';
import { LocationPlugin } from '@core/plugins/location-plugin';
import { MapPlugin } from '@core/plugins/maps-plugin';
import { ConfettiService } from '@core/services/ui/confetti.service';
import { AuthService } from '@core/services/auth/auth.service';
import { PermissionModalComponent } from 'src/app/shared/components/permission-modal/permission-modal.component';
import { GpsPermissionCardComponent } from 'src/app/shared/components/gps-permission-card/gps-permission-card.component';

@Component({
  selector: 'app-add-edit-player',
  templateUrl: './add-edit-player.page.html',
  styleUrls: ['./add-edit-player.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonAvatar, IonSpinner,
    IonSegment, IonSegmentButton, IonSearchbar, IonCheckbox,
    IonList, IonBadge, IonImg, IonTextarea, IonModal,
    GpsPermissionCardComponent
  ]
})
export class AddEditPlayerPage implements OnInit, OnDestroy {
  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
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
  private sanitizer = inject(DomSanitizer);
  private activePermissionModal: any = null;

  getSafeUrl(url: string | null | undefined): any {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return url;
  }

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
  public currentAddress: string = 'Localizando...';
  public isRevGeocoding: boolean = false;
  public isDataLoading = false;

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
    return this.entryMode === 'import';
  }

  isManualMode() {
    return this.entryMode === 'manual';
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
    secondary_team: '',
    league: '',
    age: undefined,
    birth_date: '',
    birth_place: '',
    birth_country: '',
    nationality: '',
    height: '',
    weight: '',
    side: 'Right',
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
      banner: '',
      render: ''
    },
    tsdb_ids: {
      player_id: '',
      team_id: '',
      team_id2: '',
      league_id: ''
    }
  };

  positions = [
    { value: 'Goalkeeper', label: 'Goalkeeper' },
    { value: 'Centre-Back', label: 'Centre-Back' },
    { value: 'Right-Back', label: 'Right-Back' },
    { value: 'Left-Back', label: 'Left-Back' },
    { value: 'Defensive Midfield', label: 'Defensive Midfield' },
    { value: 'Midfielder', label: 'Midfielder' },
    { value: 'Attacking Midfield', label: 'Attacking Midfield' },
    { value: 'Left Winger', label: 'Left Winger' },
    { value: 'Right Winger', label: 'Right Winger' },
    { value: 'Centre-Forward', label: 'Centre-Forward' }
  ];

  feet = ['Right', 'Left', 'Ambidextrous'];

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
  public isCheckingGeo = true;

  // Gestión Multimedia Avanzada
  public imageTypes = [
    { key: 'image_url', label: 'Foto Principal', icon: 'person-outline', helper: 'Imagen principal para el avatar y listas.' },
    { key: 'cutout', label: 'Foto Secundaria', icon: 'sparkles-outline', helper: 'Foto sin fondo para el efecto de volteo.' },
    { key: 'banner', label: 'Banner', icon: 'image-outline', helper: 'Fondo decorativo para las estadísticas.' }
  ];

  public globalMediaMode: 'upload' | 'url' = 'url';

  // Previsualizaciones específicas para cada tipo
  public previews: { [key: string]: string | null } = {};

  // Visor de imágenes en pantalla completa
  public activeViewerImage: string | null = null;
  public activeViewerTitle: string | null = null;

  openImageViewer(imageUrl: string, title: string) {
    if (!imageUrl) return;
    this.activeViewerImage = imageUrl;
    this.activeViewerTitle = title;
  }

  closeImageViewer() {
    this.activeViewerImage = null;
    this.activeViewerTitle = null;
  }

  setGlobalMediaMode(mode: 'upload' | 'url') {
    this.globalMediaMode = mode;
    
    // Clear all image fields on both player and previews when switching modes!
    this.player.image_url = '';
    if (this.player.images) {
      this.player.images.thumb = '';
      this.player.images.cutout = '';
      this.player.images.banner = '';
    }
    this.previews = {};
    
    // Si pasamos a upload y no hay cámara, lanzamos onboarding
    if (mode === 'upload' && !this.hasCameraPermission) {
      this.checkPermissionsOnboarding();
    }
  }

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
      alertCircleOutline, linkOutline, sparklesOutline,
      'lock-closed-outline': lockClosedOutline,
      'location-outline': locationOutline,
      'person-outline': personOutline,
      'image-outline': imageOutline,
      'cut-outline': cutOutline,
      'sparkles-outline': sparklesOutline,
      'close-circle-outline': closeCircleOutline,
      person, 'information-circle': informationCircle,
      cutOutline, cubeOutline, appsOutline
    });
  }

  async ngOnInit() {
    console.log('[ADD-PLAYER] ngOnInit disparado');

    // El onboarding se lanzará solo cuando el usuario pase a modo MANUAL
    // para evitar intrusión al cargar la página en modo búsqueda.

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
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Jugadores', url: '/players' },
      { label: this.playerId ? 'Editar Jugador' : 'Nuevo Jugador', url: '' }
    ]);

    // Inicializar previsualizaciones si ya hay datos
    this.syncPreviews();

    // Si ya tenemos permisos, capturamos ubicación automáticamente. Si no, abrimos el onboarding explicativo.
    Promise.all([
      this.checkGeoPermission(),
      this.checkCameraPermission()
    ]).then(() => {
      if (this.hasGeoPermission) {
        if (!this.isEditMode) {
          console.log('[GPS] Permiso detectado, capturando ubicación automáticamente...');
          this.captureLocation();
        }
      } else {
        this.checkPermissionsOnboarding();
      }
    });

    this.loadLocalPlayers();
  }

  public async checkPermissionsOnboarding() {
    console.log('[ADD-PLAYER] Verificando onboarding de permisos...');
    const lastPrompt = localStorage.getItem('last_permission_prompt_add_player');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // 1. Si ya preguntamos en las últimas 24h, respetamos al usuario y salimos
    if (lastPrompt && (now - parseInt(lastPrompt)) < oneDay) {
      console.log('[ADD-PLAYER] Cooldown de 24h activo. No se muestra el modal.');
      if (!this.isEditMode && !this.hasLocation) {
        this.captureLocation();
      }
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
        if (!this.isEditMode && !this.hasLocation) {
          this.captureLocation();
        }
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

      // REFRESCAR TARJETAS: Actualizamos el estado tras cerrar el modal
      await Promise.all([
        this.checkGeoPermission(),
        this.checkCameraPermission()
      ]);

      // Capturar la ubicación (con o sin permiso concedido, para que cargue el mapa/fallback)
      if (!this.isEditMode && !this.hasLocation) {
        this.captureLocation();
      }

    } catch (error) {
      console.error('[ADD-PLAYER] ERROR FATAL al abrir modal:', error);
      if (!this.isEditMode && !this.hasLocation) {
        this.captureLocation();
      }
    }
  }

  loadLocalPlayers() {
    this.playerService.getPlayers().subscribe({
      next: (data) => this.localPlayers = data,
      error: () => console.warn('No se pudieron cargar los jugadores locales para comparación')
    });
  }

  async loadPlayer(id: string) {
    this.isDataLoading = true;

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
        this.isDataLoading = false;
        this.syncPreviews();
      },
      error: () => {
        this.showToast('Error al cargar el jugador', 'danger');
        this.isDataLoading = false;
        this.navCtrl.back();
      }
    });
  }

  async checkGeoPermission() {
    this.isCheckingGeo = true;
    this.hasGeoPermission = await this.locationPlugin.isGeolocationPermissionGranted();
    this.isCheckingGeo = false;
    this.cdr.detectChanges();
  }

  async requestGeoPermission() {
    const granted = await this.locationPlugin.requestGeolocationPermission();
    this.hasGeoPermission = granted;
    if (granted) {
      this.cdr.detectChanges();
      this.showToast('¡Permisos de ubicación activos!', 'success', 'shield-checkmark-outline');
      await this.captureLocation();
    }
  }

  async requestCameraPermission() {
    try {
      let result = false;
      try {
        result = await this.cameraPlugin.requestCameraPermission();
      } catch (capacitorError: any) {
        // Fallback for Web (si Capacitor falla por estar en navegador)
        if (navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          result = true;
        } else {
          throw capacitorError;
        }
      }

      this.hasCameraPermission = result;
      if (result) {
        this.showToast('¡Permisos de cámara activos!', 'success', 'camera-outline');
      } else {
        this.showToast('¡Cámara bloqueada! Usa el candado del navegador.', 'danger', 'lock-closed-outline');
      }
      return result;
    } catch (e) {
      console.warn('Cámara bloqueada o no disponible:', e);
      this.showToast('¡Cámara bloqueada! Usa el candado del navegador.', 'danger', 'lock-closed-outline');
      return false;
    }
  }

  async handleCameraToggle(event: any) {
    const isChecked = event.detail.checked;

    if (isChecked && !this.hasCameraPermission) {
      const granted = await this.requestCameraPermission();
      if (!granted && event.target) {
        event.target.checked = false; // Reset visual si se rechaza o bloquea
      }
    } else if (!isChecked && this.hasCameraPermission) {
      this.hasCameraPermission = false;
    }
  }

  async checkCameraPermission() {
    try {
      this.hasCameraPermission = await this.cameraPlugin.isCameraPermissionGranted();
    } catch (e) {
      console.warn('No se pudo verificar el permiso de cámara:', e);
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

  searchInExternalApi() {
    if (!this.apiSearchQuery || this.apiSearchQuery.length < 3) return;
    this.searchPlayersApi();
  }

  segmentChanged(event: any) {
    this.entryMode = event.detail.value;

    // Si cambiamos a manual, reseteamos los valores de búsqueda de IA y lanzamos onboarding si hace falta
    if (this.entryMode === 'manual') {
      this.apiSearchQuery = '';
      this.apiResults = [];
      this.selectedApiPlayers = [];
      this.currentPage = 1;

      // Lanzamos onboarding solo aquí para no molestar en la búsqueda inicial
      this.checkPermissionsOnboarding();
    }
  }

  onApiSearch(event: any) {
    this.apiSearchQuery = event.target.value;
    this.searchInExternalApi();
  }

  handleImageError(event: any, key: string = 'image_url') {
    const label = key === 'image_url' ? 'Foto Principal' : (key === 'cutout' ? 'Foto Sec.' : 'Banner');
    event.target.src = `https://placehold.co/120x120/e2e8f0/3880ff?text=${label}`;
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
    this.entryMode = 'manual';
    this.cdr.detectChanges();
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
    if (!this.hasLocation || !this.player.location?.coordinates) {
      this.showToast('Activa el GPS antes de guardar jugadores.', 'warning', 'navigate-outline');
      return;
    }

    this.isImporting = true;

    // Construir el payload GeoJSON explícito para la BD
    const locationPayload = {
      type: 'Point' as const,
      coordinates: [
        this.player.location.coordinates[0], // lng
        this.player.location.coordinates[1]  // lat
      ]
    };
    console.log('[ADD-PLAYER] Ubicación GeoJSON a adjuntar:', JSON.stringify(locationPayload));

    // Preparar los datos con ubicación y user_id
    const playersToImport = this.getSelectedPlayersArray().map(p => ({
      ...p,
      location: locationPayload,
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
        setTimeout(() => this.navCtrl.back(), 750);
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


  async captureLocation(silent: boolean = false) {
    if (this.isCapturingLocation) return;
    this.isCapturingLocation = true;

    try {
      const pos = await this.locationPlugin.getCurrentPosition({ useCache: false, enableHighAccuracy: false });
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
      this.cdr.detectChanges();

      // Esperar a que el *ngIf de Angular pinte el div#player-map
      setTimeout(() => {
        this.initMap();
      }, 500);
    } catch (error: any) {
      console.warn('[GPS] Error capturando ubicación, aplicando fallback de Madrid:', error);
      this.isCapturingLocation = false;

      // Fallback de Madrid
      this.player.location = {
        type: 'Point',
        coordinates: [-3.7038, 40.4168]
      };

      this.hasLocation = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.initMap();
      }, 500);
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
      this.updateAddress();
    });

    // Carga inicial de dirección
    this.updateAddress();
  }

  updateAddress() {
    if (this.player.location?.coordinates) {
      this.isRevGeocoding = true;
      const [lng, lat] = this.player.location.coordinates;
      this.playerService.reverseGeocode(lat, lng).subscribe({
        next: (addr) => {
          this.currentAddress = addr;
          this.isRevGeocoding = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.currentAddress = 'Ubicación seleccionada';
          this.isRevGeocoding = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  hasAnyImage(): boolean {
    if (this.player.image_url) return true;
    if (this.player.images) {
      return Object.values(this.player.images).some(v => !!v);
    }
    return false;
  }

  clearAllImages() {
    this.player.image_url = '';
    if (this.player.images) {
      Object.keys(this.player.images).forEach(k => {
        (this.player.images as any)[k] = '';
      });
    }
    this.previewImage = null;
    this.syncPreviews();
    this.cdr.detectChanges();
    this.showToast('Multimedia limpiada', 'success', 'trash-outline');
  }

  clearSelection() {
    this.selectedApiPlayers = [];
    this.cdr.detectChanges();
    this.showToast('Selección limpiada', 'success', 'trash-outline');
  }

  updatePlayerImage(key: string, value: string) {
    if (key === 'image_url') {
      this.player.image_url = value;
    } else if (this.player.images) {
      (this.player.images as any)[key] = value;
    }
  }

  getPlayerImage(key: string): string {
    if (key === 'image_url') return this.player.image_url || '';
    return (this.player.images as any)?.[key] || '';
  }

  syncPreviews() {
    this.previews['image_url'] = this.player.image_url || null;
    if (this.player.images) {
      Object.keys(this.player.images).forEach(k => {
        this.previews[k] = (this.player.images as any)[k] || null;
      });
    }
  }

  async onFileSelected(event: any, key: string = 'image_url') {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 102400) { // 100KB
        this.showToast('La imagen supera los 100KB', 'danger');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.updatePlayerImage(key, base64);
        this.previews[key] = base64;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  async takePhoto(key: string = 'image_url') {
    if (!this.hasCameraPermission) {
      this.checkPermissionsOnboarding();
      return;
    }

    try {
      const photo = await this.cameraPlugin.takePhoto();
      if (photo) {
        const base64 = `data:image/jpeg;base64,${photo.base64String}`;
        this.updatePlayerImage(key, base64);
        this.previews[key] = base64;
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Error al tomar foto:', e);
    }
  }

  removeImage(key: string = 'image_url') {
    this.updatePlayerImage(key, '');
    this.previews[key] = null;
    this.cdr.detectChanges();
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

    console.log('[FRONTEND] Guardando jugador con location:', this.player.location);
    this.isPublishing = true;

    this.playerService.savePlayer(this.playerId, this.player, this.selectedFile, this.initialPreviewImage as string | null).subscribe({
      next: (res: any) => {
        this.isPublishing = false;
        this.confettiService.celebrate();
        if (res && (res._id || res.id)) {
          this.showToast(`Jugador ${this.isEditMode ? 'actualizado' : 'creado'} con éxito`, 'success', 'checkmark-circle-outline');
          setTimeout(() => this.router.navigate(['/players']), 750);
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

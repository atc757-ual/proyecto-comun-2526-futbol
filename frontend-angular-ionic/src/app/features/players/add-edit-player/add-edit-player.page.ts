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
  IonThumbnail, IonChip
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
import { ActivatedRoute } from '@angular/router';
import { LayoutService } from '@core/services/layout.service';
import { StorageService } from '@core/services/storage.service';
import { CameraPlugin } from '@core/plugins/camera-plugin';
import { LocationPlugin } from '@core/plugins/location-plugin';
import { MapPlugin } from '@core/plugins/maps-plugin';
import { ConfettiService } from '@core/services/confetti.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-add-edit-player',
  templateUrl: './add-edit-player.page.html',
  styleUrls: ['./add-edit-player.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonItem, IonAvatar, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSpinner,
    IonSegment, IonSegmentButton, IonSearchbar,
    IonCheckbox, IonList, IonBadge, IonImg, IonToggle, IonTextarea
  ]
})
export class AddEditPlayerPage implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private layoutService = inject(LayoutService);
  private storageService = inject(StorageService);
  private cameraPlugin = inject(CameraPlugin) as CameraPlugin;
  private locationPlugin = inject(LocationPlugin) as LocationPlugin;
  private mapPlugin = inject(MapPlugin) as MapPlugin;
  private confettiService = inject(ConfettiService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  public isEditMode = false;
  public playerId: string | null = null;
  public entryMode: 'manual' | 'import' = 'import'; // Por defecto import para nuevos
  public apiSearchQuery = '';
  public isSearchingApi = false;
  public hasSearchedApi = false;
  public apiResults: any[] = [];
  public selectedApiPlayers: any[] = [];
  public hasGeoPermission = false;
  public localPlayers: Player[] = [];

  // Paginación
  public currentPage = 1;
  public pageSize = 7;

  get pagedResults() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.apiResults.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.apiResults.length / this.pageSize);
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
    number: undefined,
    position: 'Midfielder',
    image_url: '',
    user_id: '', // Se asignará en el constructor/onInit
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

    // Obtener UID real
    const user = this.authService.currentUser();
    if (user) {
      this.player.user_id = user.uid;
    }
    
    // Si ya tenemos permisos, capturamos ubicación automáticamente
    this.checkGeoPermission().then(() => {
      if (this.hasGeoPermission && !this.isEditMode) {
        console.log('[GPS] Permiso detectado, capturando ubicación...');
        this.captureLocation();
      }
    });

    this.loadLocalPlayers();
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
      this.showToast('¡GPS bloqueado! 🔒 Usa el candado del navegador.', 'danger', 'lock-closed-outline');
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
        this.showToast('¡GPS bloqueado! 🔒 Usa el candado del navegador.', 'danger', 'lock-closed-outline');
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
    event.target.src = 'assets/img/player-placeholder.png';
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
          // Si 'a' está en staff y 'b' no, 'a' va después (1)
          if (aInStaff && !bInStaff) return 1;
          // Si 'a' no está y 'b' sí, 'a' va antes (-1)
          if (!aInStaff && bInStaff) return -1;
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
        this.player.name = details.strPlayer;
        this.player.fullname = details.strPlayerAlternate || details.strPlayer;
        this.player.nationality = details.strNationality;
        this.player.team = details.strTeam;
        this.player.position = details.strPosition;
        this.player.height = details.strHeight;
        this.player.weight = details.strWeight;
        this.player.number = details.strNumber ? parseInt(details.strNumber) : undefined;
        this.player.birth_date = details.dateBorn;
        this.player.birth_place = details.strBirthLocation;
        this.player.birth_country = details.strNationality;
        this.player.image_url = details.strThumb || apiPlayer.image_url;
        this.player.external_id = details.idPlayer;
        this.player.summary = details.strDescriptionES || details.strDescriptionEN || '';

        // Identificadores TSDB
        this.player.tsdb_ids = {
          player_id: details.idPlayer,
          team_id: details.idTeam,
          team_id2: details.idTeam2,
          league_id: details.idLeague
        };

        // Redes Sociales
        this.player.social_media = {
          facebook: details.strFacebook,
          instagram: details.strInstagram,
          twitter: details.strTwitter,
          website: details.strWebsite
        };

        // Múltiples Imágenes Estructuradas
        this.player.images = {
          thumb: details.strThumb,
          poster: details.strPoster,
          cutout: details.strCutout,
          cartoon: details.strCartoon,
          banner: details.strBanner
        };

        // Calcular edad
        if (details.dateBorn) {
          const born = new Date(details.dateBorn);
          const ageDifMs = Date.now() - born.getTime();
          const ageDate = new Date(ageDifMs);
          this.player.age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

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
    const isAlreadySelected = this.isSelected(apiPlayer);

    if (isAlreadySelected) {
      // Quitar de la selección filtrando por ID
      this.selectedApiPlayers = this.selectedApiPlayers.filter(p => p.externalId !== apiPlayer.externalId);
    } else {
      // LÍMITE DE 11 JUGADORES
      if (this.selectedApiPlayers.length >= 11) {
        this.showToast('Solo puedes añadir hasta 11 jugadores a la vez', 'warning', 'alert-circle-outline');
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

  async importSelectedPlayers() {
    if (this.selectedApiPlayers.length === 0) return;

    const playersToImport = [...this.selectedApiPlayers];
    const loading = await this.loadingCtrl.create({
      message: `Importando ${playersToImport.length} cracks...`,
      mode: 'ios'
    });
    await loading.present();

    let successCount = 0;
    for (const apiPlayer of playersToImport) {
      try {
        // Usamos los detalles precargados si existen, si no los pedimos ahora
        const details = apiPlayer.details || await firstValueFrom(this.playerService.lookupTSDBPlayer(apiPlayer.externalId)) as any;

        console.log(`[Import] Mapeando datos para ${apiPlayer.name}`, details);

        const newPlayer: Player = {
          name: apiPlayer.name,
          fullname: details?.strPlayerAlternate || details?.strPlayer || apiPlayer.name,
          team: details?.strTeam || apiPlayer.team,
          nationality: details?.strNationality || apiPlayer.nationality,
          position: details?.strPosition || apiPlayer.position,
          image_url: details?.strThumb || apiPlayer.image_url,
          external_id: apiPlayer.externalId,
          is_manual: false,
          secondary_team: details?.strTeam2,
          user_id: this.authService.currentUser()?.uid || 'unknown',
          created_by: this.authService.currentUser()?.email || 'admin',
          updated_by: this.authService.currentUser()?.email || 'admin',
          created_at: new Date(),
          updated_at: new Date(),
          summary: details?.strDescriptionES || details?.strDescriptionEN || '',
          tsdb_ids: details ? {
            player_id: details.idPlayer,
            team_id: details.idTeam,
            team_id2: details.idTeam2,
            league_id: details.idLeague
          } : {},
          images: details ? {
            thumb: details.strThumb,
            poster: details.strPoster,
            cutout: details.strCutout,
            cartoon: details.strCartoon,
            banner: details.strBanner
          } : {
            thumb: apiPlayer.image_url,
            poster: '',
            cutout: '',
            cartoon: '',
            banner: ''
          },
          social_media: details ? {
            facebook: details.strFacebook,
            instagram: details.strInstagram,
            twitter: details.strTwitter,
            website: details.strWebsite
          } : {
            facebook: '',
            instagram: '',
            twitter: '',
            website: ''
          }
        };

        console.log(`[Import] Objeto final a guardar:`, newPlayer);

        if (details) {
          newPlayer.birth_date = details.dateBorn;
          newPlayer.birth_place = details.strBirthLocation;
          newPlayer.birth_country = details.strNationality;
          newPlayer.height = details.strHeight;
          newPlayer.weight = details.strWeight;
          newPlayer.number = details.strNumber ? parseInt(details.strNumber) : undefined;

          if (details.dateBorn) {
            const born = new Date(details.dateBorn);
            const ageDifMs = Date.now() - born.getTime();
            const ageDate = new Date(ageDifMs);
            newPlayer.age = Math.abs(ageDate.getUTCFullYear() - 1970);
          }
        }

        await firstValueFrom(this.playerService.addPlayer(newPlayer));
        successCount++;
      } catch (err) {
        console.error('Error importando a', apiPlayer.name, err);
      }
    }

    loading.dismiss();
    this.selectedApiPlayers = [];
    this.apiResults = [];
    this.apiSearchQuery = '';

    this.confettiService.celebrate();
    this.showToast(`Se han importado ${successCount} jugadores con éxito`, 'success', 'checkmark-circle-outline');

    setTimeout(() => this.navCtrl.back(), 1500);
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
    if (!this.player.location) return;

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

    // 0. Asegurar auditoría
    const userEmail = this.authService.currentUser()?.email || 'admin';
    if (!this.isEditMode) {
      this.player.created_by = userEmail;
      this.player.created_at = new Date();
    }
    this.player.updated_by = userEmail;
    this.player.updated_at = new Date();
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

    try {
      // 1. Manejo de Imagen en Firebase Storage
      if (this.selectedFile) {
        // Subir nueva imagen
        const newImageUrl = await this.storageService.uploadImage(this.selectedFile, 'players');
        this.player.image_url = newImageUrl;

        // Si editamos y había una previa en Firebase, borrarla
        if (this.isEditMode && this.initialPreviewImage && this.initialPreviewImage.includes('firebasestorage')) {
          await this.storageService.deleteImageByUrl(this.initialPreviewImage);
        }
      }

      // 2. Guardar en Base de Datos
      const request = this.isEditMode
        ? this.playerService.updatePlayer(this.playerId!, this.player)
        : this.playerService.addPlayer(this.player);

      request.subscribe({
        next: () => {
          loading.dismiss();
          this.isPublishing = false;
          this.confettiService.celebrate(); // ¡La Chaya!
          this.showToast(`Jugador ${this.isEditMode ? 'actualizado' : 'creado'} con éxito`, 'success', 'checkmark-circle-outline');
          setTimeout(() => this.navCtrl.back(), 1500); // Dar tiempo al confeti
        },
        error: (err) => {
          loading.dismiss();
          this.isPublishing = false;
          this.showToast('Error al guardar: ' + (err.error?.message || 'Error del servidor'), 'danger', 'alert-circle-outline');
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isPublishing = false;
      this.showToast('Error al procesar la imagen', 'danger', 'alert-circle-outline');
    }
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
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

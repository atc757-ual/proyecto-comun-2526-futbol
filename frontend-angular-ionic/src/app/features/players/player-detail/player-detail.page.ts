import { Component, OnInit, OnDestroy, inject, Input, signal, CUSTOM_ELEMENTS_SCHEMA, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { TsdbHonour, TsdbCareer, TsdbMilestone, TsdbTeam, TsdbLeague, Breadcrumb } from '../../../core/models/tsdb.model';
import { Comment, CommentPayload } from '../../../core/models/comment.model';
import {
  IonIcon, IonCard, IonCardContent, IonButton, IonAvatar, IonSegment, IonSegmentButton, IonLabel,
  IonSpinner, LoadingController, NavController, AlertController, ModalController,
  IonTextarea
} from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/modals/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../core/services/ui/toast.service';
import { addIcons } from 'ionicons';
import {
  star, starOutline, footballOutline, shieldOutline,
  locationOutline, calendarOutline, personOutline,
  statsChartOutline, chatbubbleOutline, chatbubblesOutline, createOutline, trashOutline,
  closeCircleOutline, flagOutline, earthOutline, logoInstagram,
  logoFacebook, logoTwitter, globeOutline, sendOutline,
  checkmarkCircleOutline, checkmarkCircle, alertCircleOutline, heart, heartOutline,
  trophyOutline, chevronUpOutline, chevronDownOutline, personCircleOutline,
  timeOutline, clipboardOutline, businessOutline,
  walkOutline, barbellOutline, resizeOutline, chevronDown, chevronUp,
  peopleOutline, chatbubbleEllipsesOutline, paperPlaneOutline,
  analyticsOutline, closeOutline, checkmarkOutline,
  chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline,
  shield, syncOutline, copyOutline, navigateCircleOutline, shareSocialOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { Player } from '../../../core/models/player.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Geolocation } from '@capacitor/geolocation';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ConfettiService } from 'src/app/core/services/ui/confetti.service';
import { PermissionModalComponent } from 'src/app/shared/components/modals/permission-modal/permission-modal.component';
import { LocationPlugin } from '../../../core/plugins/location-plugin';
import { MapPlugin } from '../../../core/plugins/maps-plugin';
import { ShareCardPlugin } from '../../../core/plugins/share-card-plugin';
import { HapticsPlugin } from '../../../core/plugins/haptics-plugin';
import { PageFullContentComponent } from 'src/app/shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from 'src/app/shared/components/layout/layout-elements/page-footer/page-footer.component';
import { IonContent } from '@ionic/angular/standalone';

import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent, IonButton, IonAvatar,
    IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonTextarea,
    PageFullContentComponent, PageFooterComponent, IonContent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlayerDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  @Input() set id(playerId: string) {
    if (playerId) {
      this.player = null; // Limpiamos rastro anterior
      this.loadPlayer(playerId);

      const from = this.route.snapshot.queryParams['from'];
      if (from === 'universe') {
        this.breadcrumbs = [
          { label: '', url: '/home', icon: 'home-outline' },
          { label: 'Universo de jugadores', url: '/players-all' },
          { label: 'Detalle', url: '' }
        ];
      } else {
        this.breadcrumbs = [
          { label: '', url: '/home', icon: 'home-outline' },
          { label: 'Mi plantilla', url: '/players' },
          { label: 'Detalle', url: '' }
        ];
      }
    }
  }

  private readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  public authService = inject(AuthService);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly navCtrl = inject(NavController);
  private readonly layoutService = inject(LayoutService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastService = inject(ToastService);
  private readonly modalCtrl = inject(ModalController);
  private activePermissionModal: HTMLIonModalElement | null = null;
  private readonly confettiService = inject(ConfettiService);
  private readonly locationService = inject(LocationPlugin);
  private readonly mapPlugin = inject(MapPlugin);
  private readonly shareCardPlugin = inject(ShareCardPlugin);
  private readonly hapticsService = inject(HapticsPlugin);
  private readonly cdr = inject(ChangeDetectorRef);

  public player: Player | null = null;
  public honours: TsdbHonour[] = [];
  public career: TsdbCareer[] = [];
  public milestones: TsdbMilestone[] = [];
  public isCareerExpanded = false;
  public isHonoursExpanded = false;
  public isMilestonesExpanded = false;
  public teamDetails: TsdbTeam[] = [];
  public teamInfo1: TsdbTeam | null = null;
  public teamInfo2: TsdbTeam | null = null;
  public leagueDetails: TsdbLeague | null = null;
  public isLoading = true;
  public isLoadingExtra = false;
  public isLoadingLocation = false;
  public hasGeoPermission = signal(false);
  public isRequestingPermission = false;
  public isAdmin = false;
  public descriptiveLocation: string = '';
  public pageTitle: string = 'Detalle de jugador';
  public pageSubtitle: string = 'Perfil detallado del jugador seleccionado';
  public breadcrumbs: Breadcrumb[] = [];

  // Lógica de "Ver más"
  public isSummaryExpanded = false;
  activeSegment = 'history'; // Variable para controlar las pestañas

  get isOwner(): boolean {
    if (!this.player) return false;
    const ownerId = this.player.user_id || this.player.userId;
    if (!ownerId) return false;
    const currentUid = this.authService.getUID();
    return String(currentUid).trim() === String(ownerId).trim();
  }

  // Lógica de Centro de Comentarios
  public newComment = '';
  public newRating = 5;
  public isSubmittingComment = false;
  public userCoords = signal<{ lat: number; lng: number } | null>(null);
  public editingCommentId: string | null = null;
  public editingContent = '';
  public editingRating = 5;

  // Lógica de Media Flip
  public showCutout = false;

  toggleCardView() {
    this.showCutout = !this.showCutout;
    this.hapticsService.impact('light');
  }

  // Paginación de Comentarios
  public currentPage = 1;
  public commentsPerPage = 4;

  // Lógica de Dashboard (Scroll/Snap)
  public currentStatPage = 0;
  private isDown = false;
  private startX = 0;
  private scrollLeft = 0;

  // Estados de Focus para el Formulario
  public commentFocused = false;

  private readonly destroy$ = new Subject<void>();
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private permissionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    register();
    addIcons({
      star, starOutline, footballOutline, shieldOutline,
      locationOutline, calendarOutline, personOutline,
      statsChartOutline, chatbubbleOutline, createOutline,
      trashOutline, closeCircleOutline, flagOutline,
      earthOutline, logoInstagram, logoFacebook, logoTwitter,
      globeOutline, sendOutline, checkmarkCircleOutline, checkmarkCircle,
      alertCircleOutline, heart, heartOutline,
      trophyOutline, chevronUpOutline, chevronDownOutline,
      personCircleOutline, timeOutline, clipboardOutline, businessOutline,
      walkOutline, barbellOutline, resizeOutline,
      chatbubblesOutline, chevronDown, chevronUp,
      peopleOutline, chatbubbleEllipsesOutline, paperPlaneOutline,
      analyticsOutline, closeOutline, checkmarkOutline,
      chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline,
      shield, syncOutline, copyOutline, navigateCircleOutline, shareSocialOutline
    });
  }

  /**
   * Formatea el nombre del usuario actual (o Invitado) como: Nombre I.
   */
  getFormattedUserName(): string {
    const user = this.authService.currentUser();
    const name = user?.displayName || 'Invitado';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return name;
  }

  ionViewWillLeave() {
    if (this.permissionTimeout) {
      clearTimeout(this.permissionTimeout);
    }
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
  }

  async ngOnInit() {
    this.isAdmin = this.authService.isAdmin();

    // Iniciar Autoplay de Stats
    this.startStatsAutoplay();

    // Verificar permisos de geolocalización iniciales (sin disparar onboarding)
    this.checkGeoPermission();

    // Onboarding automático solo la primera vez (con cooldown)
    this.permissionTimeout = setTimeout(() => {
      this.showPermissionModal(true); // true indica que es automático
    }, 1500);
  }

  ionViewDidEnter() {
    if (this.player?.location?.coordinates) {
      setTimeout(() => {
        this.initDetailMap(this.player!.location!.coordinates![1], this.player!.location!.coordinates![0]);
      }, 300);
    }
  }

  /**
   * Lógica disparada por el BOTÓN de la card.
   * Pide permiso DIRECTAMENTE sin pasar por el modal.
   */
  public async checkPermissionsOnboarding() {
    this.isRequestingPermission = true;
    this.cdr.detectChanges();

    try {
      const granted = await this.locationService.requestGeolocationPermission();
      this.hasGeoPermission.set(granted);

      if (granted) {
        localStorage.setItem('last_permission_prompt_player_detail', Date.now().toString());
        this.captureUserLocation();
      }
    } catch {
      // permiso denegado o error nativo
    } finally {
      this.isRequestingPermission = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Muestra el modal informativo de permisos
   * @param isAuto Si es true, respeta el cooldown de 24h
   */
  private async showPermissionModal(isAuto: boolean = true) {
    const lastPrompt = localStorage.getItem('last_permission_prompt_player_detail');
    const now = Date.now();

    // 1. RE-VERIFICACIÓN REAL: Consultar al navegador directamente antes de abrir
    const isGrantedReal = await this.locationService.isGeolocationPermissionGranted();
    if (isGrantedReal) {
      this.hasGeoPermission.set(true);
      return;
    }

    // 2. Si es automático y hay cooldown de 24h, no molestamos
    if (isAuto && lastPrompt && (now - parseInt(lastPrompt)) < 24 * 60 * 60 * 1000) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: PermissionModalComponent,
      cssClass: 'premium-modal',
      backdropDismiss: false,
      componentProps: { mode: 'commenting' }
    });

    this.activePermissionModal = modal;
    await modal.present();

    const { data } = await modal.onWillDismiss();
    this.checkGeoPermission();
    localStorage.setItem('last_permission_prompt_player_detail', Date.now().toString());
  }

  /**
   * Verifica el estado real de la geolocalización en el navegador
   */
  async checkGeoPermission() {
    const granted = await this.locationService.isGeolocationPermissionGranted();
    this.hasGeoPermission.set(granted);
    if (granted) {
      this.captureUserLocation();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.permissionTimeout) clearTimeout(this.permissionTimeout);
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
    this.mapPlugin.destroyMap();
  }

  startStatsAutoplay() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(() => {
      const el = document.querySelector('.stats-dashboard');
      if (el) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: 150, behavior: 'smooth' });
        }
      }
    }, 4000); // Se mueve cada 4 segundos
  }

  async loadPlayer(id: string) {
    this.isLoading = true;
    try {
      this.playerService.getPlayer(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (player) => {
          this.player = player;
          this.isLoading = false;

          if (player.tsdb_ids?.player_id) {
            this.loadExtraData(player.tsdb_ids.player_id);
          }

          if (player.tsdb_ids?.team_id) {
            this.loadTeamsInfo(player.tsdb_ids.team_id, player.tsdb_ids.team_id2);
          }

          if (player.tsdb_ids?.league_id) {
            this.loadLeagueInfo(player.tsdb_ids.league_id);
          }

          const currentUid = this.authService.getUID();
          const pUserId = player.user_id ? String(player.user_id).trim() : '';
          const cUid = currentUid ? String(currentUid).trim() : '';

          // CONCEPTO 1: Ubicación Scouting (Solo si soy dueño y hay coordenadas en BD)
          const reallyIsOwner = pUserId === cUid;

          if (reallyIsOwner && player.location?.coordinates && player.location.coordinates.length >= 2) {
            this.loadDescriptiveLocation(player.location.coordinates[1], player.location.coordinates[0]);
          }

          setTimeout(() => {
            this.startStatsAutoplay();
          }, 500);

          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401 || err.status === 403) {
            this.navCtrl.navigateRoot(`/player-detail-public/${id}`);
          } else {
            this.showToast('Error al cargar el perfil del jugador', 'danger');
          }
        }
      });
    } catch (error) {
      this.isLoading = false;
    }
  }

  loadExtraData(tsdbId: string) {
    this.isLoadingExtra = true;
    forkJoin({
      career: this.playerService.getPlayerTeamsHistory(tsdbId),
      honours: this.playerService.getPlayerHonours(tsdbId),
      milestones: this.playerService.getPlayerMilestones(tsdbId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.career = res.career;
        this.honours = res.honours;
        this.milestones = res.milestones;
        this.isLoadingExtra = false;
      },
      error: () => this.isLoadingExtra = false
    });
  }

  // Lógica de límites dinámicos
  get itemsLimit(): number {
    return window.innerWidth < 768 ? 2 : 8;
  }

  // Getters para listas truncadas
  get visibleCareer() {
    return this.isCareerExpanded ? this.career : this.career.slice(0, this.itemsLimit);
  }

  get visibleHonours() {
    return this.isHonoursExpanded ? this.honours : this.honours.slice(0, this.itemsLimit);
  }

  get visibleMilestones() {
    return this.isMilestonesExpanded ? this.milestones : this.milestones.slice(0, this.itemsLimit);
  }

  toggleCareer() { this.isCareerExpanded = !this.isCareerExpanded; }
  toggleHonours() { this.isHonoursExpanded = !this.isHonoursExpanded; }
  toggleMilestones() { this.isMilestonesExpanded = !this.isMilestonesExpanded; }

  loadTeamsInfo(teamId: string, teamId2?: string) {
    this.teamDetails = [];
    this.teamInfo1 = null;
    this.teamInfo2 = null;

    this.playerService.lookupTSDBTeam(teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: TsdbTeam) => {
        if (res) {
          this.teamInfo1 = res;
          this.teamDetails.push(res);
        }
      },
      error: (err) => console.error('Error loading team 1 details:', err)
    });

    if (teamId2) {
      this.playerService.lookupTSDBTeam(teamId2).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: TsdbTeam) => {
          if (res) {
            this.teamInfo2 = res;
            this.teamDetails.push(res);
          }
        },
        error: (err) => console.error('Error loading team 2 details:', err)
      });
    }
  }

  loadLeagueInfo(leagueId: string) {
    this.playerService.lookupTSDBLeague(leagueId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: TsdbLeague) => { this.leagueDetails = res; },
      error: (err) => console.warn('Error loading league info:', err)
    });
  }

  async toggleFavorite(event?: MouseEvent) {
    if (!this.player?._id || !this.isOwner) return;
    const newStatus = !this.player.isFavorite;

    // UI Optimista
    this.player.isFavorite = newStatus;

    // Si se activa, disparamos confeti dorado del servicio
    if (newStatus) {
      this.confettiService.goldCelebrate();
    }

    this.playerService.toggleFavorite(this.player._id, newStatus).subscribe({
      next: (updatedPlayer) => {
        const msg = newStatus ? 'Añadido a tus favoritos' : 'Eliminado de favoritos';
        this.showToast(msg, 'success');
      },
      error: () => {
        if (this.player) this.player.isFavorite = !newStatus;
        this.showToast('Error al actualizar favorito', 'danger');
      }
    });
  }


  async deletePlayer() {
    if (!this.player?._id) return;

    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar de la plantilla?',
        message: `Esta acción borrará definitivamente a ${this.player.name}.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'No, cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.playerService.deletePlayer(this.player._id!).subscribe({
        next: () => {
          this.showToast('Ficha eliminada con éxito', 'success');
          this.navCtrl.navigateRoot('/players');
        },
        error: () => this.showToast('Error al procesar la baja', 'danger')
      });
    }
  }

  // --- CENTRO DE COMENTARIOS V2 ---

  startEditing(comment: Comment) {
    this.editingCommentId = comment.id || comment._id || null;
    this.editingContent = comment.content;
    this.editingRating = comment.rating;
  }

  cancelEditing() {
    this.editingCommentId = null;
    this.editingContent = '';
  }

  async saveCommentEdit() {
    if (!this.player?._id || !this.editingCommentId || !this.editingContent.trim()) return;

    const commentId = this.editingCommentId;
    this.playerService.updateComment(this.player._id, commentId, {
      content: this.editingContent,
      rating: this.editingRating
    }).subscribe({
      next: () => {
        this.showToast('Comentario actualizado', 'success');
        this.editingCommentId = null;
        this.loadPlayer(this.player!._id!);
      },
      error: () => this.showToast('Error al actualizar', 'danger')
    });
  }

  async deleteComment(commentId: string) {
    if (!this.player?._id) return;

    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar comentario?',
        message: 'Esta opinión se borrará permanentemente.',
        confirmText: 'Borrar',
        cancelText: 'Cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.playerService.deleteComment(this.player._id!, commentId).subscribe({
        next: () => {
          this.showToast('Eliminado', 'success');
          this.loadPlayer(this.player!._id!);
        },
        error: () => this.showToast('Error al borrar', 'danger')
      });
    }
  }

  setRating(rating: number, isEditing: boolean = false) {
    if (isEditing) {
      this.editingRating = rating;
    } else {
      this.newRating = rating;
    }
  }


  async submitComment() {
    if (!this.newComment.trim() || !this.player?._id) return;

    this.isSubmittingComment = true;
    const user = this.authService.userData();

    const commentData: CommentPayload = {
      content: this.newComment,
      rating: this.newRating,
      autor_name: user?.name || 'Usuario Scouting',
      user_id: user?.firebaseUid || user?.uid || ''
    };

    // Intentar capturar ubicación si tenemos permiso
    if (this.hasGeoPermission()) {
      const cachedCoords = this.userCoords();
      if (cachedCoords) {
        commentData.location = {
          type: 'Point',
          coordinates: [cachedCoords.lng, cachedCoords.lat]
        };
      } else {
        try {
          const coordinates = await Geolocation.getCurrentPosition({ timeout: 5000 });
          console.log('[GEOLOCATION] Coordenadas obtenidas en submit:', coordinates);
          this.userCoords.set({
            lat: coordinates.coords.latitude,
            lng: coordinates.coords.longitude
          });
          commentData.location = {
            type: 'Point',
            coordinates: [coordinates.coords.longitude, coordinates.coords.latitude]
          };
        } catch (err) {
          console.warn('[PLAYER-DETAIL] No se pudo obtener ubicación vía plugin:', err);
        }
      }
    }

    this.playerService.addComment(this.player._id, commentData).subscribe({
      next: () => {
        this.showToast('¡Gracias por tu comentario!', 'success');
        this.newComment = '';
        this.newRating = 5;
        this.isSubmittingComment = false;
        this.loadPlayer(this.player!._id!);
      },
      error: () => {
        this.showToast('No se pudo publicar', 'danger');
        this.isSubmittingComment = false;
      }
    });
  }

  // --- PAGINACIÓN DE COMENTARIOS ---
  get pagedComments() {
    const comments = this.player?.comments || [];
    const startIndex = (this.currentPage - 1) * this.commentsPerPage;
    return comments.slice(startIndex, startIndex + this.commentsPerPage);
  }

  totalPages(): number {
    const commentsCount = this.player?.comments?.length || 0;
    return Math.ceil(commentsCount / this.commentsPerPage);
  }

  getPages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages()) this.currentPage++; }

  // --- INTERACTIVIDAD DASHBOARD ---
  onStatScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollPercent = element.scrollLeft / (element.scrollWidth - element.clientWidth);
    this.currentStatPage = Math.round(scrollPercent * 2);
  }

  onMouseDown(e: MouseEvent) {
    const element = e.currentTarget as HTMLElement;
    this.isDown = true;
    element.classList.add('grabbing');
    this.startX = e.pageX - element.offsetLeft;
    this.scrollLeft = element.scrollLeft;
  }

  onMouseLeave() {
    this.isDown = false;
    const element = document.querySelector('.stats-dashboard');
    element?.classList.remove('grabbing');
  }

  onMouseUp() {
    this.isDown = false;
    const element = document.querySelector('.stats-dashboard');
    element?.classList.remove('grabbing');
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDown) return;
    e.preventDefault();
    const element = e.currentTarget as HTMLElement;
    const x = e.pageX - element.offsetLeft;
    const walk = (x - this.startX) * 2;
    element.scrollLeft = this.scrollLeft - walk;
  }

  toggleSummary() {
    this.isSummaryExpanded = !this.isSummaryExpanded;
  }

  canDeleteComment(comment: Comment): boolean {
    if (this.isAdmin) return true;
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === comment.user_id;
  }

  getRatingStars(rating: number = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'star' : 'star-outline');
    }
    return stars;
  }

  private showToast(message: string, color: string) {
    if (color === 'success') {
      this.toastService.showSuccess(message);
    } else {
      this.toastService.showError(message);
    }
  }

  private loadDescriptiveLocation(lat: number, lng: number) {
    this.isLoadingLocation = true;
    this.playerService.reverseGeocode(lat, lng).pipe(takeUntil(this.destroy$)).subscribe({
      next: (addr) => {
        this.descriptiveLocation = addr;
        this.isLoadingLocation = false;
        setTimeout(() => this.initDetailMap(lat, lng), 1000);
      },
      error: () => {
        this.isLoadingLocation = false;
        setTimeout(() => this.initDetailMap(lat, lng), 1000);
      }
    });
  }

  private readonly zone = inject(NgZone);

  private initDetailMap(lat: number, lng: number, retryCount = 0) {
    if (!this.player?._id) return;
    const elementId = `map-${this.player._id}`;
    const mapContainer = document.getElementById(elementId);

    if (!mapContainer) {
      if (retryCount < 20) {
        console.warn(`[PLAYER-DETAIL] Buscando contenedor #${retryCount + 1}... ID: ${elementId}`);
        setTimeout(() => this.initDetailMap(lat, lng, retryCount + 1), 500);
      }
      return;
    }

    console.log(`[PLAYER-DETAIL] Contenedor ${elementId} encontrado. Lat: ${lat}, Lng: ${lng}`);

    try {
      this.zone.runOutsideAngular(async () => {
        // Inicializar con el ID dinámico
        const mapObj = await this.mapPlugin.initMap(elementId, lat, lng, 14);

        if (mapObj) {
          this.mapPlugin.addMarker(lat, lng, undefined, false);

          // Refrescar tamaño múltiples veces (crítico en Ionic)
          [200, 800, 2000, 4000].forEach(delay => {
            setTimeout(() => {
              try {
                if (mapObj && (mapObj as any)._container) {
                  mapObj.invalidateSize();
                  window.dispatchEvent(new Event('resize'));
                }
              } catch (e) {
                // Capturar silenciosamente si ya fue destruido en la navegación
              }
            }, delay);
          });
        }
      });
    } catch (err) {
      console.error('[PLAYER-DETAIL] Error inicializando mapa:', err);
    }
  }

  private async captureUserLocation() {
    if (!this.hasGeoPermission()) return;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000
      });

      if (pos?.coords) {
        this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
    } catch {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {},
          { timeout: 10000 }
        );
      }
    }
  }

  getSafeImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.includes('thesportsdb.com') || url.startsWith('http')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  async sharePlayerCard(cardElement: HTMLElement) {
    if (!this.player) return;
    this.hapticsService.impact('medium');
    const loading = await this.loadingCtrl.create({
      message: 'Generando imagen de la ficha...',
      duration: 10000
    });
    await loading.present();

    try {
      const success = await this.shareCardPlugin.shareElementAsImage(cardElement, this.player.name);
      if (success) {
        this.hapticsService.notification('success');
        this.toastService.showSuccess('Ficha compartida con éxito');
      } else {
        throw new Error('Plugin returned false');
      }
    } catch (error) {
      this.hapticsService.notification('error');
      this.toastService.showError('No se pudo compartir la ficha');
    } finally {
      await loading.dismiss();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByCommentId(_: number, comment: { _id?: string; id?: string }): string | undefined {
    return comment._id ?? comment.id;
  }
}


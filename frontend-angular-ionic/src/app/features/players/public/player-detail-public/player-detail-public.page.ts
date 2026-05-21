import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef, effect, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonCard, IonCardContent,
  IonButton, IonAvatar,
  IonSpinner, NavController, ModalController,
  IonInput, IonTextarea
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { addIcons } from 'ionicons';
import {
  star, starOutline, football, footballOutline, shieldOutline,
  locationOutline, calendarOutline, personOutline,
  statsChartOutline, chatbubbleOutline, chatbubblesOutline, createOutline, trashOutline,
  closeCircleOutline, flagOutline, earthOutline, logoInstagram,
  logoFacebook, logoTwitter, globeOutline, sendOutline,
  checkmarkCircleOutline, checkmarkCircle, alertCircleOutline, heart, heartOutline,
  trophyOutline, chevronUpOutline, chevronDownOutline, personCircleOutline,
  timeOutline, clipboardOutline, businessOutline,
  walkOutline, barbellOutline, resizeOutline, chevronDown, chevronUp,
  peopleOutline, chatbubbleEllipsesOutline, paperPlaneOutline, logInOutline,
  chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline,
  syncOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { Player } from '../../../../core/models/player.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { ConfettiService } from '../../../../core/services/ui/confetti.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PermissionModalComponent } from 'src/app/shared/components/permission-modal/permission-modal.component';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { Geolocation } from '@capacitor/geolocation';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-player-detail-public',
  templateUrl: './player-detail-public.page.html',
  styleUrls: ['./player-detail-public.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent, IonButton, IonAvatar,
    IonSpinner, IonInput, IonTextarea
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlayerDetailPublicPage implements OnInit, OnDestroy {
  private _playerId: string = '';
  @Input() set id(playerId: string) {
    if (playerId) {
      this._playerId = playerId;
      this.player = null; // Limpiamos rastro anterior
      this.loadPlayer(playerId);
      this.captureUserLocation();
    }
  }

  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private modalCtrl = inject(ModalController);
  private confettiService = inject(ConfettiService);
  private toastService = inject(ToastService);
  private locationService = inject(LocationPlugin);
  private cdr = inject(ChangeDetectorRef);

  public player: Player | null = null;
  public leagueDetails: any = null;
  public isLoading = true;
  public hasGeoPermission = signal(false);
  public isRequestingPermission = false;
  private activePermissionModal: any = null;
  public isAdmin = false;

  // Lógica de "Ver más"
  public isSummaryExpanded = false;
  public teamDetails: any[] = [];
  public teamInfo1: any = null;
  public teamInfo2: any = null;
  activeSegment = 'history'; // Variable para controlar las pestañas

  get isOwner(): boolean {
    if (!this.player || !this.player.user_id) return false;
    const currentUid = this.authService.getUID();
    return String(currentUid).trim() === String(this.player.user_id).trim();
  }

  get isLoggedIn(): boolean {
    return !!this.authService.currentUser();
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
  }
  public anonymousName = '';

  /**
   * Formatea el nombre del usuario (o Invitado) como: Nombre I.
   */
  getFormattedUserName(): string {
    const user = this.authService.currentUser();
    const name = user?.displayName || this.anonymousName || 'Invitado';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return name;
  }

  // Estados de foco para inputs (Estilo Login)
  nameFocused: boolean = false;
  commentFocused: boolean = false;

  // Paginación de comentarios (Estilo Players)
  currentPage: number = 1;
  pageSize: number = 5;

  // Control de Swiper de Stats
  currentStatPage: number = 0;
  private statsInterval: any;

  constructor() {
    register();
    addIcons({
      star, starOutline, football, footballOutline, shieldOutline, logInOutline,
      locationOutline, calendarOutline, personOutline, syncOutline,
      statsChartOutline, chatbubbleOutline, chatbubblesOutline, createOutline, trashOutline,
      closeCircleOutline, flagOutline, earthOutline, logoInstagram,
      logoFacebook, logoTwitter, globeOutline, sendOutline,
      checkmarkCircleOutline, checkmarkCircle, alertCircleOutline, heart, heartOutline,
      trophyOutline, chevronUpOutline, chevronDownOutline, personCircleOutline,
      timeOutline, clipboardOutline, businessOutline,
      walkOutline, barbellOutline, resizeOutline, chevronDown, chevronUp,
      peopleOutline, chatbubbleEllipsesOutline, paperPlaneOutline,
      chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline
    });
  }

  ionViewWillLeave() {
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
  }


  async ngOnInit() {

    this.layoutService.setHeader({
      title: 'Detalle de Jugador',
      subtitle: 'Información básica del jugador',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/login', icon: 'log-in-outline' },
      { label: 'Jugadores', url: '/players-public', icon: '' },
      { label: 'Detalle', url: '' }
    ]);

    // Iniciar Autoplay de Stats
    this.startStatsAutoplay();

    // Verificar permisos de geolocalización iniciales
    this.checkGeoPermission();
  }

  /**
   * Lógica disparada por el BOTÓN de la card.
   * Pide permiso DIRECTAMENTE sin pasar por el modal.
   */
  public async checkPermissionsOnboarding() {
    console.log('[PLAYER-DETAIL-PUBLIC] Botón pulsado: Pidiendo permiso vía LocationPlugin...');
    this.isRequestingPermission = true;
    this.cdr.detectChanges();

    try {
      const granted = await this.locationService.requestGeolocationPermission();
      this.hasGeoPermission.set(granted);

      if (granted) {
        console.log('[PLAYER-DETAIL-PUBLIC] Permiso concedido vía plugin.');
        localStorage.setItem('last_permission_prompt_player_detail_public', Date.now().toString());
        this.captureUserLocation();
      } else {
        console.warn('[PLAYER-DETAIL-PUBLIC] Permiso denegado o cerrado silenciosamente.');
      }
    } catch (err) {
      console.error('[PLAYER-DETAIL-PUBLIC] Error solicitando permisos:', err);
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
    const lastPrompt = localStorage.getItem('last_permission_prompt_player_detail_public');
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
    localStorage.setItem('last_permission_prompt_player_detail_public', Date.now().toString());
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

  private async captureUserLocation() {
    console.log('%c[GPS-PUBLIC] INTENTO DE CAPTURA...', 'color: #2dd36f; font-weight: bold; font-size: 12px;');

    if (!this.hasGeoPermission()) {
      console.warn('[GPS-PUBLIC] Captura abortada: No hay permisos concedidos aún.');
      return;
    }

    try {
      console.log('%c[GPS-PUBLIC] PERMISOS OK. BUSCANDO SEÑAL...', 'color: #2dd36f; font-weight: bold; font-size: 12px;');

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000
      });

      if (pos && pos.coords) {
        this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        console.log('%c[GPS-PUBLIC] CAPTURADO CON ÉXITO (Capacitor)', 'background: #2dd36f; color: white; padding: 4px 8px; border-radius: 4px;');
        console.table({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: pos.coords.accuracy + 'm'
        });
      }
    } catch (err: any) {
      console.warn('[GPS-PUBLIC] Capacitor falló, intentando fallback nativo...', err);

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            console.log('%c[GPS-PUBLIC] CAPTURADO CON ÉXITO (Nativo)', 'background: #2dd36f; color: white; padding: 4px 8px; border-radius: 4px;');
            console.table({
              latitud: pos.coords.latitude,
              longitud: pos.coords.longitude,
              metodo: 'Nativo Navegador'
            });
          },
          (geoErr) => {
            console.error('[GPS-PUBLIC] FALLO CRÍTICO:', geoErr.message);
            this.userCoords.set({ lat: 40.4168, lng: -3.7038 });
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        console.error('[GPS-PUBLIC] Geolocation API no soportada por este navegador.');
        this.userCoords.set({ lat: 40.4168, lng: -3.7038 });
      }
    }
  }

  ngOnDestroy() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
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
      this.playerService.getPublicPlayer(id).subscribe({
        next: (player) => {
          this.player = player;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('[PlayerDetailPublic] Error crítico al cargar jugador:', err);
          this.toastService.showError('Jugador no encontrado o perfil no disponible');
          this.isLoading = false;
          this.navCtrl.navigateRoot('/players-public');
        }
      });
    } catch (error) {
      console.error('[PlayerDetailPublic] Excepción en loadPlayer:', error);
      this.isLoading = false;
      this.navCtrl.navigateRoot('/players-public');
    }
  }

  // Lógica de límites dinámicos
  get itemsLimit(): number {
    return window.innerWidth < 768 ? 2 : 8;
  }

  async toggleFavorite(event?: MouseEvent) {
    if (!this.player?._id) return;
    const newStatus = !this.player.isFavorite;

    // UI Optimista
    this.player.isFavorite = newStatus;

    // Si se activa, disparamos confeti dorado del servicio
    if (newStatus) {
      this.confettiService.goldCelebrate();
    }

    this.playerService.toggleFavorite(this.player._id, newStatus).subscribe({
      next: () => {
        const msg = newStatus ? 'Añadido a tus favoritos' : 'Eliminado de favoritos';
        this.toastService.showSuccess(msg);
      },
      error: () => {
        if (this.player) this.player.isFavorite = !newStatus;
        this.toastService.showError('Error al actualizar favorito');
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
        confirmText: 'Confirmar Baja',
        cancelText: 'Cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.playerService.deletePlayer(this.player._id!).subscribe({
        next: () => {
          this.toastService.showSuccess('Ficha eliminada con éxito');
          this.navCtrl.navigateRoot('/players-public');
        },
        error: () => this.toastService.showError('Error al procesar la baja')
      });
    }
  }

  // --- CENTRO DE COMENTARIOS V2 ---

  startEditing(comment: any) {
    this.editingCommentId = comment.id || comment._id;
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
        this.toastService.showSuccess('Comentario actualizado');
        this.editingCommentId = null;
        this.loadPlayer(this.player!._id!);
      },
      error: () => this.toastService.showError('Error al actualizar')
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
          this.toastService.showSuccess('Comentario eliminado');
          this.loadPlayer(this.player!._id!);
        },
        error: () => this.toastService.showError('Error al borrar')
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
    const user = this.authService.currentUser();

    const commentData: any = {
      content: this.newComment,
      rating: this.newRating,
      autor_name: user?.displayName || this.anonymousName || 'Invitado'
    };

    if (user?.uid) {
      commentData.user_id = user.uid;
    }

    // Intentar capturar ubicación si tenemos permiso
    if (this.hasGeoPermission()) {
      const cachedCoords = this.userCoords();
      if (cachedCoords) {
        commentData.location = {
          type: 'Point',
          coordinates: [cachedCoords.lng, cachedCoords.lat]
        };
        console.log('[PLAYER-DETAIL-PUBLIC] Enviando con ubicación capturada:', cachedCoords);
      } else {
        try {
          const coordinates = await Geolocation.getCurrentPosition({ timeout: 5000 });
          console.log('[GEOLOCATION-PUBLIC] Coordenadas obtenidas en submit:', coordinates);
          this.userCoords.set({
            lat: coordinates.coords.latitude,
            lng: coordinates.coords.longitude
          });
          commentData.location = {
            type: 'Point',
            coordinates: [coordinates.coords.longitude, coordinates.coords.latitude]
          };
        } catch (err) {
          console.warn('[PLAYER-DETAIL-PUBLIC] No se pudo obtener ubicación vía plugin:', err);
        }
      }
    }

    this.playerService.addPublicComment(this.player._id, commentData).subscribe({
      next: () => {
        this.toastService.showSuccess('¡Gracias por tu comentario!');
        this.newComment = '';
        this.newRating = 5;
        this.isSubmittingComment = false;
        this.loadPlayer(this.player!._id!);
      },
      error: () => {
        this.toastService.showError('No se pudo publicar');
        this.isSubmittingComment = false;
      }
    });
  }

  toggleSummary() {
    this.isSummaryExpanded = !this.isSummaryExpanded;
  }

  // --- LÓGICA DE PAGINACIÓN (Estilo Players) ---
  totalPages(): number {
    if (!this.player?.comments) return 0;
    return Math.ceil(this.player.comments.length / this.pageSize);
  }

  pagedComments(): any[] {
    if (!this.player?.comments) return [];
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.player.comments.slice(startIndex, startIndex + this.pageSize);
  }

  getPages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page;
    const el = document.querySelector('.comment-center-header');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  prevPage() {
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.goToPage(this.currentPage + 1);
  }



  onStatScroll(event: any) {
    const scrollLeft = event.target.scrollLeft;
    const width = event.target.offsetWidth;
    this.currentStatPage = Math.round(scrollLeft / (width * 0.9)); // Ajuste por el gap

    // Si el usuario hace scroll manual, pausamos y reiniciamos el autoplay
    this.startStatsAutoplay();
  }

  // --- LÓGICA DE DRAG PARA ESCRITORIO ---
  isDragging = false;
  startX = 0;
  scrollLeftStart = 0;

  onMouseDown(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    this.isDragging = true;
    el.classList.add('grabbing');
    this.startX = e.pageX - el.offsetLeft;
    this.scrollLeftStart = el.scrollLeft;
    if (this.statsInterval) clearInterval(this.statsInterval);
  }

  onMouseLeave() {
    this.isDragging = false;
    const el = document.querySelector('.stats-dashboard') as HTMLElement;
    if (el) el.classList.remove('grabbing');
    this.startStatsAutoplay();
  }

  onMouseUp() {
    this.isDragging = false;
    const el = document.querySelector('.stats-dashboard') as HTMLElement;
    if (el) el.classList.remove('grabbing');
    this.startStatsAutoplay();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - this.startX) * 2; // Velocidad de arrastre
    el.scrollLeft = this.scrollLeftStart - walk;
  }

  canDeleteComment(comment: any): boolean {
    return false; // No se permite borrar en la vista pública
  }

  getRatingStars(rating: number = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'star' : 'star-outline');
    }
    return stars;
  }


  getSafeImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.includes('thesportsdb.com') || url.startsWith('http')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  handleImageError(event: any) {
    event.target.onerror = null;
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgODAwIDgwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiM0NzU1NjkiPjQwNDwvdGV4dD48L3N2Zz4=';
  }
}

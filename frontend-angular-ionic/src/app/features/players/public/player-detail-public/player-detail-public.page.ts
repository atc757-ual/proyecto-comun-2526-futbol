import { Component, Input, inject, OnInit, ChangeDetectorRef, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  IonIcon, IonCard, IonCardContent,
  IonButton, IonAvatar, IonBadge, IonSegment, IonSegmentButton, IonLabel,
  IonSpinner, LoadingController, NavController, AlertController, ToastController, ModalController,
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
  peopleOutline, chatbubbleEllipsesOutline, paperPlaneOutline,
  chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline
} from 'ionicons/icons';
import { Player } from '../../../../core/models/player.model';
import { PlayerService } from '../../../../core/services/player.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { ConfettiService } from '../../../../core/services/confetti.service';
import { PermissionModalComponent } from 'src/app/shared/components/permission-modal/permission-modal.component';

@Component({
  selector: 'app-player-detail-public',
  templateUrl: './player-detail-public.page.html',
  styleUrls: ['./player-detail-public.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent,
    IonButton, IonSpinner, IonBadge, IonAvatar,
    IonInput, IonTextarea
  ]
})
export class PlayerDetailPublicPage implements OnInit {
  private _playerId: string = '';
  @Input() set id(playerId: string) {
    if (playerId) {
      this._playerId = playerId;
      // Si ya hay sesión, redirigimos inmediatamente
      if (this.authService.currentUser()) {
        this.navCtrl.navigateRoot(`/player-detail/${playerId}`);
        return;
      }
      this.player = null; // Limpiamos rastro anterior
      this.loadPlayer(playerId);
    }
  }

  private playerService = inject(PlayerService);
  private authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private confettiService = inject(ConfettiService);

  public player: Player | null = null;
  public leagueDetails: any = null;
  public isLoading = true;
  public hasGeoPermission = signal(false);
  private activePermissionModal: any = null;
  public isAdmin = false;

  // Lógica de "Ver más"
  public isSummaryExpanded = false;
  activeSegment = 'history'; // Variable para controlar las pestañas

  get isOwner(): boolean {
    if (!this.player || !this.player.user_id) return false;
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === this.player.user_id;
  }

  get isLoggedIn(): boolean {
    return !!this.authService.currentUser();
  }

  // Lógica de Centro de Comentarios
  public newComment = '';
  public newRating = 5;
  public isSubmittingComment = false;
  public editingCommentId: string | null = null;
  public editingContent = '';
  public editingRating = 5;
  public anonymousName = '';

  // Estados de foco para inputs (Estilo Login)
  nameFocused: boolean = false;
  commentFocused: boolean = false;

  // Paginación de comentarios (Estilo Players)
  currentPage: number = 1;
  pageSize: number = 5;

  // Control de Swiper de Stats
  currentStatPage: number = 0;
  private statsInterval: any;
  private permissionTimeout: any = null;

  constructor() {
    addIcons({
      star, starOutline, football, footballOutline, shieldOutline,
      locationOutline, calendarOutline, personOutline,
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

    // Redirección reactiva
    effect(() => {
      if (this.authService.currentUser()) {
        console.warn('[PlayerDetailPublic] Sesión detectada. Redirigiendo...');
        this.navCtrl.navigateRoot(`/player-detail/${this._playerId}`);
      }
    });
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
    // Si hay sesión iniciada, expulsamos al usuario al detalle privado
    if (this.authService.currentUser()) {
      console.warn('[PlayerDetailPublic] Sesión activa detectada. Redirigiendo a Detalle Privado.');
      this.navCtrl.navigateRoot(`/player-detail/${this._playerId}`);
      return;
    }

    this.layoutService.setHeader({
      title: 'Detalle de Jugador',
      subtitle: 'Información básica del jugador',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: 'Login', url: '/login', icon: '' },
      { label: 'Jugadores', url: '/players-public', icon: '' },
      { label: 'Detalle de jugador', url: '' }
    ]);
    
    // Iniciar Autoplay de Stats
    this.startStatsAutoplay();

    // Verificar permisos de geolocalización iniciales
    this.checkGeoPermission();

    // Onboarding automático solo la primera vez (con cooldown)
    this.permissionTimeout = setTimeout(() => {
      this.showPermissionModal(true); // true indica que es automático
    }, 1500);
  }

  /**
   * Lógica disparada por el BOTÓN de la card.
   * Pide permiso DIRECTAMENTE sin pasar por el modal.
   */
  public async checkPermissionsOnboarding() {
    console.log('[PLAYER-DETAIL-PUBLIC] Botón pulsado: Pidiendo permiso directamente...');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[PLAYER-DETAIL-PUBLIC] Permiso concedido vía botón.');
        this.hasGeoPermission.set(true);
        localStorage.setItem('last_permission_prompt_player_detail_public', Date.now().toString());
      },
      (err) => {
        // Ignoramos el timeout (code 3) porque el usuario puede tardar en decidir
        if (err.code !== 3) {
          console.warn('[PLAYER-DETAIL-PUBLIC] Petición fallida:', err);
          this.showToast('No se pudo obtener la ubicación. Por favor, revisa los permisos de tu navegador.', 'danger');
        }
      },
      { enableHighAccuracy: true } // Sin timeout
    );
  }

  /**
   * Muestra el modal informativo de permisos
   * @param isAuto Si es true, respeta el cooldown de 24h
   */
  private async showPermissionModal(isAuto: boolean = true) {
    const lastPrompt = localStorage.getItem('last_permission_prompt_player_detail_public');
    const now = Date.now();

    // Si es automático y hay cooldown, no molestamos
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
    try {
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' as any });
        this.hasGeoPermission.set(status.state === 'granted');
        
        status.onchange = () => {
          this.hasGeoPermission.set(status.state === 'granted');
        };
      } else {
        (navigator as any).geolocation.getCurrentPosition(
          () => this.hasGeoPermission.set(true),
          () => this.hasGeoPermission.set(false)
        );
      }
    } catch (e) {
      console.warn('[PLAYER-DETAIL-PUBLIC] Error verificando permisos:', e);
    }
  }

  ngOnDestroy() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.permissionTimeout) clearTimeout(this.permissionTimeout);
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

          this.isLoading = false;
        },
        error: (err) => {
          console.error('[PlayerDetailPublic] Error crítico al cargar jugador:', err);
          this.showToast('Error al cargar el perfil del jugador', 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('[PlayerDetailPublic] Excepción en loadPlayer:', error);
      this.isLoading = false;
    }
  }

  // Lógica de límites dinámicos
  get itemsLimit(): number {
    return window.innerWidth < 768 ? 3 : 8;
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
      next: (updatedPlayer) => {
        const msg = newStatus ? 'Añadido a tus favoritos' : 'Eliminado de favoritos';
        this.showToast(msg, 'success', newStatus ? 'heart' : 'heart-outline');
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
          this.showToast('Ficha eliminada con éxito', 'success');
          this.navCtrl.navigateRoot('/players');
        },
        error: () => this.showToast('Error al procesar la baja', 'danger')
      });
    }
  }

  // --- CENTRO DE COMENTARIOS V2 ---

  startEditing(comment: any) {
    this.editingCommentId = comment._id;
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
        this.showToast('Comentario actualizado', 'success', 'checkmark-circle-outline');
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
          this.showToast('Eliminado', 'success', 'trash-outline');
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
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, 
            timeout: 5000 
          });
        });
        commentData.latitude = position.coords.latitude;
        commentData.longitude = position.coords.longitude;
        console.log('[PLAYER-DETAIL-PUBLIC] Ubicación capturada:', commentData.latitude, commentData.longitude);
      } catch (err) {
        console.warn('[PLAYER-DETAIL-PUBLIC] Error capturando ubicación rápida:', err);
      }
    }

    this.playerService.addPublicComment(this.player._id, commentData).subscribe({
      next: () => {
        this.showToast('¡Gracias por tu opinión!', 'success', 'chatbubble-outline');
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

  private async showToast(message: string, color: string, icon: string = 'alert-circle-outline') {
    // Mapeo de clases de éxito/error personalizadas
    const customClass = color === 'success' ? 'toast-success' : (color === 'danger' ? 'toast-error' : 'player-toast');

    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color: color === 'success' || color === 'danger' ? undefined : color,
      cssClass: customClass,
      mode: 'ios',
      icon: icon
    });
    toast.present();
  }

  handleImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800';
  }
}

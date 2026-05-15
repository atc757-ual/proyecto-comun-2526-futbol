import { Component, OnInit, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  IonIcon, IonCard, IonCardContent, IonButton, IonAvatar, IonBadge, IonSegment, IonSegmentButton, IonLabel,
  IonSpinner, LoadingController, NavController, AlertController, ToastController, ModalController,
  IonTextarea
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
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
  chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline
} from 'ionicons/icons';
import { Player } from '../../../core/models/player.model';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfettiService } from 'src/app/core/services/confetti.service';
import { PermissionModalComponent } from 'src/app/shared/components/permission-modal/permission-modal.component';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent,
    IonButton, IonSpinner, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonAvatar,
    IonTextarea
  ]
})
export class PlayerDetailPage implements OnInit {
  @Input() set id(playerId: string) {
    if (playerId) {
      this.player = null; // Limpiamos rastro anterior
      this.loadPlayer(playerId);
    }
  }

  private playerService = inject(PlayerService);
  public authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private activePermissionModal: any = null;
  private confettiService = inject(ConfettiService);

  public player: Player | null = null;
  public honours: any[] = [];
  public career: any[] = [];
  public milestones: any[] = [];
  public isCareerExpanded = false;
  public isHonoursExpanded = false;
  public isMilestonesExpanded = false;
  public teamDetails: any[] = [];
  public leagueDetails: any = null;
  public isLoading = true;
  public isLoadingExtra = false;
  public isLoadingLocation = false;
  public hasGeoPermission = signal(false);
  public isAdmin = false;

  // Lógica de "Ver más"
  public isSummaryExpanded = false;
  activeSegment = 'history'; // Variable para controlar las pestañas

  get isOwner(): boolean {
    if (!this.player || !this.player.user_id) return false;
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === this.player.user_id;
  }

  // Lógica de Centro de Comentarios
  public newComment = '';
  public newRating = 5;
  public isSubmittingComment = false;
  public editingCommentId: string | null = null;
  public editingContent = '';
  public editingRating = 5;

  // Paginación de Comentarios
  public currentPage = 1;
  public commentsPerPage = 4;

  // Lógica de Dashboard (Scroll/Snap)
  public currentStatPage = 0;
  private isDown = false;
  private startX = 0;
  private scrollLeft = 0;

  // Estados de Focus para el Formulario
  public nameFocused = false;
  public commentFocused = false;

  private statsInterval: any;
  private permissionTimeout: any = null;

  constructor() {
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
      chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline
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
    this.layoutService.setHeader({
      title: 'Detalle de jugador',
      subtitle: 'Perfil detallado del jugador seleccionado',
      showHero: true
    });
    this.isAdmin = this.authService.isAdmin();

    // Iniciar Autoplay de Stats
    this.startStatsAutoplay();

    // Verificar permisos de geolocalización iniciales
    this.checkGeoPermission();

    // Lanzamos el onboarding de permisos con un pequeño retardo
    this.permissionTimeout = setTimeout(() => {
      this.checkPermissionsOnboarding();
    }, 1500);
  }

  /**
   * Lógica de onboarding de permisos con cooldown de 24h
   */
  public async checkPermissionsOnboarding() {
    console.log('[PLAYER-DETAIL] Abriendo modal de permisos...');
    
    const lastPrompt = localStorage.getItem('last_permission_prompt_player_detail');
    const now = Date.now();

    // Solo mostramos si no hay cooldown (24h)
    if (lastPrompt && (now - parseInt(lastPrompt)) < 24 * 60 * 60 * 1000) {
      console.log('[PLAYER-DETAIL] Cooldown activo, pero el usuario ha pulsado el botón, lo abrimos igual.');
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
    try {
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' as any });
        this.hasGeoPermission.set(status.state === 'granted');
        
        // Escuchar cambios en tiempo real si el usuario cambia el permiso desde el navegador
        status.onchange = () => {
          this.hasGeoPermission.set(status.state === 'granted');
        };
      } else {
        // Fallback para navegadores antiguos
        (navigator as any).geolocation.getCurrentPosition(
          () => this.hasGeoPermission.set(true),
          () => this.hasGeoPermission.set(false)
        );
      }
    } catch (e) {
      console.warn('[PLAYER-DETAIL] Error verificando permisos:', e);
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
      this.playerService.getPlayer(id).subscribe({
        next: (player) => {
          this.player = player;

          if (player.tsdb_ids?.player_id) {
            this.loadExtraData(player.tsdb_ids.player_id);
          }

          if (player.tsdb_ids?.team_id) {
            this.loadTeamsInfo(player.tsdb_ids.team_id, player.tsdb_ids.team_id2);
          }

          if (player.tsdb_ids?.league_id) {
            this.loadLeagueInfo(player.tsdb_ids.league_id);
          }

          setTimeout(() => {
            this.startStatsAutoplay();
          }, 500);

          this.isLoading = false;
        },
        error: (err) => {
          console.error('[PlayerDetail] Error crítico al cargar jugador:', err);
          this.showToast('Error al cargar el perfil del jugador', 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('[PlayerDetail] Excepción en loadPlayer:', error);
      this.isLoading = false;
    }
  }

  loadExtraData(tsdbId: string) {
    this.isLoadingExtra = true;
    forkJoin({
      career: this.playerService.getPlayerTeamsHistory(tsdbId),
      honours: this.playerService.getPlayerHonours(tsdbId),
      milestones: this.playerService.getPlayerMilestones(tsdbId)
    }).subscribe({
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
    return window.innerWidth < 768 ? 3 : 8;
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
    this.playerService.lookupTSDBTeam(teamId).subscribe({
      next: (res: any) => { if (res) this.teamDetails.push(res); },
      error: (err) => console.error('Error loading team 1 details:', err)
    });
    if (teamId2) {
      this.playerService.lookupTSDBTeam(teamId2).subscribe({
        next: (res: any) => { if (res) this.teamDetails.push(res); },
        error: (err) => console.error('Error loading team 2 details:', err)
      });
    }
  }

  loadLeagueInfo(leagueId: string) {
    this.playerService.lookupTSDBLeague(leagueId).subscribe({
      next: (res: any) => { this.leagueDetails = res; },
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
    const user = this.authService.userData();

    const commentData: any = {
      content: this.newComment,
      rating: this.newRating,
      autor_name: user?.name || 'Usuario Scouting',
      user_id: user?.firebaseUid || user?.uid // Usar siempre el UID de Firebase
    };

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
        console.log('[PLAYER-DETAIL] Ubicación capturada para el comentario:', commentData.latitude, commentData.longitude);
      } catch (err) {
        console.warn('[PLAYER-DETAIL] No se pudo obtener ubicación precisa para el comentario:', err);
        // Continuamos sin ubicación si falla la obtención rápida
      }
    }

    this.playerService.addComment(this.player._id, commentData).subscribe({
      next: () => {
        this.showToast('¡Gracias por tu informe!', 'success', 'chatbubble-outline');
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
  onStatScroll(event: any) {
    const element = event.target;
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

  canDeleteComment(comment: any): boolean {
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
    // Si la imagen falla, la ocultamos para que se vea el icono de fondo
    event.target.style.display = 'none';
  }
}

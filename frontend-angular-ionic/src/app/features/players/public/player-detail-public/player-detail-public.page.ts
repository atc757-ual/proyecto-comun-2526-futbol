import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef, effect, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonCard, IonCardContent,
  IonButton, IonAvatar,
  IonSpinner, NavController, ModalController,
  IonInput, IonTextarea, IonContent
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/modals/confirm-modal/confirm-modal.component';
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
  syncOutline, shareOutline, personAddOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { Player } from '../../../../core/models/player.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PermissionModalComponent } from 'src/app/shared/components/modals/permission-modal/permission-modal.component';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { Geolocation } from '@capacitor/geolocation';
import { register } from 'swiper/element/bundle';
import { PageFullContentComponent } from '../../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../../shared/components/layout/layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-player-detail-public',
  templateUrl: './player-detail-public.page.html',
  styleUrls: ['./player-detail-public.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent, IonButton, IonAvatar,
    IonSpinner, IonInput, IonTextarea, PageFullContentComponent, PageFooterComponent, IonContent,
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

  private readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  private readonly navCtrl = inject(NavController);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly locationService = inject(LocationPlugin);
  private readonly cdr = inject(ChangeDetectorRef);

  public player: Player | null = null;
  public isLoading = true;
  public commentCityMap = new Map<string, string>();
  public hasGeoPermission = signal(false);
  public isRequestingPermission = false;
  private activePermissionModal: any = null;

  public isSummaryExpanded = false;

  get isOwner(): boolean {
    return false;
  }

  get isLoggedIn(): boolean {
    return false;
  }

  public newComment = '';
  public newRating = 0;
  public isSubmittingComment = false;
  public userCoords = signal<{ lat: number; lng: number } | null>(null);
  public editingCommentId: string | null = null;
  public editingContent = '';
  public editingRating = 5;

  public showCutout = false;

  toggleCardView() {
    this.showCutout = !this.showCutout;
  }

  public anonymousName = '';

  toggleSummary() {
    this.isSummaryExpanded = !this.isSummaryExpanded;
  }

  nameFocused: boolean = false;
  commentFocused: boolean = false;

  currentPage: number = 1;
  pageSize: number = 5;

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
      chevronBackOutline, chevronForwardOutline, addCircleOutline, lockClosedOutline,
      shareOutline, personAddOutline
    });
  }

  ionViewWillLeave() {
    if (this.activePermissionModal) {
      this.activePermissionModal.dismiss();
      this.activePermissionModal = null;
    }
  }


  pageTitle = 'Detalle de Jugador';
  pageSubtitle = 'Información básica del jugador';
  breadcrumbs = [
    { label: '', url: '/auth/login', icon: 'log-in-outline' },
    { label: 'Jugadores', url: '/players-public', icon: '' },
    { label: 'Detalle', url: '' }
  ];

  async ngOnInit() {
    this.startStatsAutoplay();
    this.checkGeoPermission();
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
        localStorage.setItem('last_permission_prompt_player_detail_public', Date.now().toString());
        this.captureUserLocation();
      }
    } catch {
      // permiso denegado o error silencioso
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

    const isGrantedReal = await this.locationService.isGeolocationPermissionGranted();
    if (isGrantedReal) {
      this.hasGeoPermission.set(true);
      return;
    }

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
    if (!this.hasGeoPermission()) return;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000
      });

      if (pos && pos.coords) {
        this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
    } catch (err: any) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            this.userCoords.set({ lat: 40.4168, lng: -3.7038 });
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
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
        error: () => {
          this.toastService.showError('Jugador no encontrado o perfil no disponible');
          this.isLoading = false;
          this.navCtrl.navigateRoot('/players-public');
        }
      });
    } catch {
      this.isLoading = false;
      this.navCtrl.navigateRoot('/players-public');
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

    const commentData: any = {
      content: this.newComment,
      rating: this.newRating,
      autor_name: this.anonymousName || 'Invitado',
      user_id: null
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
          this.userCoords.set({
            lat: coordinates.coords.latitude,
            lng: coordinates.coords.longitude
          });
          commentData.location = {
            type: 'Point',
            coordinates: [coordinates.coords.longitude, coordinates.coords.latitude]
          };
        } catch {
        }
      }
    }

    this.playerService.addPublicComment(this.player._id, commentData).subscribe({
      next: () => {
        this.toastService.showSuccess('¡Gracias por tu comentario!');
        this.newComment = '';
        this.newRating = 0;
        this.isSubmittingComment = false;
        this.loadPlayer(this.player!._id!);
      },
      error: () => {
        this.toastService.showError('No se pudo publicar');
        this.isSubmittingComment = false;
      }
    });
  }


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

    this.startStatsAutoplay();
  }

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



  getRatingStars(rating: number = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'star' : 'star-outline');
    }
    return stars;
  }


  getSafeImageUrl(url: string | undefined): string {
    if (!url || url.includes('dummyimage.com')) return 'assets/img/placeholder.jpg';
    if (url.includes('thesportsdb.com') || url.startsWith('http')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  handleImageError(event: any) {
    event.target.onerror = null;
    event.target.src = 'assets/img/placeholder.jpg';
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByCommentId(_: number, comment: { _id?: string; id?: string }): string | undefined {
    return comment._id ?? comment.id;
  }

  async showRegisterModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      cssClass: 'premium-modal',
      componentProps: {
        title: 'Únete a Fútbol Club',
        message: 'Si quieres conocer todas las funcionalidades de nuestro sitio. ¡Regístrate ahora!',
        confirmText: 'Sí, quiero registrarme',
        cancelText: 'No, gracias',
        type: 'info'
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.navCtrl.navigateRoot('/auth/register', { animated: false });
    }
  }
}



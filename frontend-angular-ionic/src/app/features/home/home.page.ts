import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, Platform } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy, statsChart, grid, person, timeOutline, personAddOutline,
  chevronForward, football, chevronBack, newspaperOutline, settingsOutline, tvOutline,
  logOutOutline, keyOutline, shieldCheckmarkOutline, closeOutline, footballOutline,
  checkmarkCircleOutline, alertCircleOutline, personOutline, mailOutline, radioOutline,
  serverOutline, sparklesOutline, peopleOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Auth } from '@angular/fire/auth';
import { Subscription, timer, Subject, takeUntil, take } from 'rxjs';
import { TsdbLiveScore } from 'src/app/core/models/tsdb.model';
import { NewsItem } from 'src/app/core/models/news.model';
import { PermissionModalComponent } from 'src/app/shared/components/modals/permission-modal/permission-modal.component';
import { PageFullContentComponent } from 'src/app/shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from 'src/app/shared/components/layout/layout-elements/page-footer/page-footer.component';
import { ModalController } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { NEWS_SERVICE_TOKEN } from 'src/app/core/services/news/news.service.token';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { TourService } from 'src/app/core/services/ui/tour.service';
import { LoggerService } from '../../core/services/system/logger.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, PageFullContentComponent, PageFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {
  // Inyecto los tokens de servicios y controladores en primera persona
  private readonly newsService = inject(NEWS_SERVICE_TOKEN);
  private readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly platform = inject(Platform);
  private readonly authService = inject(AuthService);
  private readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);
  private readonly auth = inject(Auth);
  private readonly locationPlugin = inject(LocationPlugin);
  private readonly tourService = inject(TourService);
  private readonly logger = inject(LoggerService);
  private refreshSub?: Subscription;
  private readonly destroy$ = new Subject<void>();
  // Propiedades públicas de estado
  pageTitle = 'Inicio';
  pageSubtitle = '';
  featuredNews: any[] = [];
  liveScores: TsdbLiveScore[] = [];
  liveScorePages: TsdbLiveScore[][] = [];
  isLoadingFeatured = true;
  isLoadingLive = true;
  isLoadingSchedule = true;
  isLoadingPlayers = true;
  myPlayersJson = '[]';
  playerCount = 0;
  tvScheduleJson = '[]';


  constructor() {
    // Registro los iconos reutilizables en la cabecera, navegación y tarjetas de esta pantalla
    addIcons({
      star, calendar, trophy, mailOutline, personAddOutline,
      statsChart, grid, person, timeOutline, footballOutline,
      chevronForward, football, shieldCheckmarkOutline, serverOutline,
      chevronBack, newspaperOutline, settingsOutline, tvOutline,
      logOutOutline, keyOutline, personOutline, radioOutline,
      closeOutline, checkmarkCircleOutline, alertCircleOutline,
      sparklesOutline, peopleOutline
    });

    // Sincronizo de forma reactiva el nombre del usuario en la cabecera
    effect(() => {
      const name = this.authService.firstName();
      this.pageTitle = `¡Hola, ${name || 'Usuario'}!`;
    });
    this.pageSubtitle = 'Toda la emoción del fútbol en tu mano';
  }

  // === CICLOS DE VIDA ===

  ngOnInit() {
    // Inicializo y lanzo las consultas de los feeds principales
    this.loadFeaturedNews();
    this.loadLiveScores();
    this.loadMyPlayers();
    this.loadTVScheduleByCountry();

    // Tour guiado: solo se muestra la primera vez
    if (this.tourService.isTourDone()) {
      this.checkPermissionsOnboarding();
    } else {
      this.tourService.tourDone$.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
        this.checkPermissionsOnboarding();
      });
    }
    this.tourService.startIfFirstTime();

    // Establezco un temporizador para refrescar marcadores cada 60 segundos
    this.refreshSub = timer(60000, 60000).subscribe(() => {
      this.loadLiveScores(true);
    });

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  // === GETTERS ===

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // === ACCIONES DE INTERACCIÓN (ACCIONES DE NEGOCIO) ===

  /**
   * Navega hacia la pantalla completa de gestión de jugadores
   */
  onViewMorePlayers() {
    this.router.navigate(['/players']);
  }

  /**
   * Navega hacia el detalle técnico de un jugador seleccionado
   */
  onPlayerClicked(event: any) {
    const player = event.detail;
    const targetId = player?._id || player?.id;
    if (targetId) {
      this.router.navigate(['/player-detail', targetId]);
    }
  }

  /**
   * Navega hacia el detalle de una noticia
   */
  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }

  /**
   * Solicita confirmación y ejecuta la desconexión del usuario
   */
  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir de tu cuenta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.authService.logout().then(() => this.router.navigate(['/login']));
          }
        }
      ]
    });
    await alert.present();
  }

  // === MÉTODOS DE SOPORTE Y CARGA DE DATOS ===

  /**
   * Consulta los permisos de ubicación/cámara del navegador y lanza el onboarding de ser necesario
   */
  async checkPermissionsOnboarding() {
    const lastPrompt = localStorage.getItem('last_permission_prompt_home');
    if (lastPrompt) {
      const hoursSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    try {
      // Usar LocationPlugin para chequear geo (funciona correctamente en Android/Capacitor)
      const geoGranted = await this.locationPlugin.isGeolocationPermissionGranted();
      let cameraGranted = false;
      try {
        const camResult = await navigator.permissions.query({ name: 'camera' as any });
        cameraGranted = camResult.state === 'granted';
      } catch (e) {
        cameraGranted = false;
      }

      if (geoGranted && cameraGranted) {
        return;
      }
    } catch (e) {
      this.logger.warn('Error al consultar permisos, abriendo modal:', e);
    }

    const modal = await this.modalCtrl.create({
      component: PermissionModalComponent,
      cssClass: 'premium-modal',
      backdropDismiss: false,
      componentProps: { mode: 'players' }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    localStorage.setItem('last_permission_prompt_home', Date.now().toString());

    if (data === true) {
      this.loadMyPlayers();
    }
  }

  /**
   * Carga las noticias destacadas de la plataforma
   */
  loadFeaturedNews() {
    this.isLoadingFeatured = true;
    this.newsService.getFeatured().pipe(takeUntil(this.destroy$)).subscribe({
      next: (news) => {
        this.featuredNews = news.map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          excerpt: item.summary,
          author: item.author,
          date: item.date,
          image: item.imageUrl
        }));
        this.isLoadingFeatured = false;
      },
      error: () => this.isLoadingFeatured = false
    });
  }

  /**
   * Carga los marcadores en vivo de los partidos actuales
   */
  loadLiveScores(isAuto = false) {
    if (!isAuto) this.isLoadingLive = true;
    this.playerService.getTSDBLiveScores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (scores: any) => {
        let scoresList: any[] = [];
        if (Array.isArray(scores)) {
          scoresList = scores;
        } else if (scores && Array.isArray(scores.livescore)) {
          scoresList = scores.livescore;
        } else if (scores && Array.isArray(scores.results)) {
          scoresList = scores.results;
        } else if (scores && scores.data && Array.isArray(scores.data)) {
          scoresList = scores.data;
        } else if (scores && scores.data && Array.isArray(scores.data.livescore)) {
          scoresList = scores.data.livescore;
        }

        const sorted = scoresList.sort((a, b) => (a.strLeague || '').localeCompare(b.strLeague || ''));

        const gradients = [
          'linear-gradient(135deg, #002eff, #6b8cff)', // Azul Champions
          'linear-gradient(135deg, #ff002e, #ff6b8c)', // Rojo Pasión
          'linear-gradient(135deg, #10b981, #34d399)', // Verde Césped
          'linear-gradient(135deg, #f59e0b, #fbbf24)', // Oro Trofeo
          'linear-gradient(135deg, #8b5cf6, #a78bfa)', // Púrpura Élite
          'linear-gradient(135deg, #0ea5e9, #7dd3fc)'  // Celeste Selección
        ];

        this.liveScores = sorted.map((s, idx) => ({
          ...s,
          customGradient: gradients[idx % gradients.length]
        }));

        this.calculateLiveScorePages();
        this.isLoadingLive = false;
      },
      error: () => this.isLoadingLive = false
    });
  }

  /**
   * Pasa a paginar de 4 en 4 partidos los marcadores en vivo de Swiper
   */
  calculateLiveScorePages() {
    const chunks = [];
    const scores = this.liveScores || [];
    for (let i = 0; i < scores.length; i += 4) {
      chunks.push(scores.slice(i, i + 4));
    }
    this.liveScorePages = chunks;
  }

  /**
   * Carga los jugadores fichados por el usuario
   */
  loadMyPlayers() {
    this.isLoadingPlayers = true;
    this.playerService.getPlayers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (players) => {
        this.myPlayersJson = JSON.stringify(players);
        this.playerCount = (players || []).length;
        this.isLoadingPlayers = false;
      },
      error: () => {
        this.isLoadingPlayers = false;
      }
    });
  }

  /**
   * Carga el calendario de transmisiones de fútbol en televisión
   */
  loadTVScheduleByCountry() {
    this.isLoadingSchedule = true;
    this.playerService.getTVByCountry('Spain').pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.tvScheduleJson = JSON.stringify(data);
        this.isLoadingSchedule = false;
      },
      error: () => this.isLoadingSchedule = false
    });
  }

  trackByScore(index: number, score: TsdbLiveScore): string | number {
    return score.idLiveScore || index;
  }

  trackByNewsId(index: number, news: any): string | number {
    return news.id || index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Asigna un avatar de respaldo si falla la carga del avatar del jugador
   */
  handleAvatarError(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23e2e8f0"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="%2394a3b8"/></svg>';
  }
}


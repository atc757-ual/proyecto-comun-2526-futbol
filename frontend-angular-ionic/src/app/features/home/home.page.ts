import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, Platform } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy, statsChart, grid, person, timeOutline, personAddOutline,
  chevronForward, football, chevronBack, newspaperOutline, settingsOutline, tvOutline,
  logOutOutline, keyOutline, shieldCheckmarkOutline, closeOutline, footballOutline,
  checkmarkCircleOutline, alertCircleOutline, personOutline, mailOutline, radioOutline,
  serverOutline, sparklesOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';
import { NewsService } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlayerService } from 'src/app/core/services/player.service';
import { Auth } from '@angular/fire/auth';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {
  private newsService = inject(NewsService);
  private playerService = inject(PlayerService);
  private router = inject(Router);
  private layoutService = inject(LayoutService);
  private platform = inject(Platform);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private auth = inject(Auth);



  featuredNews: any[] = [];
  liveScores: any[] = [];
  liveScorePages: any[][] = [];
  isLoadingFeatured = true;
  isLoadingLive = true;
  isLoadingSchedule = true;

  myPlayersJson = '[]';
  playerCount = 0;

  tvScheduleJson = '[]';
  private refreshSub?: Subscription;

  constructor() {
    addIcons({
      star, calendar, trophy, mailOutline, personAddOutline,
      statsChart, grid, person, timeOutline, footballOutline,
      chevronForward, football, shieldCheckmarkOutline, serverOutline,
      chevronBack, newspaperOutline, settingsOutline, tvOutline,
      logOutOutline, keyOutline, personOutline, radioOutline,
      closeOutline, checkmarkCircleOutline, alertCircleOutline,
      sparklesOutline
    });
  }



  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() {
    this.loadFeaturedNews();
    this.loadLiveScores();
    this.loadMyPlayers();
    this.loadTVScheduleByCountry();

    this.refreshSub = timer(60000, 60000).subscribe(() => {
      this.loadLiveScores(true);
    });

    this.layoutService.setHeader({
      title: `Hola, ${this.authService.firstName() || 'Usuario'}!`,
      subtitle: 'Toda la emoción del fútbol en tu mano',
      showHero: true,
      isHome: true
    });
    this.layoutService.setBreadcrumbs([]);
  }



  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  loadFeaturedNews() {
    this.isLoadingFeatured = true;
    this.newsService.getFeatured().subscribe({
      next: (news) => {
        this.featuredNews = news.map(item => ({
          id: item.id,
          title: item.title,
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


  loadLiveScores(isAuto = false) {
    if (!isAuto) this.isLoadingLive = true;
    this.playerService.getTSDBLiveScores().subscribe({
      next: (scores) => {
        const sorted = (scores || []).sort((a, b) => (a.strLeague || '').localeCompare(b.strLeague || ''));
        
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

  calculateLiveScorePages() {
    const chunks = [];
    const scores = this.liveScores || [];
    for (let i = 0; i < scores.length; i += 4) {
      chunks.push(scores.slice(i, i + 4));
    }
    this.liveScorePages = chunks;
  }

  loadMyPlayers() {
    this.playerService.getPlayers().subscribe(players => {
      this.myPlayersJson = JSON.stringify(players);
      this.playerCount = (players || []).length;
    });
  }

  trackByScore(index: number, score: any) {
    return score.idLiveScore || index;
  }

  loadTVScheduleByCountry() {
    this.isLoadingSchedule = true;
    this.playerService.getTVByCountry('Spain').subscribe({
      next: (data) => {
        this.tvScheduleJson = JSON.stringify(data);
        this.isLoadingSchedule = false;
      },
      error: () => this.isLoadingSchedule = false
    });
  }

  onViewMorePlayers() {
    this.router.navigate(['/players']);
  }

  onPlayerClicked(event: any) {
    const player = event.detail;
    const targetId = player?._id || player?.id;
    if (targetId) this.router.navigate(['/player-detail', targetId]);
  }

  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }

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



  handleAvatarError(event: any) {
    event.target.src = 'https://ui-avatars.com/api/?name=User&background=e2e8f0&color=0f172a&bold=true';
  }
}

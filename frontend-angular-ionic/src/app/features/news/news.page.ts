import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NewsService, NewsItem } from '../../core/services/news.service';
import { AuthService } from '../../core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, newspaperOutline, homeOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class NewsPage implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService); // Inyectado correctamente aquí
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private navCtrl = inject(NavController);

  newsList: NewsItem[] = [];
  selectedNews: NewsItem | null = null;
  isAdmin = false;
  isLoading = true;

  constructor() {
    addIcons({ addCircleOutline, newspaperOutline, homeOutline, settingsOutline });
  }

  async ngOnInit() {
    // Configurar Layout
    this.layoutService.setHeader({
      title: 'Noticias de Fútbol',
      subtitle: 'Mantente al día con la actualidad deportiva',
      showHero: true,
      isHome: false
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Noticias' }
    ]);

    this.isAdmin = this.authService.isAdmin(); // Usamos la instancia inyectada
    this.loadNews();
  }

  loadNews() {
    this.isLoading = true;
    
    // Si es admin pide todo, si no pide el feed público (ya filtrado por el back)
    const newsObservable = this.isAdmin ? this.newsService.getNews() : this.newsService.getFeed();

    newsObservable.subscribe({
      next: (news) => {
        this.newsList = news;

        const newsId = this.route.snapshot.paramMap.get('id');
        if (newsId) {
          this.selectedNews = this.newsList.find(n => n.id === newsId) || this.newsList[0];
        } else {
          this.selectedNews = this.newsList[0];
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando noticias:', err);
        this.isLoading = false;
      }
    });
  }

  selectNews(news: NewsItem) {
    this.selectedNews = news;
  }

  goToDetail(id: string | undefined) {
    if (id) {
      this.navCtrl.navigateForward(['/news', id]);
    }
  }
}

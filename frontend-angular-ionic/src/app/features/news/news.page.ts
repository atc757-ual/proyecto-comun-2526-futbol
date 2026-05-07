import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NewsService, NewsItem } from '../../core/services/news.service';
import { AuthService } from '../../core/services/auth.service';

import { addIcons } from 'ionicons';
import { addOutline, newspaperOutline } from 'ionicons/icons';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class NewsPage implements OnInit {
  private authService = inject(AuthService);
  private newsService = inject(NewsService);
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);

  newsList: NewsItem[] = [];
  selectedNews: NewsItem | null = null;
  isAdmin = false;
  isLoading = true;

  constructor() {
    addIcons({ addOutline, newspaperOutline });
  }

  async ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    const loading = await this.loadingCtrl.create({
      message: 'Cargando noticias desde CORBA...',
      mode: 'ios'
    });
    await loading.present();

    this.newsService.getNews().subscribe({
      next: (news) => {
        // Si no es admin, filtrar solo las activas
        if (!this.isAdmin) {
          this.newsList = news.filter(n => n.isActive);
        } else {
          this.newsList = news;
        }
        
        this.isLoading = false;
        
        // Manejar selección inicial por ID de ruta
        this.route.params.subscribe(params => {
          const newsId = params['id'];
          if (newsId) {
            this.selectedNews = this.newsList.find(n => n.id === newsId) || this.newsList[0];
          } else if (this.newsList.length > 0) {
            this.selectedNews = this.newsList[0];
          }
        });
        
        loading.dismiss();
      },
      error: (err) => {
        console.error('Error al cargar noticias:', err);
        this.isLoading = false;
        loading.dismiss();
      }
    });
  }

  selectNews(news: any) {
    this.selectedNews = news;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}

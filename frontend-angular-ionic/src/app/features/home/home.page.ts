import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy, statsChart, grid, person,
  chevronForward, football, chevronBack, newspaperOutline, settingsOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';
import { NewsService } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {
  private newsService = inject(NewsService);
  private router = inject(Router);
  private layoutService = inject(LayoutService);

  featuredNews: any[] = [];
  isLoadingFeatured = true;

  constructor() {
    addIcons({
      star, calendar, trophy,
      statsChart, grid, person,
      chevronForward, football,
      chevronBack, newspaperOutline, settingsOutline
    });
  }

  private authService = inject(AuthService);

  ngOnInit() {
    this.loadFeaturedNews();

    // Configurar Layout para la Home
    this.layoutService.setHeader({
      title: `Hola, ${this.authService.firstName() || 'Usuario'}!`,
      subtitle: 'Toda la emoción del fútbol en tu mano',
      showHero: true,
      isHome: true
    });

    // Limpiar breadcrumbs al volver a Home
    this.layoutService.setBreadcrumbs([]);
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
        console.log('Noticias destacadas cargadas:', this.featuredNews.length);
        this.isLoadingFeatured = false;
      },
      error: (err) => {
        console.error('Error cargando destacadas:', err);
        this.isLoadingFeatured = false;
      }
    });
  }

  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }
}

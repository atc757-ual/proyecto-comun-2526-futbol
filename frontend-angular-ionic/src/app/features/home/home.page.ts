import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy,
  statsChart, grid, person,
  chevronForward, football,
  chevronBack, newspaperOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage {
  @ViewChild('swiperRef') swiperRef?: ElementRef;

  @HostListener('window:resize')
  onResize() {
    if (this.swiperRef?.nativeElement) {
      // Forzar a Swiper a recalcular dimensiones
      const swiperEl = this.swiperRef.nativeElement;
      if (swiperEl.swiper) {
        swiperEl.swiper.update();
      }
    }
  }
  // ... (featuredNews remains the same)
  featuredNews = [
    {
      id: 1,
      title: 'El Real Madrid anuncia nuevo fichaje estrella',
      excerpt: 'El club blanco ha cerrado el acuerdo por una cifra récord para reforzar su delantera la próxima temporada.',
      author: 'Marca',
      date: 'Hoy, 10:30',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Análisis: El impacto de la IA en los entrenamientos',
      excerpt: 'Los grandes equipos europeos empiezan a utilizar modelos predictivos para prevenir lesiones en sus jugadores.',
      author: 'Mundo Deportivo',
      date: 'Ayer, 18:45',
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Mercado de fichajes: Últimas novedades del verano',
      excerpt: 'Sigue en directo todos los movimientos, rumores y confirmaciones de las principales ligas europeas.',
      author: 'Sport',
      date: 'Hace 2h',
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop'
    }
  ];

  constructor(private router: Router) {
    addIcons({
      star, calendar, trophy,
      statsChart, grid, person,
      chevronForward, football,
      chevronBack, newspaperOutline
    });
  }

  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }
}

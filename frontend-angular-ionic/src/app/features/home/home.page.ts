import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy, statsChart, grid, person,
  chevronForward, football, chevronBack, newspaperOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private layoutService = inject(LayoutService); // Inyectamos el servicio

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

  constructor() {
    addIcons({
      star, calendar, trophy,
      statsChart, grid, person,
      chevronForward, football,
      chevronBack, newspaperOutline
    });
  }

  ngOnInit() {
    // Configurar Layout para la Home
    this.layoutService.setHeader({
      title: '¡Bienvenido, Alex!',
      subtitle: 'Toda la emoción del fútbol en tu mano',
      showHero: true,
      isHome: true // Muy importante para mostrar el Logo en el Header móvil
    });

    // Limpiar breadcrumbs al volver a Home
    this.layoutService.setBreadcrumbs([]);

  }

  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }
}

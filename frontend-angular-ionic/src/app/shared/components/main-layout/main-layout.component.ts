import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home, people, cart, newspaper, menuOutline, football,
  personCircleOutline, logOutOutline, sparkles,
  logoLinkedin, logoGithub, closeOutline, arrowBack, chevronBack,
  homeOutline, chevronForwardOutline
} from 'ionicons/icons';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService); // Inyectamos el nuevo servicio

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Jugadores', url: '/players', icon: 'people' },
    { title: 'IA', url: '/ai-team', icon: 'sparkles' },
    { title: 'Mercado', url: '/player-add', icon: 'cart' },
    { title: 'Noticias', url: '/news', icon: 'newspaper' }
  ];

  constructor() {
    addIcons({
      home, people, cart, newspaper, menuOutline, football,
      personCircleOutline, logOutOutline, sparkles,
      logoLinkedin, logoGithub, closeOutline, arrowBack, chevronBack,
      homeOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    // Escuchamos cambios de ruta solo para resetear o manejar estados globales si fuera necesario
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Opcional: resetear al cambiar de página para evitar que una página
      // herede el título de la anterior si se olvida de poner el suyo.
      // this.layoutService.resetLayout(); 
    });
  }

  /* 
  COMENTADO: Ya no leemos de la ruta, usamos LayoutService
  private updateHeroData() {
    try {
      let route = this.router.routerState.root;
      while (route.firstChild) route = route.firstChild;
      const data = route.snapshot?.data;
      ...
    } catch (e) { }
  }
  */

  logout() {
    this.authService.logout().then(() => this.router.navigate(['/login']));
  }
}

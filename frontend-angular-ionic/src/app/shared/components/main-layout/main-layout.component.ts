import { Component, inject, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  home,
  people,
  sparkles,
  cart,
  newspaper,
  menuOutline,
  football,
  personCircleOutline,
  logOutOutline,
  logoLinkedin,
  logoGithub,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class MainLayoutComponent implements OnInit {
  @Input() title: string = 'mainSystem';

  private authService = inject(AuthService);
  private platform = inject(Platform);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userName: string = '';
  userEmail: string = '';
  isAdmin: boolean = false;
  isMobileApp: boolean = false;
  isWebMobile: boolean = false;
  isDesktop: boolean = false;

  // Propiedades Hero (ahora se cargan de la ruta)
  showHero: boolean = false;
  heroTitle: string = '';
  heroSubtitle: string = '';

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Jugadores', url: '/players', icon: 'people' },
    { title: 'IA', url: '/ai-team', icon: 'sparkles' },
    { title: 'Mercado', url: '/player-add', icon: 'cart' },
    { title: 'Noticias', url: '/news', icon: 'newspaper' }
  ];

  constructor() {
    addIcons({
      home,
      people,
      cart,
      newspaper,
      menuOutline,
      football,
      personCircleOutline,
      logOutOutline,
      sparkles,
      logoLinkedin,
      logoGithub,
      closeOutline
    });
  }

  // ESCUCHADOR DE REDIMENSIÓN
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updatePlatformInfo();
  }

  ngOnInit() {
    this.updatePlatformInfo();

    // ESCUCHAR CAMBIOS DE RUTA PARA EL HERO
    this.updateHeroData();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateHeroData();
    });

    this.authService.user$.subscribe(user => {
      this.userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
      this.userEmail = user?.email || '';
      this.isAdmin = this.authService.isAdmin();
    });
  }

  private updateHeroData() {
    let currentRoute = this.route.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    // Seguridad: Si por alguna razón el snapshot o data no existen, no rompemos la App
    const data = currentRoute?.snapshot?.data;

    if (data) {
      this.showHero = !!data['heroTitle'];
      this.heroTitle = data['heroTitle'] || '';
      this.heroSubtitle = data['heroSubtitle'] || '';
    } else {
      this.showHero = false;
      this.heroTitle = '';
      this.heroSubtitle = '';
    }
  }

  private updatePlatformInfo() {
    const width = window.innerWidth;

    // FORZADO TEMPORAL PARA VALIDACIÓN:
    this.isMobileApp = true;

    this.isWebMobile = width < 768 && !this.isMobileApp;
    this.isDesktop = width >= 768;
    console.log(`[LAYOUT] Fluid Check -> WebMobile: ${this.isWebMobile}, Desktop: ${this.isDesktop}, App: ${this.isMobileApp}`);
  }

  async logout() {
    console.log('Cerrando sesión...');
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

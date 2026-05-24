import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import {
  IonIcon,
  MenuController, NavController,
  IonHeader, IonToolbar, IonButtons, IonTitle,
  IonFooter, IonTabBar, IonTabButton, IonLabel, ModalController,
  IonRouterOutlet, IonButton
} from '@ionic/angular/standalone';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { addIcons } from 'ionicons';
import {
  football, logoLinkedin, personCircleOutline, logoGithub,
  arrowBack, personAddOutline, logInOutline,
  homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';

@Component({
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, IonIcon,
    IonHeader, IonToolbar, IonButtons, IonTitle,
    IonFooter, IonTabBar, IonTabButton, IonLabel,
    IonRouterOutlet, IonButton
  ]
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private location = inject(Location);

  public appPages = [
    { tab: 'home', title: 'Inicio', url: '/home', icon: 'home-outline' },
    { tab: 'players', title: 'Mi plantilla', url: '/players', icon: 'football-outline' },
    { tab: 'ai-team', title: 'Fútbol AI', url: '/ai-team', icon: 'sparkles-outline' },
    { tab: 'busqueda', title: 'Búsqueda', url: '/busqueda', icon: 'search-outline' },
    { tab: 'news', title: 'Noticias', url: '/news', icon: 'newspaper-outline' }
  ];

  constructor() {
    addIcons({
      personCircleOutline, personAddOutline, logoLinkedin, logoGithub,
      arrowBack, football, logInOutline,
      homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline
    });

    // Reset de scroll al cambiar de ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const ionContent = document.querySelector('#mobile-public-content ion-content, #public-content .main-main-bg') as any;
        if (ionContent && typeof ionContent.scrollToTop === 'function') {
          ionContent.scrollToTop(300);
        } else {
          window.scrollTo(0, 0);
        }
      }
    });
  }

  goBack() {
    // Evitar que el botón retenga el foco al navegar
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.location.back();
  }

  isTabActive(tabUrl: string): boolean {
    const currentUrl = (this.router.url || '').toLowerCase();
    const targetUrl = (tabUrl || '').toLowerCase();

    if (!targetUrl) return false;
    if (targetUrl === '/home') return currentUrl === '/home';
    if (targetUrl === '/players') return currentUrl.includes('player') && !currentUrl.includes('public');
    if (targetUrl === '/news') return currentUrl.includes('new');
    if (targetUrl === '/ai-team') return currentUrl.includes('ai-team');
    if (targetUrl === '/busqueda') return currentUrl.includes('busqueda');
    return currentUrl.includes(targetUrl);
  }

  get defaultBackUrl(): string {
    const url = (this.router.url || '').toLowerCase();
    if (url.includes('/player-detail')) return '/players-public';
    if (url.includes('/news-detail')) return '/news';
    return '/home';
  }

  async onTabClick(event: Event, tab: any, index: number) {
    // Todos los botones en el layout público levantan el modal de registro
    event.preventDefault();
    event.stopPropagation();

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

  goTo(url: string) {
    this.navCtrl.navigateRoot(url, { animated: false });
  }


  onBreadcrumbClick(event: Event, item: any) {
    if (item.url === '/auth/login' || (item.url === '/home' && !this.authService.currentUser())) {
      event.preventDefault();
      event.stopPropagation();
      this.navCtrl.navigateRoot('/auth/login', { animated: false });
    }
  }

  onLogoClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.authService.currentUser()) {
      this.navCtrl.navigateRoot('/home', { animated: false });
    } else {
      this.navCtrl.navigateRoot('/auth/login', { animated: false });
    }
  }

  ngOnInit() {
    // Aseguramos que el menú lateral esté desactivado en el layout público
    this.menuCtrl.enable(false);
    console.log('PublicLayout loaded - Menu disabled');
  }

  ngOnDestroy() {
    // Al salir del layout público, volvemos a habilitar el menú por si vamos al Main
    this.menuCtrl.enable(true);
  }
}

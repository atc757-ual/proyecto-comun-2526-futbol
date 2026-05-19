import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonIcon, ActionSheetController, ModalController,
  IonMenu, IonContent, IonMenuToggle, IonButton, IonItem, IonLabel,
  IonBackButton, IonBreadcrumbs, IonBreadcrumb, IonFooter, IonTabBar,
  IonTabButton, MenuController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, newspaperOutline, menuOutline, football,
  personOutline, logOutOutline, sparklesOutline, footballOutline, logoLinkedin, personCircleOutline,
  logoGithub, closeOutline, arrowBack, chevronBack, chevronForwardOutline, searchOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonMenu, IonContent, IonIcon, IonMenuToggle, IonButton,
    IonItem, IonLabel, IonBackButton, IonBreadcrumbs,
    IonBreadcrumb, IonFooter, IonTabBar, IonTabButton
  ]
})
export class MainLayoutComponent implements OnDestroy {
  private router = inject(Router);
  public authService = inject(AuthService);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private menuCtrl = inject(MenuController);
  private navCtrl = inject(NavController);

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home-outline' },
    { title: 'Mi plantilla', url: '/players', icon: 'football-outline' },
    { title: 'Fútbol AI', url: '/ai-team', icon: 'sparkles-outline' },
    { title: 'Búsqueda', url: '/busqueda', icon: 'search-outline' },
    { title: 'Noticias', url: '/news', icon: 'newspaper-outline' }
  ];

  constructor() {
    addIcons({
      homeOutline, newspaperOutline, menuOutline, footballOutline, personCircleOutline,
      personOutline, logOutOutline, sparklesOutline, logoLinkedin, logoGithub, closeOutline, arrowBack,
      chevronBack, chevronForwardOutline, football, searchOutline
    });
  }

  ngOnDestroy() {
    // Al destruir el layout principal (logout o ir a ruta pública), 
    // nos aseguramos de que el menú no se quede "colgado"
    this.menuCtrl.enable(false);
    this.menuCtrl.close();
  }

  /**
   * Lógica de navegación inteligente para marcar secciones activas
   */
  isTabActive(tabUrl: string): boolean {
    const currentUrl = this.router.url.toLowerCase();
    const targetUrl = tabUrl.toLowerCase();

    // 1. HOME: Solo si es exactamente /home
    if (targetUrl === '/home') {
      return currentUrl === '/home';
    }

    // 2. JUGADORES: Si incluye 'player' pero NO 'public'
    if (targetUrl === '/players') {
      return currentUrl.includes('player') && !currentUrl.includes('public');
    }

    // 3. NOTICIAS: Si incluye 'new' (news, add-news, manage-news)
    if (targetUrl === '/news') {
      return currentUrl.includes('new');
    }

    // 4. IA: Si incluye 'ai', 'ia' o 'analysis'
    if (targetUrl === '/ai-team') {
      return currentUrl.includes('ai-team');
    }

    // 5. BÚSQUEDA: Si incluye 'busqueda' o 'search'
    if (targetUrl === '/busqueda') {
      return currentUrl.includes('busqueda');
    }

    // Por defecto, coincidencia simple
    return currentUrl.includes(targetUrl);
  }


  private actionSheetCtrl = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);

  onBreadcrumbClick(event: Event, item: any) {
    if (item.url === '/login' || (item.url === '/home' && !this.authService.currentUser())) {
      event.preventDefault();
      event.stopPropagation();
      this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'back' });
    }
  }

  async logout() {
    if (this.platformService.isDesktop) {
      // MODAL PREMIUM PARA DESKTOP
      const modal = await this.modalCtrl.create({
        component: ConfirmModalComponent,
        cssClass: 'premium-modal',
        componentProps: {
          title: 'Cerrar Sesión',
          message: '¿Estás seguro de que deseas salir de tu cuenta? Tendrás que volver a entrar con tus credenciales.',
          confirmText: 'Sí, cerrar sesión',
          cancelText: 'No, cancelar',
          type: 'logout'
        }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data === true) {
        this.authService.logout().then(() => this.navCtrl.navigateRoot('/login'));
      }
    } else {
      // ACTION SHEET ERGONÓMICO PARA MÓVIL
      const actionSheet = await this.actionSheetCtrl.create({
        header: '¿Deseas cerrar sesión?',
        subHeader: 'Tendrás que volver a entrar con tus credenciales',
        mode: 'ios',
        cssClass: 'custom-logout-action-sheet',
        buttons: [
          {
            text: 'Sí, cerrar sesión',
            role: 'destructive',
            handler: () => {
              this.authService.logout().then(() => this.navCtrl.navigateRoot('/login'));
            }
          },
          { text: 'No, cancelar', role: 'cancel' }
        ]
      });

      await actionSheet.present();
    }
  }
}

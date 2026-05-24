import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  ActionSheetController, ModalController,
  IonRouterOutlet, MenuController, NavController,
  IonHeader, IonToolbar, IonButtons, IonMenuToggle, IonButton, IonIcon, IonTitle, IonLabel
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
import { LayoutNavigationComponent } from '../layout-navigation/layout-navigation.component';
import { LayoutTabsComponent } from '../layout-tabs/layout-tabs.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, IonRouterOutlet,
    LayoutNavigationComponent, LayoutTabsComponent,
    IonHeader, IonToolbar, IonButtons, IonMenuToggle, IonButton, IonIcon, IonTitle, IonLabel
  ]
})
export class MainLayoutComponent implements OnDestroy {
  private router = inject(Router);
  public authService = inject(AuthService);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private menuCtrl = inject(MenuController);
  private navCtrl = inject(NavController);
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
      homeOutline, newspaperOutline, menuOutline, footballOutline, personCircleOutline,
      personOutline, logOutOutline, sparklesOutline, logoLinkedin, logoGithub, closeOutline, arrowBack,
      chevronBack, chevronForwardOutline, football, searchOutline
    });

    // Reset de scroll al cambiar de ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const ionContent = document.querySelector('#mobile-main-content ion-content, .main-main-bg') as any;
        if (ionContent && typeof ionContent.scrollToTop === 'function') {
          ionContent.scrollToTop(300);
        } else {
          window.scrollTo(0, 0);
        }
      }
    });
  }

  ngOnDestroy() {
    // Al destruir el layout principal (logout o ir a ruta pública), 
    // nos aseguramos de que el menú no se quede "colgado"
    this.menuCtrl.enable(false);
    this.menuCtrl.close();
  }

  isCurrentHome(): boolean {
    const currentUrl = (this.router.url || '').split('?')[0].split('#')[0].toLowerCase();
    return currentUrl === '/home';
  }


  goBack(): void {
    // Evitar que el botón retenga el foco al navegar
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  isTabActive(tabUrl: string): boolean {
    const currentUrl = (this.router.url || '').toLowerCase();
    const targetUrl = (tabUrl || '').toLowerCase();

    if (!targetUrl) { return false; }
    if (targetUrl === '/home') { return currentUrl === '/home'; }
    if (targetUrl === '/players') { return currentUrl.includes('player') && !currentUrl.includes('public'); }
    if (targetUrl === '/news') { return currentUrl.includes('new'); }
    if (targetUrl === '/ai-team') { return currentUrl.includes('ai-team'); }
    if (targetUrl === '/busqueda') { return currentUrl.includes('busqueda'); }
    return currentUrl.includes(targetUrl);
  }

  private actionSheetCtrl = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);
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

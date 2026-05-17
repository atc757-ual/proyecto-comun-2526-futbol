import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  IonIcon, AlertController, ActionSheetController, ModalController,
  IonMenu, IonContent, IonMenuToggle, IonButton, IonItem, IonLabel,
  IonBackButton, IonBreadcrumbs, IonBreadcrumb, IonFooter, IonTabBar,
  IonTabButton, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, cartOutline, newspaperOutline, menuOutline, football,
  personOutline, logOutOutline, sparklesOutline, footballOutline, logoLinkedin, personCircleOutline,
  logoGithub, closeOutline, arrowBack, chevronBack, chevronForwardOutline, shieldCheckmarkOutline,
  trophyOutline, searchOutline
} from 'ionicons/icons';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';
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
export class MainLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public authService = inject(AuthService);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private menuCtrl = inject(MenuController);

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home-outline', adminOnly: false, masterOnly: false },
    { title: 'Mis jugadores', url: '/players', icon: 'football-outline', adminOnly: false, masterOnly: false },
    { title: 'Football AI', url: '/ai-team', icon: 'sparkles-outline', adminOnly: false, masterOnly: false },
    { title: 'Búsqueda', url: '/busqueda', icon: 'search-outline', adminOnly: false, masterOnly: false },
    { title: 'Noticias', url: '/news', icon: 'newspaper-outline', adminOnly: false, masterOnly: false }
  ];

  constructor() {
    addIcons({
      homeOutline, peopleOutline, cartOutline, newspaperOutline, menuOutline, footballOutline, personCircleOutline,
      personOutline, logOutOutline, sparklesOutline, logoLinkedin, logoGithub, closeOutline, arrowBack,
      chevronBack, chevronForwardOutline, shieldCheckmarkOutline, football, trophyOutline, searchOutline
    });
  }

  ngOnInit() {
    // Escuchamos cambios de ruta solo para resetear o manejar estados globales si fuera necesario
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
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
  private alertCtrl = inject(AlertController);
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
        this.authService.logout().then(() => this.router.navigate(['/login']));
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
            text: 'Cerrar Sesión',
            role: 'destructive',
            icon: 'log-out-outline',
            handler: () => {
              this.authService.logout().then(() => this.router.navigate(['/login']));
            }
          },
          { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
        ]
      });

      await actionSheet.present();
    }
  }
}

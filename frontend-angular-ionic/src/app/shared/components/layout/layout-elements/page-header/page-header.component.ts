import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuToggle, IonButton,
  IonIcon, IonTitle, IonLabel,
  ActionSheetController, ModalController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  football, menuOutline, arrowBack,
  personCircleOutline, logOutOutline,
  logInOutline, personAddOutline
} from 'ionicons/icons';
import { AuthService }      from 'src/app/core/services/auth/auth.service';
import { PlatformService }  from 'src/app/core/services/system/platform.service';
import { LayoutService }    from 'src/app/core/services/ui/layout.service';
import { NavigationService }from 'src/app/core/services/ui/navigation.service';
import { ConfirmModalComponent } from '../../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonButtons, IonMenuToggle, IonButton,
    IonIcon, IonTitle, IonLabel
  ]
})
export class PageHeaderComponent {
  @Input() mode: 'main' | 'public' = 'main';

  public authService     = inject(AuthService);
  public platformService = inject(PlatformService);
  public layoutService   = inject(LayoutService);
  public navService      = inject(NavigationService);
  private navCtrl        = inject(NavController);
  private modalCtrl      = inject(ModalController);
  private actionSheetCtrl= inject(ActionSheetController);

  constructor() {
    addIcons({
      football, menuOutline, arrowBack,
      personCircleOutline, logOutOutline,
      logInOutline, personAddOutline
    });
  }

  goTo(url: string): void {
    this.navCtrl.navigateRoot(url, { animated: false });
  }

  onLogoClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const dest = this.authService.currentUser() ? '/home' : '/auth/login';
    this.navCtrl.navigateRoot(dest, { animated: false });
  }

  showNavIcon(icon: string): boolean {
    return !['home', 'people', 'cart', 'newspaper'].includes(icon);
  }

  async logout(): Promise<void> {
    if (this.platformService.isDesktop) {
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

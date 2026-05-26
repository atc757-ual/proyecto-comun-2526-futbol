import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonMenuToggle, IonButton, IonIcon, IonMenu, IonContent, IonItem, IonLabel,
  ActionSheetController, ModalController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline, personCircleOutline, logOutOutline, football, closeOutline,
  homeOutline, newspaperOutline, footballOutline, sparklesOutline, personOutline, arrowBack,
  searchOutline
} from 'ionicons/icons';
import { AuthService }      from 'src/app/core/services/auth/auth.service';
import { PlatformService }  from 'src/app/core/services/system/platform.service';
import { LayoutService }    from 'src/app/core/services/ui/layout.service';
import { NavigationService }from 'src/app/core/services/ui/navigation.service';
import { ConfirmModalComponent } from '../../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-page-navigation',
  templateUrl: './page-navigation.component.html',
  styleUrls: ['./page-navigation.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonMenuToggle, IonButton, IonIcon, IonMenu, IonContent, IonItem, IonLabel]
})
export class PageNavigationComponent {
  public platformService = inject(PlatformService);
  public layoutService   = inject(LayoutService);
  public authService     = inject(AuthService);
  public navService      = inject(NavigationService);
  private navCtrl        = inject(NavController);
  private modalCtrl      = inject(ModalController);
  private actionSheetCtrl= inject(ActionSheetController);

  constructor() {
    addIcons({
      menuOutline, personCircleOutline, logOutOutline, football, closeOutline,
      homeOutline, newspaperOutline, footballOutline, sparklesOutline, personOutline, arrowBack,
      searchOutline
    });
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

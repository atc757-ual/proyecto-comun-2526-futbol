import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonIcon, IonContent,
  IonBackButton, IonBreadcrumbs, IonBreadcrumb,
  MenuController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  football, logoLinkedin, personCircleOutline, logoGithub, 
  arrowBack, personAddOutline, logInOutline, logOutOutline
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
    RouterModule,
    IonContent, IonIcon,
    IonBackButton, IonBreadcrumbs,
    IonBreadcrumb
  ]
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({
      personCircleOutline, personAddOutline, logoLinkedin, logoGithub, 
      arrowBack, football, logInOutline, logOutOutline
    });
  }

  logout() {
    this.authService.logout().then(() => this.navCtrl.navigateRoot('/login'));
  }

  onBreadcrumbClick(event: Event, item: any) {
    if (item.url === '/login' || (item.url === '/home' && !this.authService.currentUser())) {
      event.preventDefault();
      event.stopPropagation();
      this.navCtrl.navigateRoot('/login');
    }
  }

  onLogoClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.authService.currentUser()) {
      this.navCtrl.navigateRoot('/home');
    } else {
      this.navCtrl.navigateRoot('/login');
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

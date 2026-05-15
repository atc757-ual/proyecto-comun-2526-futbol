import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonIcon, IonContent,
  IonBackButton, IonBreadcrumbs, IonBreadcrumb,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline, football, personOutline, sparklesOutline, footballOutline, 
  logoLinkedin, personCircleOutline, logoGithub, closeOutline, 
  arrowBack, chevronBack, chevronForwardOutline, personAddOutline,
  logInOutline, logOutOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';

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
  private router = inject(Router);

  constructor() {
    addIcons({
      menuOutline, footballOutline, personCircleOutline, personAddOutline,
      personOutline, sparklesOutline, logoLinkedin, logoGithub, closeOutline, 
      arrowBack, chevronBack, chevronForwardOutline, football, logInOutline,
      logOutOutline
    });
  }

  logout() {
    this.authService.logout().then(() => this.router.navigate(['/login']));
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

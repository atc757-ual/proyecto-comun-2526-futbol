import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, logoLinkedin, logoGithub } from 'ionicons/icons';
import { filter } from 'rxjs/operators';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class AuthLayoutComponent implements OnInit {
  private router = inject(Router);
  private platform = inject(Platform);
  public layoutService = inject(LayoutService); // Inyectamos LayoutService

  isMobileApp: boolean = false;

  constructor() {
    addIcons({ arrowBack, logoLinkedin, logoGithub });
  }

  ngOnInit() {
    // Detección real de plataforma
    this.isMobileApp = this.platform.is('capacitor') || this.platform.is('cordova');
    
    // Escuchar cambios de ruta para resetear estados si fuera necesario
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // updateRouteData() COMENTADO: Ya no leemos de las rutas
    });
  }

  /* 
  COMENTADO: Ya no leemos de la ruta, usamos LayoutService
  private updateRouteData() {
    try {
      let route = this.router.routerState.root;
      while (route.firstChild) route = route.firstChild;
      const data = route.snapshot?.data;
      ...
    } catch (e) { }
  }
  */
}

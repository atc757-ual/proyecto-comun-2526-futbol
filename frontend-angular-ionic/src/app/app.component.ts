import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Auth, user } from '@angular/fire/auth';
import { NetworkPlugin } from './core/plugins/network-plugin';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { footballOutline, wifiOutline } from 'ionicons/icons';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonIcon, IonSpinner, CommonModule],
})
export class AppComponent implements OnInit {
  showSplash = true;
  isOffline = false;

  private router = inject(Router);
  private auth = inject(Auth);
  private networkService = inject(NetworkPlugin);

  constructor() {
    addIcons({ footballOutline, wifiOutline });
    this.initDeepLinks();
  }

  private user$ = user(this.auth);

  ngOnInit() {
    // 1. Monitorear estado de red inicial y cambios
    this.initNetworkMonitoring();

    // Duración mínima del splash + comprobación de sesión
    const minSplash = new Promise<void>(resolve => setTimeout(resolve, 1500));

    // Consultar el estado nativo de Firebase aquí evita arrastrar AuthService al bundle inicial.
    const authCheck = new Promise<string>(resolve => {
      this.user$.pipe(take(1)).subscribe(currentUser => {
        resolve(currentUser || localStorage.getItem('jwt_token') ? '/home' : '/auth/login');
      });
    });

    Promise.all([minSplash, authCheck]).then(([, ruta]) => {
      this.showSplash = false;

      const currentUrl = this.router.url;
      // Solo redirigir si el usuario está en la página de inicio o raíz
      // Esto evita que el router intente activar un outlet que ya está cargando una URL profunda
      if (currentUrl === '/' || currentUrl === '' || currentUrl.includes('start')) {
        this.router.navigate([ruta], { replaceUrl: true });
      }
    });
  }

  private async initNetworkMonitoring() {
    try {
      const status = await this.networkService.getStatus();
      this.isOffline = !status.connected;

      this.networkService.onStatusChange((newStatus) => {
        this.isOffline = !newStatus.connected;
      });
    } catch (e) {
      console.warn('[NETWORK] Error al inicializar el monitoreo de red:', e);
    }
  }

  private initDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const slug = event.url.split('.starter://').pop();
      if (slug) {
        this.router.navigateByUrl('/' + slug);
      }
    });
  }
}

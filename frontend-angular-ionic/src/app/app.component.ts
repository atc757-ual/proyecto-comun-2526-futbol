import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { addIcons } from 'ionicons';
import { footballOutline } from 'ionicons/icons';
import { take } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonIcon, IonSpinner, CommonModule],
})
export class AppComponent implements OnInit {
  showSplash = true;

  private router = inject(Router);
  private authService = inject(AuthService);
  private auth = inject(Auth);

  constructor() {
    addIcons({ footballOutline });
    this.initDeepLinks();
  }

  ngOnInit() {
    // Duración mínima del splash + comprobación de sesión
    const minSplash = new Promise<void>(resolve => setTimeout(resolve, 1500));

    // Esperar al observable de Firebase para tener la certeza del estado del usuario
    const authCheck = new Promise<string>(resolve => {
      this.authService.user$.pipe(take(1)).subscribe(user => {
        resolve(user ? '/home' : '/auth/login');
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

  private initDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const slug = event.url.split('.starter://').pop();
      if (slug) {
        this.router.navigateByUrl('/' + slug);
      }
    });
  }
}

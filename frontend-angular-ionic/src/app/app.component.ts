import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private router: Router, private zone: NgZone) {
    this.initializeApp();
  }

  initializeApp() {
    // Escuchar cuando la app se abre mediante una URL externa (Deep Link)
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        // Ejemplo de URL: io.ionic.starter://forgot-password?oobCode=123
        const slug = event.url.split('.starter://').pop();
        if (slug) {
          this.router.navigateByUrl('/' + slug);
        }
      });
    });
  }
}

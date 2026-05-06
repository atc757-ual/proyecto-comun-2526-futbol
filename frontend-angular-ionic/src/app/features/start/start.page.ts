import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonSpinner, NavController } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-start',
  template: `
    <ion-content class="ion-padding ion-text-center splash-container">
      <div class="center-content">
        <!-- Podrías poner aquí tu logo de fútbol -->
        <div class="logo-placeholder animate-pulse">
          <img src="assets/icon/favicon.png" alt="Logo" class="logo-img" />
        </div>
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="f-medium color-neutral-7">Cargando vestuarios...</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash-container {
      --background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .center-content {
      margin-top: 40vh;
    }
    .logo-img {
      width: 80px;
      margin-bottom: 20px;
    }
    .animate-pulse {
      animation: pulse 1.5s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner]
})
export class StartPage implements OnInit {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);

  ngOnInit() {
    this.checkSession();
  }

  private checkSession() {
    // Escuchamos el primer valor del estado de autenticación
    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        console.log('Sesión activa encontrada. Saltando al campo...');
        this.navCtrl.navigateRoot('/home', { animated: true, animationDirection: 'forward' });
      } else {
        console.log('Sin sesión. Por favor, identifícate.');
        this.navCtrl.navigateRoot('/auth/login', { animated: true, animationDirection: 'forward' });
      }
    });
  }
}

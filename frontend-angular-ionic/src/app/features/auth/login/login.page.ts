import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ToastController, LoadingController, NavController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { addIcons } from 'ionicons';
import { atOutline, lockClosedOutline, checkmarkCircleOutline, alertCircleOutline, peopleOutline, cafeOutline, logoNodejs } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule] // Importamos FormsModule para ngModel
})
export class LoginPage implements OnInit {
  // Variables que espera tu HTML
  userEmail: string = '';
  userPass: string = '';

  emailTouched = false;
  passTouched = false;
  emailFocused = false;
  passFocused = false;

  showPassword = false;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toastController = inject(ToastController);
  private layoutService = inject(LayoutService);
  public platformService = inject(PlatformService);

  constructor() {
    addIcons({
      atOutline, lockClosedOutline, checkmarkCircleOutline,
      alertCircleOutline, peopleOutline, cafeOutline, logoNodejs
    });
  }

  toggleBackend() {
    this.platformService.toggleBackend();
  }

  ngOnInit() {
    // Configurar AuthLayout dinámicamente
    this.layoutService.setAuth({
      title: '¡Bienvenido!',
      subtitle: 'Inicia sesión para gestionar tus jugadores.',
      isLogin: true
    });
  }

  // --- Funciones de Validación que espera tu HTML ---

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail);
  }

  isPasswordValid(): boolean {
    return this.userPass.length >= 6;
  }

  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  markEmailTouched() { this.emailTouched = true; this.emailFocused = false; }
  onFocusEmail() { this.emailFocused = true; }

  markPassTouched() { this.passTouched = true; this.passFocused = false; }
  onFocusPass() { this.passFocused = true; }

  async onLogin() {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    try {
      await this.authService.login(this.userEmail, this.userPass);
      
      console.log('[LOGIN] Login completado con éxito. Navegando a Home...');
      
      const successToast = await this.toastController.create({
        message: '¡Sesión iniciada con éxito!',
        duration: 2000,
        position: 'top',
        cssClass: 'toast-success',
        icon: 'checkmark-circle-outline',
        buttons: [{ role: 'cancel' }]
      });
      await successToast.present();

      // Navegamos
      await this.navCtrl.navigateRoot('/home');
      
    } catch (error: any) {
      console.error('[LOGIN] Error en el proceso de login:', error);
      const toast = await this.toastController.create({
        message: error.message || 'Credenciales inválidas',
        duration: 4000,
        position: 'top',
        cssClass: 'toast-error',
        icon: 'alert-circle-outline',
        buttons: [{ role: 'cancel' }]
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}

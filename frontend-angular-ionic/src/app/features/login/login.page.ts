import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonInput, IonButton, IonIcon, ToastController, NavController, IonSpinner, IonInputPasswordToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { mailOutline, lockClosedOutline, atOutline, alertCircleOutline, checkmarkCircleOutline, closeCircleOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonInputPasswordToggle
  ]
})
export class LoginPage implements OnInit {

  // Variables para controlar el formulario
  userEmail: string = '';
  userPass: string = '';
  emailTouched: boolean = false;
  passTouched: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;

  isLoading: boolean = false;

  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, atOutline, alertCircleOutline, checkmarkCircleOutline, closeCircleOutline, peopleOutline });
  }

  ngOnInit() { }

  // --- VALIDACIONES ---

  isEmailValid(): boolean {
    // Usamos un regex estándar que coincida con el patrón del HTML
    const emailRegex = /^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail);
  }

  isPasswordValid(): boolean {
    // Coincidimos con minlength="8" del HTML
    return this.userPass.length >= 8;
  }

  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  // --- EVENTOS ---

  markEmailTouched() {
    this.emailTouched = true;
    this.emailFocused = false;
  }

  markPassTouched() {
    this.passTouched = true;
    this.passFocused = false;
  }

  // Detectar cuando el usuario entra en el campo
  onFocusEmail() {
    this.emailFocused = true;
    this.emailTouched = false;
  }

  onFocusPass() {
    this.passFocused = true;
    this.passTouched = false;
  }

  async onLogin() {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    try {
      await this.authService.login(this.userEmail, this.userPass);
      this.showToast('¡Sesión iniciada con éxito!', 'success');
      this.navCtrl.navigateRoot('/home');
    } catch (error: any) {
      console.error('Error Login:', error);
      this.showToast(this.getErrorMessage(error.code), 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      cssClass: color === 'success' ? 'toast-success' : 'toast-error',
      buttons: [
        { 
          icon: color === 'success' ? 'checkmark-circle-outline' : 'close-circle-outline', 
          side: 'start', 
          handler: () => {} 
        }
      ]
    });
    await toast.present();
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found': return 'Usuario no registrado.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      case 'auth/invalid-credential': return 'Credenciales no válidas.';
      case 'auth/invalid-email': return 'Formato de email no válido.';
      default: return 'Error de autenticación. Inténtalo de nuevo.';
    }
  }

}

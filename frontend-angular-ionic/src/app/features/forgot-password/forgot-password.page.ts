import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { IonInput, IonButton, IonIcon, IonSpinner, ToastController, NavController, IonInputPasswordToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, atOutline, alertCircleOutline,
  checkmarkCircleOutline, arrowBackOutline,
  lockClosedOutline, shieldCheckmarkOutline,
  paperPlaneOutline, sparklesOutline,
  logInOutline, closeCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
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
export class ForgotPasswordPage implements OnInit {

  // Flow State
  currentStep: number = 1;
  isLoading: boolean = false;
  isEmailSent: boolean = false;
  isPasswordChanged: boolean = false; // Nuevo: Para el éxito final
  countdown: number = 0;
  private timer: any;
  oobCode: string | null = null;

  // Dynamic Labels
  step1Label: string = 'Solicitud';
  step2Label: string = 'Resultado';

  // Form Data
  userEmail: string = '';
  newPass: string = '';
  confirmPass: string = '';

  // Input States
  emailTouched: boolean = false;
  emailFocused: boolean = false;

  passTouched: boolean = false;
  passFocused: boolean = false;

  confirmTouched: boolean = false;
  confirmFocused: boolean = false;

  private authService = inject(AuthService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      mailOutline, atOutline, alertCircleOutline,
      checkmarkCircleOutline, arrowBackOutline,
      lockClosedOutline, shieldCheckmarkOutline,
      paperPlaneOutline, sparklesOutline,
      logInOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'] || params['code'] || null;

      if (this.oobCode) {
        this.currentStep = 1; // En flujo AppLink, el paso 1 es ingresar clave
        this.step1Label = 'Nueva Clave';
        this.step2Label = 'Éxito';
      } else {
        this.step1Label = 'Solicitud';
        this.step2Label = 'Enviado';
      }
    });
  }

  // --- TOASTS ---
  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
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

  // --- VALIDACIONES ---

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail) && this.userEmail.length >= 5;
  }

  isPasswordValid(): boolean {
    return this.newPass.length >= 8;
  }

  doPasswordsMatch(): boolean {
    return this.newPass === this.confirmPass && this.isPasswordValid() && this.confirmPass.length > 0;
  }

  isFormValid(): boolean {
    return this.isPasswordValid() && this.doPasswordsMatch();
  }

  // --- EVENTOS DE FOCO ---

  onFocusEmail() { this.emailFocused = true; this.emailTouched = false; }
  onBlurEmail() { this.emailFocused = false; this.emailTouched = true; }

  onFocusPass() { this.passFocused = true; this.passTouched = false; }
  onBlurPass() { this.passFocused = false; this.passTouched = true; }

  onFocusConfirm() { this.confirmFocused = true; this.confirmTouched = false; }
  onBlurConfirm() { this.confirmFocused = false; this.confirmTouched = true; }

  // --- ACCIONES DEL FLUJO ---

  async sendResetLink() {
    if (!this.isEmailValid()) return;

    this.isLoading = true;
    try {
      await this.authService.sendResetPasswordEmail(this.userEmail);
      this.isEmailSent = true;
      this.currentStep = 2;
      this.startCountdown(); // Iniciar cuenta atrás
      this.showToast('¡Enlace enviado! Revisa tu correo.', 'success');
    } catch (error: any) {
      console.error('Error Reset Link:', error);
      this.showToast('Error al enviar el email. Inténtalo de nuevo.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.navCtrl.navigateRoot('/auth/login');
  }

  startCountdown() {
    this.countdown = 60;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  async resetPassword() {
    if (!this.isFormValid() || !this.oobCode) return;

    this.isLoading = true;
    try {
      await this.authService.confirmReset(this.oobCode, this.newPass);
      this.isPasswordChanged = true;
      this.currentStep = 2; // Cambiamos al paso 2: ÉXITO
      this.showToast('Contraseña actualizada correctamente', 'success');
    } catch (error: any) {
      console.error('Error Reset Confirm:', error);
      this.showToast('El enlace ha expirado o es inválido.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

}

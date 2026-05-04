import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { IonInput, IonButton, IonIcon, IonSpinner, ToastController, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, atOutline, alertCircleOutline,
  checkmarkCircle, arrowBackOutline,
  lockClosedOutline, shieldCheckmarkOutline,
  paperPlaneOutline, sparklesOutline,
  logInOutline
} from 'ionicons/icons';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthLayoutComponent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      mailOutline, atOutline, alertCircleOutline,
      checkmarkCircle, arrowBackOutline,
      lockClosedOutline, shieldCheckmarkOutline,
      paperPlaneOutline, sparklesOutline,
      logInOutline
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
  async showToast(message: string, color: 'success' | 'error') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top',
      cssClass: color === 'success' ? 'toast-success' : 'toast-error',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }

  // --- VALIDACIONES ---

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail) && this.userEmail.length >= 5;
  }

  isPasswordValid(): boolean {
    return this.newPass.length >= 8;
  }

  doPasswordsMatch(): boolean {
    return this.newPass === this.confirmPass && this.isPasswordValid() && this.confirmPass.length > 0;
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

    // Simulación de envío
    setTimeout(() => {
      this.isLoading = false;
      this.isEmailSent = true;
      this.currentStep = 2;
      this.startCountdown(); // Iniciar cuenta atrás
      this.showToast('¡Enlace enviado! Revisa tu correo.', 'success');
    }, 1500);
  }

  goToLogin() {
    this.navCtrl.navigateRoot('/login');
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

  resetPassword() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.isPasswordChanged = true;
      this.currentStep = 2; // Cambiamos al paso 2: ÉXITO
      this.showToast('Contraseña actualizada correctamente', 'success');
    }, 2000);
  }

}

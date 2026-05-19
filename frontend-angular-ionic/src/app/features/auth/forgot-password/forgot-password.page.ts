import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { IonInput, IonButton, IonIcon, IonSpinner, NavController, IonInputPasswordToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  atOutline, alertCircleOutline,
  checkmarkCircleOutline,
  lockClosedOutline, shieldCheckmarkOutline,
  paperPlaneOutline, sparklesOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ToastService } from '../../../core/services/ui/toast.service';

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

  // Estados del flujo de recuperación de accesos
  currentStep: number = 1;
  isLoading: boolean = false;
  isEmailSent: boolean = false;
  isPasswordChanged: boolean = false;
  countdown: number = 0;
  private timer: any;
  oobCode: string | null = null;

  // Etiquetas de pasos dinámicas
  step1Label: string = 'Solicitud';
  step2Label: string = 'Resultado';

  // Datos capturados de los formularios
  userEmail: string = '';
  newPass: string = '';
  confirmPass: string = '';

  // Estados de interacción visual en los inputs
  emailTouched: boolean = false;
  emailFocused: boolean = false;

  passTouched: boolean = false;
  passFocused: boolean = false;

  confirmTouched: boolean = false;
  confirmFocused: boolean = false;

  // Inyecto los servicios globales necesarios en primera persona
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private toastService = inject(ToastService);

  // === CONSTRUCTOR Y CICLO DE VIDA ===

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController
  ) {
    // Registro únicamente los iconos que utilizo de forma local en la plantilla
    addIcons({
      atOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      lockClosedOutline,
      shieldCheckmarkOutline,
      paperPlaneOutline,
      sparklesOutline
    });
  }

  ngOnInit() {
    // Compruebo si el link de correo trae el código oobCode para restablecer la contraseña
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'] || params['code'] || null;

      const title = this.oobCode ? 'Nueva Contraseña' : 'Recuperar acceso';
      const subtitle = this.oobCode 
        ? 'Estás a un paso de recuperar tu cuenta.' 
        : 'Te enviaremos un enlace para restablecer tu clave.';

      this.layoutService.setAuth({
        title: title,
        subtitle: subtitle,
        isLogin: false
      });

      if (this.oobCode) {
        this.currentStep = 1;
        this.step1Label = 'Nueva Clave';
        this.step2Label = 'Éxito';
      } else {
        this.step1Label = 'Solicitud';
        this.step2Label = 'Enviado';
      }
    });
  }

  // === FUNCIONES DE ACCIONES ===

  /**
   * Envío el enlace de recuperación al correo electrónico indicado
   */
  async sendResetLink() {
    if (!this.isEmailValid()) return;

    this.isLoading = true;
    try {
      await this.authService.sendResetPasswordEmail(this.userEmail);
      this.isEmailSent = true;
      this.currentStep = 2;
      this.startCountdown();
      await this.toastService.showSuccess('¡Enlace enviado! Revisa tu correo.');
    } catch (error: any) {
      console.error('[FORGOT] Error al enviar el correo de recuperación:', error);
      await this.toastService.showError('Error al enviar el email. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Ejecuto el cambio definitivo de contraseña con el código de Firebase
   */
  async resetPassword() {
    if (!this.isFormValid() || !this.oobCode) return;

    this.isLoading = true;
    try {
      await this.authService.confirmReset(this.oobCode, this.newPass);
      this.isPasswordChanged = true;
      this.currentStep = 2;
      await this.toastService.showSuccess('Contraseña actualizada correctamente');
    } catch (error: any) {
      console.error('[FORGOT] Error al confirmar cambio de clave:', error);
      await this.toastService.showError('El enlace ha expirado o es inválido.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Redirecciono a la pantalla de inicio de sesión
   */
  goToLogin() {
    this.navCtrl.navigateRoot('/auth/login');
  }

  // === FUNCIONES DE SOPORTE ===

  /**
   * Compruebo el formato y longitud del correo electrónico
   */
  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail) && this.userEmail.length >= 5;
  }

  /**
   * Verifico que la contraseña nueva posea el largo mínimo
   */
  isPasswordValid(): boolean {
    return this.newPass.length >= 8;
  }

  /**
   * Compruebo si el campo de confirmación coincide con la nueva clave
   */
  doPasswordsMatch(): boolean {
    return this.newPass === this.confirmPass && this.isPasswordValid() && this.confirmPass.length > 0;
  }

  /**
   * Valido globalmente el formulario del restablecimiento
   */
  isFormValid(): boolean {
    return this.isPasswordValid() && this.doPasswordsMatch();
  }

  // Control de enfoque en el input Email
  onFocusEmail() { this.emailFocused = true; }
  onBlurEmail() { this.emailFocused = false; this.emailTouched = true; }

  // Control de enfoque en el input Contraseña
  onFocusPass() { this.passFocused = true; this.passTouched = false; }
  onBlurPass() { this.passFocused = false; this.passTouched = true; }

  // Control de enfoque en el input Confirmar Contraseña
  onFocusConfirm() { this.confirmFocused = true; this.confirmTouched = false; }
  onBlurConfirm() { this.confirmFocused = false; this.confirmTouched = true; }

  /**
   * Gestor de la cuenta atrás para habilitar el reenvío de email
   */
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
}

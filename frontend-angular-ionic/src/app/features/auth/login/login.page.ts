import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { addIcons } from 'ionicons';
import { atOutline, lockClosedOutline, peopleOutline, cafeOutline, logoNodejs } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { LoggerService } from 'src/app/core/services/system/logger.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule]
})
export class LoginPage {

  // Inicializo las variables de campos y estados del formulario
  userEmail: string = '';
  userPass: string = '';

  emailTouched = false;
  passTouched = false;
  emailFocused = false;
  passFocused = false;

  isLoading = false;

  // Inyecto los servicios para la autenticación, navegación, avisos y layouts
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly toastService = inject(ToastService);
  private readonly layoutService = inject(LayoutService);
  public platformService = inject(PlatformService);
  private readonly logger = inject(LoggerService);
  // === CONSTRUCTOR Y CICLO DE VIDA ===
  constructor() {
    // Registro los iconos requeridos específicamente en esta pantalla
    addIcons({
      atOutline, lockClosedOutline, peopleOutline, cafeOutline, logoNodejs
    });
  }

  ionViewWillEnter() {
    // Ensure the layout knows we are on the login screen each time the view is entered (covers back navigation)
    this.layoutService.setAuth({ isLogin: true });
  }

  // === FUNCIONES PRINCIPALES ===

  /**
   * Ejecuto el inicio de sesión del usuario con validaciones previas
   */
  async onLogin() {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    try {
      // Intento la autenticación con el correo y clave
      await this.authService.login(this.userEmail, this.userPass);
      console.log('[LOGIN] Login completado con éxito. Navegando a Home...');
      // Muestro el aviso de éxito utilizando el servicio global
      await this.toastService.showSuccess('¡Sesión iniciada con éxito!');
      // Redirecciono a la pantalla de inicio directamente
      await this.navCtrl.navigateRoot('/home', { animated: false });

    } catch (error: any) {
      this.logger.error('[LOGIN] Error en el proceso de login:', error);
      // Muestro el aviso de error adaptado utilizando el servicio global
      await this.toastService.showError(this.getErrorMessage(error));
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Alterno el backend activo desde el switch de plataforma
   */
  toggleBackend() {
    this.platformService.toggleBackend();
  }

  // === FUNCIONES DE APOYO ===

  /**
   * Traduzco los códigos de error técnicos a mensajes amigables para el usuario
   */
  private getErrorMessage(error: any): string {
    const code = error?.code;
    const message = error?.message;

    // Errores HTTP del backend (HttpErrorResponse: status numérico sin code de Firebase)
    if (typeof error?.status === 'number') {
      switch (error.status) {
        case 401:
          return 'No se pudo verificar tu identidad con el servidor. Inténtalo de nuevo.';
        case 404:
          return 'El servidor de autenticación no está disponible en este momento. Inténtalo más tarde.';
        case 0:
          return 'Sin conexión con el servidor. Comprueba tu conexión a internet.';
        default:
          return 'Error del servidor al iniciar sesión. Inténtalo más tarde.';
      }
    }

    // Errores de Firebase Auth (tienen code tipo 'auth/...')
    switch (code) {
      case 'auth/email-not-verified':
        return 'Debes verificar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.';
      case 'auth/user-disabled':
        return 'Tu cuenta ha sido inhabilitada. Por favor, ponte en contacto con el administrador.';
      case 'auth/invalid-credential':
        return 'El correo o la contraseña son incorrectos.';
      case 'auth/user-not-found':
        return 'El correo ingresado no está registrado.';
      case 'auth/too-many-requests':
        return 'Acceso bloqueado temporalmente por demasiados intentos fallidos. Inténtalo más tarde.';
      case 'auth/invalid-email':
        return 'El formato del correo no es válido.';
      default:
        // Manejo casos donde el código no sea exacto pero el mensaje contenga el error de credenciales
        if (message && message.includes('invalid-credential')) {
          return 'El correo o la contraseña son incorrectos.';
        }
        return message || 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
    }
  }

  /**
   * Valido si el email ingresado tiene un formato correcto
   */
  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail);
  }

  /**
   * Valido si la contraseña tiene la longitud mínima requerida
   */
  isPasswordValid(): boolean {
    return this.userPass.length >= 8;
  }

  /**
   * Valido que el formulario esté en un estado correcto para permitir el envío
   */
  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  // Controladores de foco y edición para el campo de email
  markEmailTouched() {
    this.emailTouched = true;
    this.emailFocused = false;
  }

  onFocusEmail() {
    this.emailFocused = true;
  }

  // Controladores de foco y edición para el campo de contraseña
  markPassTouched() {
    this.passTouched = true;
    this.passFocused = false;
  }

  onFocusPass() {
    this.passFocused = true;
  }
}

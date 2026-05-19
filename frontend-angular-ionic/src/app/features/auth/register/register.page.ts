import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonInput, IonButton, IonIcon,
  IonSpinner, IonInputPasswordToggle, NavController,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonCheckbox, IonLabel, IonContent,
  IonItem, ModalController, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, atOutline, lockClosedOutline,
  shieldCheckmarkOutline, checkmarkCircleOutline,
  closeOutline, arrowDownOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { PlatformService } from '../../../core/services/system/platform.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonInputPasswordToggle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonCheckbox,
    IonLabel,
    IonContent,
    IonItem,
    IonSkeletonText
  ]
})
export class RegisterPage implements OnInit {

  // Inicializo los campos de formulario y banderas de control de carga
  userName: string = '';
  userEmail: string = '';
  userPass: string = '';
  confirmPass: string = '';
  acceptTerms: boolean = false;
  termsInteractable: boolean = false;

  public showTermsOverlay: boolean = false;
  public hasReadTerms: boolean = false;
  public isLoading: boolean = false;
  public isTermsLoading: boolean = false;

  // Variables para la visualización del contenido de términos y condiciones
  public termsTitle: string = 'Términos y Condiciones';
  public termsContent: string = 'Cargando términos...';

  // Controles de interacción con inputs
  nameTouched: boolean = false;
  emailTouched: boolean = false;
  passTouched: boolean = false;
  confirmTouched: boolean = false;

  nameFocused: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;
  confirmFocused: boolean = false;

  // Inyecto los servicios globales necesarios en primera persona
  public platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private toastService = inject(ToastService);
  private modalCtrl = inject(ModalController);

  // === CONSTRUCTOR Y CICLO DE VIDA ===

  constructor(
    private navCtrl: NavController
  ) {
    // Registro los iconos requeridos únicamente para esta plantilla
    addIcons({
      personOutline,
      atOutline,
      lockClosedOutline,
      shieldCheckmarkOutline,
      checkmarkCircleOutline,
      closeOutline,
      arrowDownOutline
    });
  }

  async ngOnInit() {
    // Inicializo el layout de cabecera de autenticación
    this.layoutService.setAuth({
      title: 'Únete al equipo',
      subtitle: 'Crea tu cuenta para empezar a gestionar jugadores.',
      isLogin: false
    });
  }

  // === FUNCIONES PRINCIPALES ===

  /**
   * Ejecuto el registro de la cuenta del usuario
   */
  async onRegister() {
    if (!this.isFormValid() || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      // 1. Invoco la creación de la cuenta en el servicio de autenticación
      await this.authService.register(this.userEmail, this.userPass, this.userName);

      this.isLoading = false;

      // 2. Muestro el modal de confirmación
      try {
        const successModal = await this.modalCtrl.create({
          component: ConfirmModalComponent,
          cssClass: 'premium-modal',
          backdropDismiss: false,
          componentProps: {
            title: `¡Enhorabuena, ${this.capitalizedName}!`,
            message: 'Tu cuenta ha sido creada. Hemos enviado un correo de verificación a tu dirección de email.<br>Por favor, verifícalo para poder acceder.',
            confirmText: 'Ir a Iniciar Sesión',
            cancelText: 'Cerrar',
            type: 'success'
          }
        });

        await successModal.present();
        const { data } = await successModal.onWillDismiss();

        // En cualquier caso, redirijo al login puesto que la sesión se cierra hasta verificar el correo
        this.navCtrl.navigateRoot('/login', { animated: false });

      } catch (modalErr) {
        console.error('[REGISTER] Error al instanciar el modal:', modalErr);
        this.navCtrl.navigateRoot('/login', { animated: false });
      }

    } catch (error: any) {
      this.isLoading = false;
      console.error('[REGISTER] Error al crear la cuenta:', error);
      await this.toastService.showError(this.getErrorMessage(error.code));
    }
  }

  /**
   * Abro la ventana superpuesta de los términos y condiciones de la app
   */
  async openTermsOverlay() {
    this.showTermsOverlay = true;
    this.termsInteractable = false;
    this.hasReadTerms = false;

    // Cargo el documento correspondiente desde Firestore si aún no ha sido cargado
    if (this.termsContent === 'Cargando términos...') {
      this.isTermsLoading = true;
      const termsData: any = await this.authService.getTermsAndConditions();
      if (termsData) {
        this.termsTitle = termsData.title ? String(termsData.title) : this.termsTitle;
        this.termsContent = termsData.content ? String(termsData.content) : this.termsContent;
      }
      this.isTermsLoading = false;
    }
  }

  /**
   * Cierro la vista superpuesta de términos
   */
  closeTermsOverlay() {
    this.showTermsOverlay = false;
  }

  /**
   * Apruebo los términos leídos y cierro el overlay activando el formulario
   */
  acceptAndCloseOverlay() {
    this.acceptTerms = true;
    this.termsInteractable = true;
    this.showTermsOverlay = false;
  }

  /**
   * Capturo el teclado de forma global para procesar el submit al presionar Enter
   */
  @HostListener('window:keyup.enter', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.showTermsOverlay) return;

    this.onRegister();
  }

  // === FUNCIONES DE APOYO ===

  /**
   * Valido que el nombre tenga caracteres válidos y longitud correcta
   */
  isNameValid(): boolean {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return nameRegex.test(this.userName) && this.userName.length >= 3 && this.userName.length <= 250;
  }

  /**
   * Valido el formato del email
   */
  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail) && this.userEmail.length >= 5;
  }

  /**
   * Valido que la contraseña cumpla con los 8 caracteres mínimos
   */
  isPasswordValid(): boolean {
    return this.userPass.length >= 8;
  }

  /**
   * Verifico la coincidencia de contraseñas ingresadas
   */
  doPasswordsMatch(): boolean {
    return this.userPass === this.confirmPass && this.isPasswordValid() && this.confirmPass.length > 0;
  }

  /**
   * Valido si todo el formulario es correcto y se aceptaron los términos
   */
  isFormValid(): boolean {
    return this.isNameValid() && this.isEmailValid() && this.isPasswordValid() && this.doPasswordsMatch() && this.acceptTerms;
  }

  /**
   * Escucho el desmarcado manual del checkbox de términos
   */
  onTermsCheckboxChange(event: any) {
    if (event.detail.checked === false) {
      this.termsInteractable = false;
      this.hasReadTerms = false;
    }
  }

  /**
   * Detecto cuando el scroll de los términos llega al fondo para habilitar el botón
   */
  async onTermsScroll(event: any, content: IonContent) {
    if (this.hasReadTerms) return;
    const scrollElement = await content.getScrollElement();
    const isAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 20;
    if (isAtBottom) {
      this.hasReadTerms = true;
    }
  }

  // Controladores de foco para Nombre Completo
  onFocusName() { this.nameFocused = true; this.nameTouched = false; }
  onBlurName() { this.nameFocused = false; this.nameTouched = true; }

  // Controladores de foco para Email
  onFocusEmail() { this.emailFocused = true; this.emailTouched = false; }
  onBlurEmail() { this.emailFocused = false; this.emailTouched = true; }

  // Controladores de foco para Contraseña
  onFocusPass() { this.passFocused = true; this.passTouched = false; }
  onBlurPass() { this.passFocused = false; this.passTouched = true; }

  // Controladores de foco para Confirmación
  onFocusConfirm() { this.confirmFocused = true; this.confirmTouched = false; }
  onBlurConfirm() { this.confirmFocused = false; this.confirmTouched = true; }

  /**
   * Retorno un mensaje legible para el usuario final según el código de Firebase
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'El email ya está registrado.';
      case 'auth/invalid-email': return 'El formato del email no es válido.';
      case 'auth/weak-password': return 'La contraseña es muy débil.';
      default: return 'Error al registrar. Inténtalo de nuevo.';
    }
  }

  /**
   * Formateo y retorno el primer nombre con capitalización limpia
   */
  get capitalizedName(): string {
    if (!this.userName) return '';
    const firstName = this.userName.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
}

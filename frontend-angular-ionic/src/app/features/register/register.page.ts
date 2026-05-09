import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonInput, IonButton, IonIcon,
  IonSpinner, ToastController, IonInputPasswordToggle, NavController,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonFooter, IonCheckbox, IonLabel, IonContent,
  IonItem, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, atOutline, lockClosedOutline,
  shieldCheckmarkOutline, alertCircleOutline,
  checkmarkCircleOutline, arrowForwardOutline,
  closeCircleOutline, checkmarkCircle, closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { PlatformService } from '../../core/services/platform.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

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
    IonFooter,
    IonCheckbox,
    IonLabel,
    IonContent,
    IonItem,
    ConfirmModalComponent
  ]
})
export class RegisterPage implements OnInit {

  // Form Data
  userName: string = '';
  userEmail: string = '';
  userPass: string = '';
  confirmPass: string = '';
  acceptTerms: boolean = false;
  termsInteractable: boolean = false;

  public platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private modalCtrl = inject(ModalController);

  public showTermsOverlay: boolean = false;
  public hasReadTerms: boolean = false;
  public isLoading: boolean = false;

  nameTouched: boolean = false;
  emailTouched: boolean = false;
  passTouched: boolean = false;
  confirmTouched: boolean = false;

  nameFocused: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;
  confirmFocused: boolean = false;

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline, atOutline, lockClosedOutline,
      shieldCheckmarkOutline, alertCircleOutline,
      checkmarkCircleOutline, arrowForwardOutline,
      closeCircleOutline, checkmarkCircle, closeOutline
    });
  }

  ngOnInit() {
    this.layoutService.setAuth({
      title: 'Únete al equipo',
      subtitle: 'Crea tu cuenta para empezar a gestionar jugadores.',
      isLogin: false
    });
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      cssClass: color === 'success' ? 'toast-success' : 'toast-error',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
      buttons: [{ role: 'cancel' }]
    });
    await toast.present();
  }

  // --- VALIDACIONES ---
  isNameValid(): boolean {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return nameRegex.test(this.userName) && this.userName.length >= 3 && this.userName.length <= 250;
  }

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail) && this.userEmail.length >= 5;
  }

  isPasswordValid(): boolean {
    return this.userPass.length >= 8;
  }

  doPasswordsMatch(): boolean {
    return this.userPass === this.confirmPass && this.isPasswordValid() && this.confirmPass.length > 0;
  }

  isFormValid(): boolean {
    return this.isNameValid() && this.isEmailValid() && this.isPasswordValid() && this.doPasswordsMatch() && this.acceptTerms;
  }

  // --- LÓGICA DE TÉRMINOS ---
  openTermsOverlay() {
    this.showTermsOverlay = true;
    this.hasReadTerms = false;
    this.termsInteractable = false;
  }

  closeTermsOverlay() {
    this.showTermsOverlay = false;
  }

  acceptAndCloseOverlay() {
    this.acceptTerms = true;
    this.termsInteractable = true;
    this.showTermsOverlay = false;
  }

  onTermsCheckboxChange(event: any) {
    if (event.detail.checked === false) {
      this.termsInteractable = false;
      this.hasReadTerms = false;
    }
  }

  async onTermsScroll(event: any, content: IonContent) {
    if (this.hasReadTerms) return;
    const scrollElement = await content.getScrollElement();
    const isAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 20;
    if (isAtBottom) {
      this.hasReadTerms = true;
    }
  }

  // --- EVENTOS DE FOCO ---
  onFocusName() { this.nameFocused = true; this.nameTouched = false; }
  onBlurName() { this.nameFocused = false; this.nameTouched = true; }
  onFocusEmail() { this.emailFocused = true; this.emailTouched = false; }
  onBlurEmail() { this.emailFocused = false; this.emailTouched = true; }
  onFocusPass() { this.passFocused = true; this.passTouched = false; }
  onBlurPass() { this.passFocused = false; this.passTouched = true; }
  onFocusConfirm() { this.confirmFocused = true; this.confirmTouched = false; }
  onBlurConfirm() { this.confirmFocused = false; this.confirmTouched = true; }

  // Escuchar la tecla Enter en toda la ventana
  @HostListener('window:keyup.enter', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Si el overlay de términos está abierto, no hacemos nada (para no registrar mientras lee)
    if (this.showTermsOverlay) return;

    this.onRegister();
  }

  async onRegister() {
    if (!this.isFormValid() || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      // 1. Ejecutar Registro
      await this.authService.register(this.userEmail, this.userPass, this.userName);

      // 2. IMPORTANTE: Parar el spinner de inmediato
      this.isLoading = false;

      // 3. Intentar mostrar el modal premium
      try {
        const successModal = await this.modalCtrl.create({
          component: ConfirmModalComponent,
          cssClass: 'premium-modal',
          backdropDismiss: false,
          componentProps: {
            title: `¡Enhorabuena, ${this.capitalizedName}!`,
            message: 'Tu cuenta ha sido creada correctamente. <br>Prepárate para vivir la experiencia real del fútbol.',
            confirmText: 'Ir a la App',
            cancelText: 'Más tarde',
            type: 'success'
          }
        });

        await successModal.present();
        const { data } = await successModal.onWillDismiss();

        if (data === true) {
          // Confirmó: Ir a la App
          this.navCtrl.navigateRoot('/home', { animated: true, animationDirection: 'forward' });
        } else {
          // Canceló: Más tarde. Cerramos la sesión automática y volvemos al login
          await this.authService.logout();
          this.navCtrl.navigateRoot('/auth/login', { animated: true, animationDirection: 'back' });
        }

      } catch (modalErr) {
        console.error('Error al mostrar modal:', modalErr);
        // Fallback: Si el modal falla, navegamos directo
        this.navCtrl.navigateRoot('/home', { animated: true });
      }

    } catch (error: any) {
      this.isLoading = false;
      console.error('Error Register:', error);
      this.showToast(this.getErrorMessage(error.code), 'danger');
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'El email ya está registrado.';
      case 'auth/invalid-email': return 'El formato del email no es válido.';
      case 'auth/weak-password': return 'La contraseña es muy débil.';
      default: return 'Error al registrar. Inténtalo de nuevo.';
    }
  }

  get capitalizedName(): string {
    if (!this.userName) return '';
    const firstName = this.userName.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
}

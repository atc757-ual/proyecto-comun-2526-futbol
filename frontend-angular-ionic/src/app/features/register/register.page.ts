import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonInput, IonButton, IonIcon, IonModal,
  IonSpinner, ToastController, IonInputPasswordToggle, NavController,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonFooter, IonCheckbox, IonLabel, IonContent,
  IonItem
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
    IonModal,
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
    IonItem
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

  get termsBreakpoints(): number[] | undefined {
    return this.platformService.isDesktop ? undefined : [0, 0.25, 0.5, 0.75];
  }

  get termsInitialBreakpoint(): number | undefined {
    return this.platformService.isDesktop ? undefined : 0.75;
  }

  public showTermsOverlay: boolean = false;

  // Open overlay and reset read state
  openTermsOverlay() {
    this.showTermsOverlay = true;
    this.hasReadTerms = false;
    this.termsInteractable = false;
  }

  // Close overlay without accepting
  closeTermsOverlay() {
    this.showTermsOverlay = false;
  }

  // Accept terms and close overlay
  acceptAndCloseOverlay() {
    this.acceptTerms = true;
    this.termsInteractable = true;
    this.showTermsOverlay = false;
  }

  // Handle manual checkbox unchecking
  onTermsCheckboxChange(event: any) {
    if (event.detail.checked === false) {
      // Si el usuario desmarca la casilla, inhabilitamos y forzamos lectura de nuevo
      this.termsInteractable = false;
      this.hasReadTerms = false;
    }
  }

  @ViewChild('modal') modal!: IonModal;
  public platformService = inject(PlatformService);

  // State for terms overlay
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

  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

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

  onModalWillPresent() {
    if (!this.acceptTerms) {
      this.hasReadTerms = false;
    }
  }

  async onModalDidPresent(event: any) {
    if (this.hasReadTerms) return;

    const modal = event.target;
    const content = modal.querySelector('ion-content');
    if (!content) return;

    const scrollElement = await content.getScrollElement();
    const isAtBottom = scrollElement.scrollHeight <= scrollElement.clientHeight + 20;

    if (isAtBottom) {
      this.hasReadTerms = true;
    }
  }

  async onTermsScroll(event: any, content: IonContent) {
    if (this.hasReadTerms) return;

    const scrollElement = await content.getScrollElement();
    // Si el scroll llega cerca del final (20px de margen)
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

  async onRegister() {
    if (!this.isFormValid()) {
      this.showToast('Por favor, revisa los campos con errores.', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.register(this.userEmail, this.userPass, this.userName);
      this.showToast('¡Registro completado con éxito!', 'success');
      this.modal.present();
    } catch (error: any) {
      console.error('Error Register:', error);
      this.showToast(this.getErrorMessage(error.code), 'danger');
    } finally {
      this.isLoading = false;
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

  closeModal() {
    this.modal.dismiss();
    this.navCtrl.navigateRoot('/home', { animated: true, animationDirection: 'forward' });
  }

  get capitalizedName(): string {
    if (!this.userName) return '';
    const firstName = this.userName.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }

}

import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonInput, IonButton, IonIcon, IonModal,
  IonSpinner, ToastController, IonInputPasswordToggle, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, atOutline, lockClosedOutline,
  shieldCheckmarkOutline, alertCircleOutline,
  checkmarkCircleOutline, arrowForwardOutline,
  closeCircleOutline, checkmarkCircle
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

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
    IonInputPasswordToggle
  ]
})
export class RegisterPage implements OnInit {

  @ViewChild('modal') modal!: IonModal;

  // Form Data
  userName: string = '';
  userEmail: string = '';
  userPass: string = '';
  confirmPass: string = '';

  // State
  isLoading: boolean = false;

  // Validation States
  nameTouched: boolean = false;
  emailTouched: boolean = false;
  passTouched: boolean = false;
  confirmTouched: boolean = false;

  nameFocused: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;
  confirmFocused: boolean = false;

  private authService = inject(AuthService);

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline, atOutline, lockClosedOutline,
      shieldCheckmarkOutline, alertCircleOutline,
      checkmarkCircleOutline, arrowForwardOutline,
      closeCircleOutline, checkmarkCircle
    });
  }

  ngOnInit() { }

  // --- TOASTS ---
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
          handler: () => { }
        }
      ]
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
    return this.isNameValid() && this.isEmailValid() && this.isPasswordValid() && this.doPasswordsMatch();
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

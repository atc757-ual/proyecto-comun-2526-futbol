import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonInput, IonButton, IonIcon, IonModal, 
  IonSpinner, IonItem, IonLabel, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, atOutline, lockClosedOutline, 
  shieldCheckmarkOutline, alertCircleOutline, 
  checkmarkCircle, arrowForwardOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    AuthLayoutComponent,
    IonInput,
    IonButton,
    IonIcon,
    IonModal,
    IonSpinner,
    IonItem,
    IonLabel
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

  constructor(
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ 
      personOutline, atOutline, lockClosedOutline, 
      shieldCheckmarkOutline, alertCircleOutline, 
      checkmarkCircle, arrowForwardOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {}

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

  isNameValid(): boolean {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return nameRegex.test(this.userName) && this.userName.length >= 5 && this.userName.length <= 250;
  }

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    if (this.isFormValid()) {
      this.isLoading = true;
      
      // Simulación de registro
      setTimeout(() => {
        this.isLoading = false;
        this.showToast('¡Registro completado con éxito! Bienvenido.', 'success');
        this.modal.present();
      }, 2000);
    } else {
      this.showToast('Por favor, revisa los campos con errores.', 'error');
    }
  }

  closeModal() {
    this.modal.dismiss();
    this.router.navigate(['/login']);
  }

}

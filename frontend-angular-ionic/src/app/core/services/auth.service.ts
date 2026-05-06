import { inject, Injectable } from '@angular/core';
import {
  Auth, user, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword,
  sendPasswordResetEmail, confirmPasswordReset,
  verifyPasswordResetCode, ActionCodeSettings
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Estado reactivo del usuario
  public user$ = user(this.auth);
  public currentUser = toSignal(this.user$);
  public isLoggedIn$ = this.user$.pipe(map(user => !!user));

  /**
   * Inicia sesión con email y contraseña
   */
  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Cierra la sesión activa
   */
  async logout() {
    return signOut(this.auth);
  }

  /**
   * Registra un nuevo usuario en Firebase Auth
   */
  async register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Envía un correo para restablecer la contraseña con soporte para Deep Links
   */
  async sendResetPasswordEmail(email: string) {
    const actionCodeSettings: ActionCodeSettings = {
      // URL de vuelta para Web (Debe estar autorizada en Firebase Console)
      url: 'http://localhost:8101/auth/login',
      handleCodeInApp: true,
    };

    return sendPasswordResetEmail(this.auth, email, actionCodeSettings);
  }

  /**
   * Verifica el código de restablecimiento de contraseña
   */
  async verifyResetCode(code: string) {
    return verifyPasswordResetCode(this.auth, code);
  }

  /**
   * Confirma el cambio de contraseña con el código
   */
  async confirmReset(code: string, newPass: string) {
    return confirmPasswordReset(this.auth, code, newPass);
  }

  /**
   * Obtiene el ID único del usuario actual
   */
  getUID() {
    return this.auth.currentUser?.uid;
  }
}

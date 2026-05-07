import { inject, Injectable } from '@angular/core';
import {
  Auth, user, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword,
  sendPasswordResetEmail, confirmPasswordReset,
  verifyPasswordResetCode, ActionCodeSettings
} from '@angular/fire/auth';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { Platform } from '@ionic/angular/standalone';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private platform = inject(Platform);

  // Estado reactivo del usuario (Depende de Firebase Y del Token de Node)
  public user$ = user(this.auth);
  public currentUser = toSignal(this.user$);
  public isLoggedIn$ = this.user$.pipe(
    map(user => !!user && !!localStorage.getItem('jwt_token'))
  );

  constructor() {
    console.log('[AUTH] Inicializado');
  }

  /**
   * Inicia sesión con email y contraseña y sincroniza con el backend Node.js
   */
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    console.log('[AUTH-DEBUG] Login Firebase exitoso. Iniciando sincronización...');
    await this.syncUserWithBackend();
    return userCredential;
  }

  /**
   * Cierra la sesión activa
   */
  async logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    return signOut(this.auth);
  }

  /**
   * Registra un nuevo usuario, guarda su nombre en Firebase y sincroniza con el backend Node.js
   */
  async register(email: string, password: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    // GUARDAR EL NOMBRE EN FIREBASE
    if (userCredential.user) {
      const { updateProfile } = await import('@angular/fire/auth');
      await updateProfile(userCredential.user, { displayName: name });
    }

    await this.syncUserWithBackend();
    return userCredential;
  }

  /**
   * Sincroniza el usuario de Firebase con el backend de Node.js para obtener el JWT
   */
  private async syncUserWithBackend() {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return;

    try {
      const idToken = await firebaseUser.getIdToken();
      console.log('--- DEBUG: FIREBASE ID TOKEN ---');
      console.log(idToken);
      console.log('--------------------------------');

      const fullUrl = `${environment.nodeApiUrl}/auth/signin`;
      console.log(`[AUTH-DEBUG] Disparando petición a: ${fullUrl}`);
      const response: any = await firstValueFrom(
        this.http.post(fullUrl, { idToken })
      );

      if (response && response.data && response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));

        console.log('--- DEBUG: BACKEND JWT (NUESTRO) ---');
        console.log(response.data.token);
        console.log('Usuario sincronizado con el backend Node.js. JWT almacenado.');
      }
    } catch (error) {
      console.error('Error al sincronizar con el backend Node.js:', error);
      throw error;
    }
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

  /**
   * Obtiene los datos del usuario guardados tras la sincronización con el backend
   */
  getUserData() {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Verifica si el usuario actual tiene rol de administrador
   */
  isAdmin(): boolean {
    const user = this.getUserData();
    // Ajusta 'admin' según el valor exacto que envíe tu backend Node.js
    return user && (user.role === 'admin' || user.role === 'ADMIN');
  }
}

import { inject, Injectable, signal, computed } from '@angular/core';
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

  // --- SIGNALS DE ESTADO ---
  private _userData = signal<any>(this.loadInitialUserData());
  public userData = this._userData.asReadonly();

  // Signal computado para obtener solo el primer nombre
  public firstName = computed(() => {
    const user = this.userData();
    if (!user || !user.name) return '';
    const first = user.name.split(' ')[0].toLowerCase();
    return first.charAt(0).toUpperCase() + first.slice(1);
  });

  // Estado reactivo del usuario (Depende de Firebase Y del Token de Node)
  public user$ = user(this.auth);
  public currentUser = toSignal(this.user$);
  public isLoggedIn$ = this.user$.pipe(
    map(user => !!user && !!localStorage.getItem('jwt_token'))
  );

  private loadInitialUserData() {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

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
    this._userData.set(null);
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
        this._userData.set(response.data.user);

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
   * Verifica si el usuario actual tiene rol de administrador.
   * Se obtiene del JWT para evitar manipulación manual en LocalStorage.
   */
  isAdmin(): boolean {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;

    try {
      // El JWT tiene 3 partes: Header.Payload.Signature
      // El payload es la parte del medio codificada en Base64
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));

      // Ajusta 'admin' según el valor exacto que envíes tu backend Node.js
      return payloadJson && (payloadJson.role === 'admin' || payloadJson.role === 'ADMIN' || payloadJson.role === 'Admin');
    } catch (e) {
      console.error('[AUTH] Error al decodificar el token para isAdmin:', e);
      return false;
    }
  }

  /**
   * Verifica si el usuario actual es el Administrador Maestro (Super Admin).
   * Se obtiene del claim 'master' del JWT.
   */
  isMasterAdmin(): boolean {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));
      return payloadJson && payloadJson.master === true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Promueve a un usuario a Administrador.
   * Solo disponible para el Master Admin.
   */
  async promoteUserToAdmin(email: string) {
    const fullUrl = `${environment.nodeApiUrl}/auth/make-admin`;
    const token = localStorage.getItem('jwt_token');

    return firstValueFrom(
      this.http.post(fullUrl, { email }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  /**
   * Quita el rol de Administrador a un usuario.
   * Solo disponible para el Master Admin.
   */
  async removeAdminRole(email: string) {
    const fullUrl = `${environment.nodeApiUrl}/auth/remove-admin`;
    const token = localStorage.getItem('jwt_token');

    return firstValueFrom(
      this.http.post(fullUrl, { email }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  /**
   * Busca usuarios por email.
   */
  async searchUsers(email: string = '') {
    const fullUrl = `${environment.nodeApiUrl}/auth/users?email=${email}`;
    const token = localStorage.getItem('jwt_token');

    return firstValueFrom(
      this.http.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  /**
   * Cambia el estado de activación de un usuario (Habilitar/Inhabilitar).
   */
  async toggleUserStatus(email: string, disabled: boolean) {
    const fullUrl = `${environment.nodeApiUrl}/auth/toggle-status`;
    const token = localStorage.getItem('jwt_token');

    return firstValueFrom(
      this.http.post(fullUrl, { email, disabled }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }
}

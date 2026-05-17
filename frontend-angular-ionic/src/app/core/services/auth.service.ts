import { inject, Injectable, signal, computed, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  Auth, user, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword,
  sendPasswordResetEmail, confirmPasswordReset,
  verifyPasswordResetCode, ActionCodeSettings
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { Platform } from '@ionic/angular/standalone';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private platform = inject(Platform);
  private injector = inject(EnvironmentInjector);

  // --- SIGNALS DE ESTADO ---
  private _userData = signal<any>(null); // Ya no cargamos de LocalStorage al inicio
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

  constructor() {
    console.log('[AUTH] Inicializado');
    
    // Auto-sincronización al detectar usuario de Firebase (Persistencia)
    this.user$.subscribe(async (fbUser) => {
      if (fbUser) {
        console.log('[AUTH] Usuario detectado, sincronizando estado en memoria...');
        try {
          await this.syncUserWithBackend();
        } catch (err) {
          console.error('[AUTH] Error en auto-sincronización:', err);
        }
      }
    });
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
    localStorage.clear();
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

  private platformService = inject(PlatformService);

  private syncPromise: Promise<void> | null = null;

  /**
   * Sincroniza el usuario de Firebase con el backend seleccionado (Node/Java) para obtener el JWT
   */
  async syncUserWithBackend() {
    if (this.syncPromise) {
      console.log('[AUTH] Sincronización ya en curso. Reutilizando promesa existente...');
      return this.syncPromise;
    }

    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return;

    this.syncPromise = (async () => {
      try {
        const idToken = await firebaseUser.getIdToken();
        
        // Decidimos el backend dinámicamente
        const baseUrl = this.platformService.getUseJavaBackend() 
          ? environment.javaApiUrl 
          : environment.nodeApiUrl;
          
        const fullUrl = `${baseUrl}/auth/signin`;
        
        console.log(`[AUTH] Sincronizando con backend: ${this.platformService.getUseJavaBackend() ? 'JAVA' : 'NODE'}`);
        
        const response: any = await firstValueFrom(
          this.http.post(fullUrl, { idToken })
        );

        if (response && response.data && response.data.token) {
          // SOLO PERSISTIMOS EL JWT
          localStorage.setItem('jwt_token', response.data.token);
          
          // EL OBJETO DE USUARIO SOLO QUEDA EN EL SIGNAL (MEMORIA)
          this._userData.set(response.data.user);

          console.log('[AUTH] Sincronización exitosa. Token guardado, datos en memoria.');
        }
      } catch (error) {
        console.error('Error al sincronizar con el backend:', error);
        throw error;
      }
    })();

    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  /**
   * Envía un correo para restablecer la contraseña con soporte para Deep Links
   */
  async sendResetPasswordEmail(email: string) {
    const actionCodeSettings: ActionCodeSettings = {
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
   * Obtiene el ID único del usuario actual.
   * Intenta primero desde Firebase, luego desde los datos en memoria, y finalmente desde el JWT.
   */
  getUID(): string | undefined {
    // 1. Intentar desde Firebase Auth
    const fbUid = this.auth.currentUser?.uid;
    if (fbUid) return fbUid;

    // 2. Intentar desde los datos de usuario en memoria (signal)
    const userData = this.userData();
    if (userData && (userData.uid || userData.id || userData.firebaseUid)) {
      return userData.uid || userData.id || userData.firebaseUid;
    }

    // 3. Fallback: Decodificar el JWT guardado
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = JSON.parse(atob(payloadBase64));
        return payloadJson.id || payloadJson.uid || payloadJson.user_id || payloadJson.sub;
      } catch (e) {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Obtiene los datos del usuario (Solo si están en memoria)
   */
  getUserData() {
    return this.userData();
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

  /**
   * Lee los Términos y Condiciones desde Firestore
   */
  async getTermsAndConditions() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const termsDocRef = doc(this.firestore, 'app_config', 'terms');
        const termsDoc = await getDoc(termsDocRef);
        if (termsDoc.exists()) {
          return termsDoc.data();
        }
        return null;
      } catch (error: any) {
        console.error('[AUTH] Error al leer Términos y Condiciones:', error);
        return null;
      }
    });
  }
}

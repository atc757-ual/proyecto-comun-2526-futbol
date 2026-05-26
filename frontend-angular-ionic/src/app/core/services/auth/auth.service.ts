import { inject, Injectable, signal, computed } from '@angular/core';
import {
  Auth, user, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword,
  sendPasswordResetEmail, confirmPasswordReset,
  verifyPasswordResetCode, ActionCodeSettings
} from '@angular/fire/auth';
import { getApp } from 'firebase/app';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlatformService } from '../system/platform.service';
import { LoggerService } from '../system/logger.service';
import { PreferencesPlugin } from '../../plugins/preferences-plugin';

export interface UserData {
  name: string;
  email: string;
  id?: number | string;
  _id?: string;          // MongoDB ObjectId (Node backend)
  uid?: string;          // Firebase UID
  firebaseUid?: string;
  is_active?: boolean;
  role?: string;
}

interface AuthSyncResponse {
  data: {
    token: string;
    user: UserData;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth              = inject(Auth);
  private http              = inject(HttpClient);
  private preferencesPlugin = inject(PreferencesPlugin);
  private logger            = inject(LoggerService);

  // --- SIGNALS DE ESTADO ---
  private _userData = signal<UserData | null>(null);
  public userData = this._userData.asReadonly();

  // Signal computado para obtener solo el primer nombre
  public firstName = computed(() => {
    const user = this.userData();
    if (!user || !user.name) return '';
    const first = user.name.split(' ')[0].toLowerCase();
    return first.charAt(0).toUpperCase() + first.slice(1);
  });

  // Estado reactivo del usuario (Depende de Firebase Y del Token del backend activo: Node.js o Java)
  public user$ = user(this.auth);
  public currentUser = toSignal(this.user$);
  public isLoggedIn$ = this.user$.pipe(
    map(user => !!user && !!localStorage.getItem('jwt_token'))
  );

  constructor() {
    this.loadPersistedData();

    // Auto-sincronización al detectar usuario de Firebase (Persistencia)
    this.user$.pipe(takeUntilDestroyed()).subscribe(async (fbUser) => {
      if (fbUser) {
        this.logger.log('[AUTH] Usuario detectado, sincronizando estado en memoria...');
        try {
          await this.syncUserWithBackend();
        } catch (err) {
          this.logger.error('[AUTH] Error en auto-sincronización', err);
        }
      }
    });
  }

  /**
   * Carga los datos guardados en Preferences de forma asíncrona
   */
  private async loadPersistedData() {
    try {
      const savedUserStr = await this.preferencesPlugin.get('user_data');
      if (savedUserStr) {
        this._userData.set(JSON.parse(savedUserStr));
        this.logger.log('[AUTH] Perfil del usuario cargado desde Preferences con éxito.');
      }

      const token = await this.preferencesPlugin.get('jwt_token');
      if (token && !localStorage.getItem('jwt_token')) {
        localStorage.setItem('jwt_token', token);
        this.logger.log('[AUTH] Token JWT restaurado en LocalStorage desde Preferences.');
      }
    } catch (e) {
      this.logger.warn('[AUTH] Error al cargar persistencia de Preferences', e);
    }
  }

  /**
   * Inicia sesión con email y contraseña y sincroniza con el backend activo (Node.js o Java)
   */
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    this.logger.log('[AUTH] Login Firebase exitoso. Validando verificación de correo...');
    
    // Verifico si el correo electrónico ha sido validado antes de autorizar el ingreso
    if (userCredential.user && !userCredential.user.emailVerified) {
      await signOut(this.auth);
      throw { code: 'auth/email-not-verified', message: 'Debes verificar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.' };
    }

    await this.syncUserWithBackend();

    // Verifico si el usuario ha sido inhabilitado administrativamente en el backend
    const userData = this.userData();
    if (userData && userData.is_active === false) {
      await this.logout();
      throw { code: 'auth/user-disabled', message: 'Tu cuenta ha sido inhabilitada. Por favor, ponte en contacto con el administrador.' };
    }

    return userCredential;
  }

  /**
   * Cierra la sesión activa
   */
  async logout() {
    localStorage.clear();
    await this.preferencesPlugin.clear();
    this._userData.set(null);
    return signOut(this.auth);
  }

  /**
   * Registra un nuevo usuario, envía el correo de verificación de cuenta y guarda su nombre en Firebase
   */
  async register(email: string, password: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    // Guardo el nombre en Firebase y envío correo de verificación
    if (userCredential.user) {
      const { updateProfile, sendEmailVerification } = await import('@angular/fire/auth');
      await updateProfile(userCredential.user, { displayName: name });
      
      // Envío el correo de verificación nativo de Firebase
      await sendEmailVerification(userCredential.user);
      this.logger.log('[AUTH] Correo de verificación enviado con éxito.');
      
      // Cierro la sesión inmediata para impedir el acceso sin verificar
      await signOut(this.auth);
    }

    return userCredential;
  }

  private platformService = inject(PlatformService);

  private syncPromise: Promise<void> | null = null;

  /**
   * Sincroniza el usuario de Firebase con el backend seleccionado (Node/Java) para obtener el JWT
   */
  async syncUserWithBackend(targetBackend?: boolean, forceRefresh: boolean = false) {
    if (this.syncPromise) {
      this.logger.log('[AUTH] Sincronización ya en curso. Reutilizando promesa existente...');
      return this.syncPromise;
    }

    // Esperar a que el estado de autenticación inicial de Firebase esté completamente cargado/restaurado
    await this.auth.authStateReady();

    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return;

    this.syncPromise = (async () => {
      try {
        // Decidimos el backend dinámicamente o por targetBackend si se proporciona
        const useJava = targetBackend !== undefined 
          ? targetBackend 
          : this.platformService.getUseJavaBackend();

        const shouldForceRefresh = forceRefresh || targetBackend !== undefined;
        const idToken = await firebaseUser.getIdToken(shouldForceRefresh);

        const baseUrl = useJava 
          ? environment.javaApiUrl 
          : environment.nodeApiUrl;
          
        const fullUrl = `${baseUrl}/auth/signin`;
        
        this.logger.log(`[AUTH] Sincronizando con backend: ${useJava ? 'JAVA' : 'NODE'}`);
        
        const response = await firstValueFrom(
          this.http.post<AuthSyncResponse>(fullUrl, { idToken })
        );

        if (response?.data?.token) {
          localStorage.setItem('jwt_token', response.data.token);
          await this.preferencesPlugin.set('jwt_token', response.data.token);

          const persistentUser: Pick<UserData, 'name' | 'email'> = {
            name: response.data.user.name || '',
            email: response.data.user.email || ''
          };
          await this.preferencesPlugin.set('user_data', JSON.stringify(persistentUser));

          this._userData.set(response.data.user);
          this.logger.log('[AUTH] Sincronización exitosa. Token y perfil guardados de forma segura.');
        }
      } catch (error) {
        this.logger.error('[AUTH] Error al sincronizar con el backend', error);
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
    const useJava = this.platformService.getUseJavaBackend();

    if (useJava) {
      // Para el backend de Java, priorizamos el ID numérico interno
      const userData = this.userData();
      if (userData && userData.id !== undefined && userData.id !== null) {
        return String(userData.id);
      }
      
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1];
          const payloadJson = JSON.parse(atob(payloadBase64));
          const id = payloadJson.id || payloadJson.user_id || payloadJson.sub;
          if (id !== undefined && id !== null) {
            return String(id);
          }
        } catch (e) {
          // Silencioso
        }
      }
    }

    // Para el backend de Node o fallback general
    // 1. Intentar desde Firebase Auth
    const fbUid = this.auth.currentUser?.uid;
    if (fbUid) return fbUid;

    // 2. Intentar desde los datos de usuario en memoria (signal)
    const userData = this.userData();
    if (userData && (userData.uid || userData.id || userData.firebaseUid)) {
      const val = userData.uid || userData.id || userData.firebaseUid;
      return val ? String(val) : undefined;
    }

    // 3. Fallback: Decodificar el JWT guardado
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = JSON.parse(atob(payloadBase64));
        const val = payloadJson.id || payloadJson.uid || payloadJson.user_id || payloadJson.sub;
        return val ? String(val) : undefined;
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

      // Ajusta 'admin' según el valor exacto que envíe el backend activo (Node.js o Java)
      return payloadJson && (payloadJson.role === 'admin' || payloadJson.role === 'ADMIN' || payloadJson.role === 'Admin');
    } catch (e) {
      this.logger.error('[AUTH] Error al decodificar el token para isAdmin', e);
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
    const useJava = this.platformService.getUseJavaBackend();
    const baseUrl = useJava ? environment.javaApiUrl : environment.nodeApiUrl;
    const fullUrl = `${baseUrl}/auth/make-admin`;
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
    const useJava = this.platformService.getUseJavaBackend();
    const baseUrl = useJava ? environment.javaApiUrl : environment.nodeApiUrl;
    const fullUrl = `${baseUrl}/auth/remove-admin`;
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
    const useJava = this.platformService.getUseJavaBackend();
    const baseUrl = useJava ? environment.javaApiUrl : environment.nodeApiUrl;
    const fullUrl = `${baseUrl}/auth/users?email=${email}`;
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
    const useJava = this.platformService.getUseJavaBackend();
    const baseUrl = useJava ? environment.javaApiUrl : environment.nodeApiUrl;
    const fullUrl = `${baseUrl}/auth/toggle-status`;
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
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const firestore = getFirestore(getApp());
      const termsDocRef = doc(firestore, 'app_config', 'terms');
      const termsDoc = await getDoc(termsDocRef);

      if (termsDoc.exists()) {
        return termsDoc.data();
      }

      return null;
    } catch (error) {
      this.logger.error('[AUTH] Error al leer Términos y Condiciones', error);
      return null;
    }
  }
}

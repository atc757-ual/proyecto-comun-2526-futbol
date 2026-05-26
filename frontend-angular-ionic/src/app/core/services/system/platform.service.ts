import { Injectable, inject, OnDestroy, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio del sistema encargado de detectar la plataforma/dispositivo y
 * de gestionar de manera dinámica la selección de backend activo (Java vs Node.js).
 */
@Injectable({
  providedIn: 'root'
})
export class PlatformService implements OnDestroy {
  private platform = inject(Platform);
  private ngZone   = inject(NgZone);

  // Referencia guardada para poder remover el listener con exactamente la misma función
  private readonly resizeListener = () => this.ngZone.run(() => this.updatePlatformInfo());

  // === CONSTRUCTOR E INICIALIZACIÓN

  constructor() {
    this.updatePlatformInfo();
    // Re-evalúa después de que Ionic Platform esté completamente lista (edge case de init)
    this.platform.ready().then(() => this.updatePlatformInfo());
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  // Emiten el estado actual del dispositivo (Desktop, Native App o Mobile Web)
  private isDesktopSub = new BehaviorSubject<boolean>(window.innerWidth >= 768);
  private isMobileAppSub = new BehaviorSubject<boolean>(false);
  private isWebMobileSub = new BehaviorSubject<boolean>(false);

  // Observables públicos para suscripción reactiva en componentes
  isDesktop$ = this.isDesktopSub.asObservable();
  isMobileApp$ = this.isMobileAppSub.asObservable();
  isWebMobile$ = this.isWebMobileSub.asObservable();


  // Mantiene el estado reactivo del backend que se debe utilizar
  private useJavaBackendSub = new BehaviorSubject<boolean>(this.getInitialBackend());
  useJavaBackend$ = this.useJavaBackendSub.asObservable();

  /**
   * Evalúa y actualiza las propiedades del dispositivo y tamaño de pantalla.
   */
  private updatePlatformInfo() {
    const width = window.innerWidth;
    const desktop = width >= 768;

    // DETECCIÓN REAL: Determina si se está ejecutando dentro de un contenedor nativo (Capacitor/Cordova)
    const mobileApp = this.platform.is('capacitor') || this.platform.is('cordova');

    // MODO WEB MOBILE: Navegador móvil fuera de la app híbrida instalable
    const webMobile = !desktop && !mobileApp;

    this.isDesktopSub.next(desktop);
    this.isMobileAppSub.next(mobileApp);
    this.isWebMobileSub.next(webMobile);
  }

  // Getters síncronos y directos para consultas puntuales en TypeScript
  get isDesktop(): boolean { return this.isDesktopSub.value; }
  get isMobileApp(): boolean { return this.isMobileAppSub.value; }
  get isWebMobile(): boolean { return this.isWebMobileSub.value; }

  /**
   * Obtiene la preferencia de backend guardada en la caché local al arrancar la app.
   */
  private getInitialBackend(): boolean {
    const val = localStorage.getItem('use_java_backend');
    if (val === null) return false; // Por defecto usamos Node.js
    return val === 'true';
  }

  /**
   * Devuelve de forma síncrona si está activo el backend de Java.
   */
  getUseJavaBackend(): boolean {
    return this.useJavaBackendSub.value;
  }

  /**
   * Cambia la preferencia de backend de forma permanente y la notifica a toda la app.
   */
  setUseJavaBackend(value: boolean) {
    localStorage.setItem('use_java_backend', value.toString());
    this.useJavaBackendSub.next(value);
  }

  /**
   * Alterna dinámicamente entre el backend de Java y el de Node.js.
   */
  toggleBackend() {
    this.setUseJavaBackend(!this.getUseJavaBackend());
  }
}

import { Injectable, inject, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private platform = inject(Platform);

  // BehaviorSubjects para que los componentes puedan reaccionar a cambios (ej. redimensión)
  private isDesktopSub = new BehaviorSubject<boolean>(window.innerWidth >= 768);
  private isMobileAppSub = new BehaviorSubject<boolean>(false);
  private isWebMobileSub = new BehaviorSubject<boolean>(false);

  // Observables públicos
  isDesktop$ = this.isDesktopSub.asObservable();
  isMobileApp$ = this.isMobileAppSub.asObservable();
  isWebMobile$ = this.isWebMobileSub.asObservable();

  constructor() {
    this.updatePlatformInfo();
    // Escuchar redimensión de ventana
    window.addEventListener('resize', () => this.updatePlatformInfo());
  }

  private updatePlatformInfo() {
    const width = window.innerWidth;
    const desktop = width >= 768;
    
    // DETECCIÓN REAL
    const mobileApp = this.platform.is('capacitor') || this.platform.is('cordova');
    
    // MODO REAL ACTIVADO
    const webMobile = !desktop && !mobileApp;

    this.isDesktopSub.next(desktop);
    this.isMobileAppSub.next(mobileApp);
    this.isWebMobileSub.next(webMobile);
  }

  // Getters síncronos por si no quieres usar observables
  get isDesktop(): boolean { return this.isDesktopSub.value; }
  get isMobileApp(): boolean { return this.isMobileAppSub.value; }
  get isWebMobile(): boolean { return this.isWebMobileSub.value; }
}

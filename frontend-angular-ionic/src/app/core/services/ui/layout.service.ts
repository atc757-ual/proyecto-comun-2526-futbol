import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

/**
 * Servicio encargado de gestionar el estado dinámico de la interfaz de usuario (UI),
 * incluyendo títulos, breadcrumbs, overlays de carga de IA y configuraciones de layouts.
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  // --- Estados de MainLayout ---
  private _title = signal<string>('');
  private _subtitle = signal<string>('');
  private _showHero = signal<boolean>(false);
  private _isHome = signal<boolean>(false);
  private _breadcrumbs = signal<BreadcrumbItem[]>([]);

  title = this._title.asReadonly();
  subtitle = this._subtitle.asReadonly();
  showHero = this._showHero.asReadonly();
  isHome = this._isHome.asReadonly();
  breadcrumbs = this._breadcrumbs.asReadonly();

  // --- Estados de AuthLayout ---
  private _authTitle = signal<string>('');
  private _authSubtitle = signal<string>('');
  private _isLogin = signal<boolean>(false);

  authTitle = this._authTitle.asReadonly();
  authSubtitle = this._authSubtitle.asReadonly();
  isLogin = this._isLogin.asReadonly();

  // --- Estados de Cargador Global de IA ---
  private _aiLoading = signal<boolean>(false);
  private _aiThinkingText = signal<string>('');

  aiLoading = this._aiLoading.asReadonly();
  aiThinkingText = this._aiThinkingText.asReadonly();

  // --- Métodos de Asistente de IA ---
  
  setAILoading(loading: boolean, text: string = '') {
    this._aiLoading.set(loading);
    this._aiThinkingText.set(text);
  }

  // --- Configuración de Encabezados ---

  /**
   * Actualiza la cabecera dinámica en el layout principal (MainLayout)
   */
  setHeader(config: { title?: string, subtitle?: string, showHero?: boolean, isHome?: boolean }) {
    if (config.title !== undefined) this._title.set(config.title);
    if (config.subtitle !== undefined) this._subtitle.set(config.subtitle);
    if (config.showHero !== undefined) this._showHero.set(config.showHero);
    if (config.isHome !== undefined) this._isHome.set(config.isHome);
  }

  /**
   * Actualiza el encabezado del layout de autenticación (AuthLayout)
   */
  setAuth(config: { title?: string, subtitle?: string, isLogin?: boolean }) {
    if (config.title !== undefined) this._authTitle.set(config.title);
    if (config.subtitle !== undefined) this._authSubtitle.set(config.subtitle);
    if (config.isLogin !== undefined) this._isLogin.set(config.isLogin);
  }

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this._breadcrumbs.set(items);
  }

  // --- Métodos de Limpieza ---

  /**
   * Restablece todos los estados del layout a sus valores por defecto
   */
  resetLayout() {
    this._title.set('');
    this._subtitle.set('');
    this._showHero.set(false);
    this._isHome.set(false);
    this._breadcrumbs.set([]);
    this._authTitle.set('');
    this._authSubtitle.set('');
    this._isLogin.set(false);
  }
}

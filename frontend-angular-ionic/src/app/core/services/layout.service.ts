import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Signals privados (Escritura interna)
  private _title = signal<string>('');
  private _subtitle = signal<string>('');
  private _showHero = signal<boolean>(false);
  private _isHome = signal<boolean>(false);
  private _breadcrumbs = signal<BreadcrumbItem[]>([]);

  // Signals públicos (Solo lectura para los componentes)
  title = this._title.asReadonly();
  subtitle = this._subtitle.asReadonly();
  showHero = this._showHero.asReadonly();
  isHome = this._isHome.asReadonly();
  breadcrumbs = this._breadcrumbs.asReadonly();

  // Signals para AuthLayout privados
  private _authTitle = signal<string>('');
  private _authSubtitle = signal<string>('');
  private _isLogin = signal<boolean>(false);

  // Signals para AuthLayout públicos
  authTitle = this._authTitle.asReadonly();
  authSubtitle = this._authSubtitle.asReadonly();
  isLogin = this._isLogin.asReadonly();

  /**
   * Configura el Header de MainLayout
   */
  setHeader(config: { title?: string, subtitle?: string, showHero?: boolean, isHome?: boolean }) {
    if (config.title !== undefined) this._title.set(config.title);
    if (config.subtitle !== undefined) this._subtitle.set(config.subtitle);
    if (config.showHero !== undefined) this._showHero.set(config.showHero);
    if (config.isHome !== undefined) this._isHome.set(config.isHome);
  }

  /**
   * Configura el AuthLayout
   */
  setAuth(config: { title?: string, subtitle?: string, isLogin?: boolean }) {
    if (config.title !== undefined) this._authTitle.set(config.title);
    if (config.subtitle !== undefined) this._authSubtitle.set(config.subtitle);
    if (config.isLogin !== undefined) this._isLogin.set(config.isLogin);
  }

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this._breadcrumbs.set(items);
  }

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

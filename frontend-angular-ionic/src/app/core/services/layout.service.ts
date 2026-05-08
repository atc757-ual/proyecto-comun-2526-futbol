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
  // Signals para MainLayout
  title = signal<string>('');
  subtitle = signal<string>('');
  showHero = signal<boolean>(false);
  isHome = signal<boolean>(false);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  // Signals para AuthLayout
  authTitle = signal<string>('');
  authSubtitle = signal<string>('');
  isLogin = signal<boolean>(false);

  /**
   * Configura el Header de MainLayout
   */
  setHeader(config: { title?: string, subtitle?: string, showHero?: boolean, isHome?: boolean }) {
    if (config.title !== undefined) this.title.set(config.title);
    if (config.subtitle !== undefined) this.subtitle.set(config.subtitle);
    if (config.showHero !== undefined) this.showHero.set(config.showHero);
    if (config.isHome !== undefined) this.isHome.set(config.isHome);
  }

  /**
   * Configura el AuthLayout
   */
  setAuth(config: { title?: string, subtitle?: string, isLogin?: boolean }) {
    if (config.title !== undefined) this.authTitle.set(config.title);
    if (config.subtitle !== undefined) this.authSubtitle.set(config.subtitle);
    if (config.isLogin !== undefined) this.isLogin.set(config.isLogin);
  }

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.breadcrumbs.set(items);
  }

  resetLayout() {
    this.title.set('');
    this.subtitle.set('');
    this.showHero.set(false);
    this.isHome.set(false);
    this.breadcrumbs.set([]);
    this.authTitle.set('');
    this.authSubtitle.set('');
    this.isLogin.set(false);
  }
}

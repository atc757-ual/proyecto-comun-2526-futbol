import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

export interface AppPage {
  tab: string;
  title: string;
  url: string;
  icon: string;
}

export const APP_PAGES: AppPage[] = [
  { tab: 'home',    title: 'Inicio',       url: '/home',    icon: 'home-outline'      },
  { tab: 'players', title: 'Mi plantilla', url: '/players', icon: 'football-outline'  },
  { tab: 'ai-team', title: 'Fútbol AI',    url: '/ai-team', icon: 'sparkles-outline'  },
  { tab: 'busqueda',title: 'Búsqueda',     url: '/busqueda',icon: 'search-outline'    },
  { tab: 'news',    title: 'Noticias',     url: '/news',    icon: 'newspaper-outline' }
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly pages = APP_PAGES;

  private router   = inject(Router);
  private location = inject(Location);

  isTabActive(tabUrl: string): boolean {
    const currentUrl = (this.router.url || '').toLowerCase();
    const targetUrl  = (tabUrl || '').toLowerCase();
    if (!targetUrl)               return false;
    if (targetUrl === '/home')    return currentUrl === '/home';
    if (targetUrl === '/players') return currentUrl.includes('player') && !currentUrl.includes('public');
    if (targetUrl === '/news')    return currentUrl.includes('new');
    if (targetUrl === '/ai-team') return currentUrl.includes('ai-team');
    if (targetUrl === '/busqueda')return currentUrl.includes('busqueda');
    return currentUrl.includes(targetUrl);
  }

  isCurrentHome(): boolean {
    const url = (this.router.url || '').split('?')[0].split('#')[0].toLowerCase();
    return url === '/home';
  }

  goBack(fallback = '/home'): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([fallback]);
    }
  }
}

import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonFooter, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-layout-tabs',
  templateUrl: './layout-tabs.component.html',
  styleUrls: ['./layout-tabs.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonFooter, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class LayoutTabsComponent {
  private router = inject(Router);

  @Input() appPages: any[] = [];

  constructor() {
    addIcons({ homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline });
  }

  isTabActive(tabUrl: string): boolean {
    const currentUrl = (this.router.url || '').toLowerCase();
    const targetUrl = (tabUrl || '').toLowerCase();

    if (targetUrl === '/players') {
      return currentUrl.includes('player') && !currentUrl.includes('public');
    }
    if (targetUrl === '/news') {
      return currentUrl.includes('new');
    }
    if (targetUrl === '/ai-team') {
      return currentUrl.includes('ai-team');
    }
    if (targetUrl === '/busqueda') {
      return currentUrl.includes('busqueda');
    }
    return currentUrl.includes(targetUrl);
  }
}

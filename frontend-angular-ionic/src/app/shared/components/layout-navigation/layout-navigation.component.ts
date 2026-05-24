import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonMenuToggle, IonButton, IonIcon, IonMenu, IonContent, IonItem, IonLabel } from '@ionic/angular/standalone';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { addIcons } from 'ionicons';
import { menuOutline, personCircleOutline, logOutOutline, football, closeOutline, homeOutline, newspaperOutline, footballOutline, sparklesOutline, personOutline, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-layout-navigation',
  templateUrl: './layout-navigation.component.html',
  styleUrls: ['./layout-navigation.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonMenuToggle, IonButton, IonIcon, IonMenu, IonContent, IonItem, IonLabel]
})
export class LayoutNavigationComponent {
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  private router = inject(Router);

  @Output() logoutAction = new EventEmitter<void>();

  @Input() appPages: any[] = [];

  constructor() {
    addIcons({ menuOutline, personCircleOutline, logOutOutline, football, closeOutline, homeOutline, newspaperOutline, footballOutline, sparklesOutline, personOutline, arrowBack });
  }

  get isRootPage(): boolean {
    const url = (this.router.url || '').split('?')[0];
    const rootPaths = ['/home', '/players', '/ai-team', '/busqueda', '/news', '/profile', '/admin-security', '/manage-news'];
    return rootPaths.includes(url) || url === '/';
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

  logout() {
    this.logoutAction.emit();
  }
}

import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonBreadcrumbs, IonBreadcrumb, IonIcon, NavController } from '@ionic/angular/standalone';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-page-full-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonBreadcrumbs, IonBreadcrumb, IonIcon],
  templateUrl: './page-full-content.component.html',
  styleUrls: ['./page-full-content.component.scss']
})
export class PageFullContentComponent {
  @Input() pageTitle: string = '';
  @Input() pageSubtitle: string = '';
  @Input() breadcrumbs: any[] = [];

  public platformService = inject(PlatformService);
  public authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);

  onBreadcrumbClick(event: Event, item: any) {
    // Evitar que el breadcrumb retenga el foco al cambiar de página
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (item.url === '/login' || (item.url === '/home' && !this.authService.currentUser())) {
      event.preventDefault();
      event.stopPropagation();
      this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'back' });
    }
  }
}

import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonRouterOutlet, MenuController } from '@ionic/angular/standalone';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService }   from 'src/app/core/services/ui/layout.service';
import { PageNavigationComponent } from '../layout-elements/page-navigation/page-navigation.component';
import { PageTabsComponent }       from '../layout-elements/page-tabs/page-tabs.component';
import { PageHeaderComponent }     from '../layout-elements/page-header/page-header.component';

@Component({
  selector: 'app-layout-main',
  templateUrl: './layout-main.component.html',
  styleUrls: ['./layout-main.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, IonRouterOutlet,
    PageNavigationComponent, PageTabsComponent, PageHeaderComponent
  ]
})
export class LayoutMainComponent implements OnDestroy {
  private router          = inject(Router);
  public  platformService = inject(PlatformService);
  public  layoutService   = inject(LayoutService);
  private menuCtrl        = inject(MenuController);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      const el = document.querySelector('#mobile-main-content ion-content, .main-main-bg') as HTMLElement & { scrollToTop?: (duration: number) => void };
      if (el?.scrollToTop) {
        el.scrollToTop(300);
      } else {
        window.scrollTo(0, 0);
      }
    });
  }

  ngOnDestroy() {
    this.menuCtrl.enable(false);
    this.menuCtrl.close();
  }
}

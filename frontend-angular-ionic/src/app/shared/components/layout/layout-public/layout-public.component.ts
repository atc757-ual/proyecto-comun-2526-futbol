import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MenuController, NavController, ModalController,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline
} from 'ionicons/icons';
import { PlatformService }  from 'src/app/core/services/system/platform.service';
import { NavigationService }from 'src/app/core/services/ui/navigation.service';
import { PageHeaderComponent } from '../layout-elements/page-header/page-header.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { PageTabsComponent } from '../layout-elements/page-tabs/page-tabs.component';

@Component({
  selector: 'app-layout-public',
  templateUrl: './layout-public.component.html',
  styleUrls: ['./layout-public.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, 
    IonRouterOutlet, PageHeaderComponent,
    PageTabsComponent
  ]
})
export class LayoutPublicComponent implements OnInit, OnDestroy {
  public  platformService = inject(PlatformService);
  public  navService      = inject(NavigationService);
  private menuCtrl        = inject(MenuController);
  private navCtrl         = inject(NavController);
  private modalCtrl       = inject(ModalController);
  private router          = inject(Router);

  constructor() {
    addIcons({ homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      const el = document.querySelector(
        '#mobile-public-content ion-content, #public-content .main-main-bg'
      ) as HTMLElement & { scrollToTop?: (duration: number) => void };
      if (el && typeof el.scrollToTop === 'function') {
        el.scrollToTop(300);
      } else {
        window.scrollTo(0, 0);
      }
    });
  }

  ngOnInit() {
    this.menuCtrl.enable(false);
  }

  ngOnDestroy() {
    this.menuCtrl.enable(true);
  }

  async onTabClick(event: Event, _route: string | null, _index: number): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      cssClass: 'premium-modal',
      componentProps: { mode: 'join' }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data === true) {
      await this.navCtrl.navigateRoot('/auth/register', { animated: false });
    }
  }
}

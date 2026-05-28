import { mount } from 'cypress/angular';
import { NewsDetailPage } from './news-detail.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { NavController, IonicModule, ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/system/storage.service';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

describe('NewsDetailPage Component', () => {
  it('mounts and displays 404 when no news found', () => {
    mount(NewsDetailPage, {
      imports: [IonicModule.forRoot(), NewsDetailPage],
      providers: [
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getNewsById: () => of(null),
            getFeatured: () => of([])
          }
        },
        {
          provide: AuthService,
          useValue: { isAdmin: () => false }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: PlatformService, useValue: { isDesktop: true } },
        { provide: ToastService, useValue: { showError: () => {}, showWarning: () => {} } },
        { provide: NavController, useValue: { navigateBack: () => {} } },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ModalController, useValue: { create: () => Promise.resolve() } },
        { provide: StorageService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '999' } } } }
      ],
      componentProperties: {
        id: '999'
      }
    });

    cy.contains('404').should('be.visible');
    cy.contains('No se ha encontrado la noticia').should('be.visible');
  });
});

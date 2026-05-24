import { mount } from 'cypress/angular';
import { NewsPage } from './news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { NavController, IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('NewsPage Component', () => {
  it('mounts', () => {
    mount(NewsPage, {
      imports: [IonicModule.forRoot(), NewsPage],
      providers: [
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getFeed: () => of([]),
            getFeatured: () => of([])
          }
        },
        {
          provide: AuthService,
          useValue: { isAdmin: () => true, currentUser: () => null, userData: () => null, firstName: () => '' }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: PlatformService, useValue: { isDesktop: true } },
        { provide: ToastService, useValue: { showError: () => {} } },
        { provide: NavController, useValue: { navigateForward: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    });

    cy.get('.empty-container').should('exist');
    cy.contains('No hay noticias todavía').should('exist');
  });

  it('renders admin card when user is admin', () => {
    mount(NewsPage, {
      imports: [IonicModule.forRoot(), NewsPage],
      providers: [
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getFeed: () => of([]),
            getFeatured: () => of([])
          }
        },
        {
          provide: AuthService,
          useValue: { isAdmin: () => true, currentUser: () => null, userData: () => null, firstName: () => '' }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: PlatformService, useValue: { isDesktop: true } },
        { provide: ToastService, useValue: { showError: () => {} } },
        { provide: NavController, useValue: { navigateForward: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    });

    cy.contains('Administrador').should('be.visible');
    cy.contains('Crear noticia').should('be.visible');
  });
});

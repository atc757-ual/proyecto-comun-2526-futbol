import { mount } from 'cypress/angular';
import { ManageNewsPage } from './manage-news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { IonicModule } from '@ionic/angular';
import { NavController, ModalController } from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/system/storage.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ManageNewsPage Component', () => {
  it('mounts and renders empty state if no news', () => {
    mount(ManageNewsPage, {
      imports: [IonicModule.forRoot(), ManageNewsPage],
      providers: [
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getNews: () => of([]),
            deleteNews: () => of({})
          }
        },
        {
          provide: AuthService,
          useValue: { isAdmin: () => true }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: { showError: () => {}, showSuccess: () => {} } },
        { provide: NavController, useValue: { navigateForward: () => {}, back: () => {} } },
        {
          provide: ModalController,
          useValue: {
            create: () => Promise.resolve({
              present: () => Promise.resolve(),
              onWillDismiss: () => Promise.resolve({ data: true })
            })
          }
        },
        { provide: StorageService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    }).then(({ component, fixture }) => {
      component.isAdmin = true;
      component.news = [];
      component.filteredNews = [];
      component.isLoading = false;
      component.applyFilter();
      fixture.detectChanges();
    });

    cy.contains('Aún no hay noticias').should('be.visible');
    cy.contains('Administrador').should('be.visible');
  });
});

import { mount } from 'cypress/angular';
import { ManageNewsPage } from './manage-news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { NavController, IonicModule, ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/system/storage.service';
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
        { provide: ToastService, useValue: {} },
        { provide: NavController, useValue: {} },
        { provide: ModalController, useValue: {} },
        { provide: StorageService, useValue: {} }
      ]
    });

    cy.get('.empty-state').should('be.visible');
    cy.contains('Aún no hay noticias').should('be.visible');
  });
});

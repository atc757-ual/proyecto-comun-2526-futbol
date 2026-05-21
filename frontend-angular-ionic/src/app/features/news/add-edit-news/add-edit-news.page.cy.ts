import { mount } from 'cypress/angular';
import { AddEditNewsPage } from './add-edit-news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { NavController, IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AddEditNewsPage Component', () => {
  it('mounts and displays create form', () => {
    mount(AddEditNewsPage, {
      imports: [IonicModule.forRoot(), AddEditNewsPage],
      providers: [
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getNewsById: () => of(null),
            saveNews: () => of({})
          }
        },
        {
          provide: AuthService,
          useValue: { getUserData: () => ({ name: 'Test User' }) }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: PlatformService, useValue: { isDesktop: true } },
        { provide: ToastService, useValue: {} },
        { provide: NavController, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } } // simulate create mode
      ]
    });

    cy.contains('Formulario de Noticia').should('be.visible');
    cy.get('ion-button').contains('Publicar Noticia').should('be.visible');
  });
});

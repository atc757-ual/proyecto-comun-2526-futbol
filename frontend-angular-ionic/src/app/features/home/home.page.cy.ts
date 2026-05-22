import { mount } from 'cypress/angular';
import { HomePage } from './home.page';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { NEWS_SERVICE_TOKEN } from 'src/app/core/services/news/news.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { ModalController as StandaloneModalController } from '@ionic/angular/standalone';

describe('HomePage Component', () => {
  it('mounts and renders correctly', () => {
    const modalMock = {
      create: cy.stub().resolves({
        present: cy.stub().resolves(),
        onWillDismiss: cy.stub().resolves({ data: false })
      })
    };

    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'permissions', {
        configurable: true,
        value: {
          query: cy.stub().resolves({ state: 'granted' })
        }
      });
    });

    mount(HomePage, {
      imports: [IonicModule.forRoot(), HomePage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            getTSDBTVBySport: () => of([]),
            getTSDBLiveScores: () => of([]),
            getPlayers: () => of([]),
            getTVByCountry: () => of([])
          }
        },
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: { getFeatured: () => of([]) }
        },
        {
          provide: AuthService,
          useValue: { firstName: () => 'TestUser', isAdmin: () => false, logout: () => Promise.resolve() }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: {} },
        { provide: Auth, useValue: {} },
        { provide: ModalController, useValue: modalMock },
        { provide: StandaloneModalController, useValue: modalMock }
      ]
    });

    cy.get('.ai-scout-card').should('exist');
    cy.contains('Necesitas más jugadores').should('exist');
  });
});

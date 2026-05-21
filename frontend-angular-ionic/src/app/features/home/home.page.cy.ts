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

describe('HomePage Component', () => {
  it('mounts and renders correctly', () => {
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
        { provide: Auth, useValue: {} }
      ]
    });

    cy.get('app-home').should('exist');
    cy.contains('¡Hola, TestUser!').should('exist');
  });
});

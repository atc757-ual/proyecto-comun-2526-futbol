import { mount } from 'cypress/angular';
import { PlayersAllPage } from './players-all.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PlayersAllPage Component', () => {
  it('mounts and renders list', () => {
    mount(PlayersAllPage, {
      imports: [IonicModule.forRoot(), PlayersAllPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: { getPlayers: () => of([]) } },
        { provide: AuthService, useValue: { isAdmin: () => false, getUserId: () => '123' } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    cy.get('.search-container').should('exist');
  });
});

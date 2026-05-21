import { mount } from 'cypress/angular';
import { PlayerDetailPage } from './player-detail.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PlayerDetailPage Component', () => {
  it('mounts and renders detail view', () => {
    mount(PlayerDetailPage, {
      imports: [IonicModule.forRoot(), PlayerDetailPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: { getPlayerById: () => of(null) } },
        { provide: AuthService, useValue: { isAdmin: () => false } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: { showError: () => {} } },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    cy.get('.player-profile-header').should('exist');
  });
});

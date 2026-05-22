import { mount } from 'cypress/angular';
import { PlayersPage } from './players.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PlayersPage Component', () => {
  it('mounts and renders lists', () => {
    mount(PlayersPage, {
      imports: [IonicModule.forRoot(), PlayersPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: { getPlayers: () => of([]) } },
        { provide: AuthService, useValue: { isAdmin: () => false, getUserId: () => '123' } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } },
        {
          provide: ModalController,
          useValue: {
            create: () => Promise.resolve({
              present: () => Promise.resolve(),
              onWillDismiss: () => Promise.resolve({ data: true })
            })
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    cy.contains('Búsqueda personalizada').should('exist');
  });
});

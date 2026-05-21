import { mount } from 'cypress/angular';
import { BusquedaListPage } from './busqueda-list.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('BusquedaListPage Component', () => {
  it('mounts and displays search input', () => {
    mount(BusquedaListPage, {
      imports: [IonicModule.forRoot(), BusquedaListPage],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: { searchTSDBPlayers: () => of([]), searchTSDBTeams: () => of([]) }
        },
        { provide: ToastService, useValue: { showError: () => {} } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    cy.get('ion-searchbar').should('exist');
    cy.contains('Resultados').should('exist');
  });
});

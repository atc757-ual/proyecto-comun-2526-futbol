import { mount } from 'cypress/angular';
import { BusquedaListPage } from './busqueda-list.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { ConfettiService } from 'src/app/core/services/ui/confetti.service';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { MapPlugin } from 'src/app/core/plugins/maps-plugin';
import { ModalController } from '@ionic/angular/standalone';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('BusquedaListPage Component', () => {
  it('mounts and displays search input', () => {
    mount(BusquedaListPage, {
      imports: [IonicModule.forRoot(), BusquedaListPage, RouterTestingModule],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            searchTSDBPlayers: () => of([]),
            searchTSDBTeams: () => of([]),
            getPlayers: () => of([])
          }
        },
        { provide: AuthService, useValue: { isAdmin: () => false, currentUser: () => null, userData: () => null, firstName: () => '' } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: { showError: () => {}, showSuccess: () => {} } },
        { provide: ConfettiService, useValue: { celebrate: () => {} } },
        { provide: LocationPlugin, useValue: { isGeolocationPermissionGranted: () => Promise.resolve(false), requestGeolocationPermission: () => Promise.resolve(false) } },
        { provide: MapPlugin, useValue: { initMap: () => {}, addMarker: () => {}, destroyMap: () => {} } },
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

    cy.get('ion-searchbar').should('exist');
    cy.contains('Buscador de jugadores').should('exist');
  });
});

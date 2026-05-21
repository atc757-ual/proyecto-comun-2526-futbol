import { mount } from 'cypress/angular';
import { AddEditPlayerPage } from './add-edit-player.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AddEditPlayerPage Component', () => {
  it('mounts and displays form', () => {
    mount(AddEditPlayerPage, {
      imports: [IonicModule.forRoot(), AddEditPlayerPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: { getPlayerById: () => of(null), savePlayer: () => of({}) } },
        { provide: AuthService, useValue: { getUserData: () => ({ uid: '123' }) } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: {} },
        { provide: PlatformService, useValue: { isDesktop: true } },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: NavController, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    cy.get('form').should('exist');
    cy.contains('Añadir Jugador').should('exist');
  });
});

import { mount } from 'cypress/angular';
import { PlayerDetailPage } from './player-detail.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModalController, LoadingController, NavController, AlertController } from '@ionic/angular/standalone';
import { ConfettiService } from 'src/app/core/services/ui/confetti.service';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { MapPlugin } from 'src/app/core/plugins/maps-plugin';
import { ShareCardPlugin } from 'src/app/core/plugins/share-card-plugin';
import { HapticsPlugin } from 'src/app/core/plugins/haptics-plugin';

describe('PlayerDetailPage Component', () => {
  it('mounts and renders detail view', () => {
    const mockPlayer = {
      _id: '123',
      name: 'Leo Messi',
      team: 'Inter Miami',
      league: 'MLS',
      nationality: 'Argentina',
      position: 'Forward',
      user_id: 'user-1',
      isFavorite: false,
      comments: []
    };

    mount(PlayerDetailPage, {
      imports: [IonicModule.forRoot(), PlayerDetailPage],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            getPlayer: () => of(mockPlayer),
            deletePlayer: () => of({}),
            toggleFavorite: () => of(mockPlayer),
            addComment: () => of({}),
            updateComment: () => of({}),
            deleteComment: () => of({}),
            reverseGeocode: () => of('Madrid, España'),
            getPlayerTeamsHistory: () => of([]),
            getPlayerHonours: () => of([]),
            getPlayerMilestones: () => of([]),
            lookupTSDBTeam: () => of(null),
            lookupTSDBLeague: () => of(null)
          }
        },
        { provide: AuthService, useValue: { isAdmin: () => false, currentUser: () => ({ uid: 'user-1', displayName: 'Test User' }), getUID: () => 'user-1', userData: () => ({}) } },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: { showError: () => {}, showSuccess: () => {} } },
        {
          provide: ModalController,
          useValue: {
            create: () => Promise.resolve({
              present: () => Promise.resolve(),
              onWillDismiss: () => Promise.resolve({ data: true })
            })
          }
        },
        { provide: NavController, useValue: { navigateRoot: () => {}, back: () => {} } },
        { provide: AlertController, useValue: {} },
        { provide: LoadingController, useValue: { create: () => Promise.resolve({ present: () => {}, dismiss: () => {} }) } },
        { provide: ConfettiService, useValue: { goldCelebrate: () => {} } },
        { provide: LocationPlugin, useValue: { isGeolocationPermissionGranted: () => Promise.resolve(false), requestGeolocationPermission: () => Promise.resolve(false) } },
        { provide: MapPlugin, useValue: { initMap: () => {}, addMarker: () => {}, destroyMap: () => {} } },
        { provide: ShareCardPlugin, useValue: { shareElementAsImage: () => Promise.resolve(true) } },
        { provide: HapticsPlugin, useValue: { impact: () => {}, notification: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).then(({ component, fixture }) => {
      component.id = '123';
      fixture.detectChanges();
    });

    cy.contains('Leo Messi').should('exist');
  });
});

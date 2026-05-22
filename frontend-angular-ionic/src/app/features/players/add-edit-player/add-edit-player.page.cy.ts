import { mount } from 'cypress/angular';
import { AddEditPlayerPage } from './add-edit-player.page';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController, LoadingController, ModalController, AlertController } from '@ionic/angular/standalone';
import { of, BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConfettiService } from 'src/app/core/services/ui/confetti.service';
import { CameraPlugin } from 'src/app/core/plugins/camera-plugin';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { MapPlugin } from 'src/app/core/plugins/maps-plugin';
import { DomSanitizer } from '@angular/platform-browser';

describe('AddEditPlayerPage Component', () => {
  it('mounts and displays form', () => {
    const user$ = new BehaviorSubject({ uid: '123' });

    mount(AddEditPlayerPage, {
      imports: [IonicModule.forRoot(), AddEditPlayerPage, HttpClientTestingModule],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            getPlayer: () => of(null),
            savePlayer: () => of({ _id: '123' }),
            getPlayers: () => of([]),
            searchTSDBPlayers: () => of([]),
            lookupTSDBPlayer: () => of(null),
            lookupTSDBLeague: () => of(null),
            bulkImportPlayers: () => of({ count: 0 }),
            reverseGeocode: () => of('Madrid, España'),
            mapTSDBToPlayer: () => ({})
          }
        },
        {
          provide: AuthService,
          useValue: {
            user$,
            isAdmin: () => false,
            currentUser: () => ({ uid: '123' }),
            getUID: () => '123',
            userData: () => ({})
          }
        },
        { provide: LayoutService, useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ToastService, useValue: { showError: () => {}, showSuccess: () => {} } },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: NavController, useValue: { back: () => {}, navigateRoot: () => {} } },
        {
          provide: ModalController,
          useValue: {
            create: () => Promise.resolve({
              present: () => Promise.resolve(),
              onWillDismiss: () => Promise.resolve({ data: null })
            })
          }
        },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: () => Promise.resolve(), dismiss: () => Promise.resolve() })
          }
        },
        { provide: AlertController, useValue: {} },
        {
          provide: LocationPlugin,
          useValue: {
            isGeolocationPermissionGranted: () => Promise.resolve(false),
            requestGeolocationPermission: () => Promise.resolve(false),
            getCurrentPosition: () => Promise.resolve({ coords: { latitude: 40.4, longitude: -3.7 } })
          }
        },
        {
          provide: CameraPlugin,
          useValue: {
            isCameraPermissionGranted: () => Promise.resolve(false),
            requestCameraPermission: () => Promise.resolve(false),
            takePhoto: () => Promise.resolve(null)
          }
        },
        { provide: MapPlugin, useValue: { initMap: () => ({ invalidateSize: () => {} }), addMarker: () => ({ on: () => {} }), destroyMap: () => {} } },
        { provide: ConfettiService, useValue: { celebrate: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustResourceUrl: (url: string) => url } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).then(({ component, fixture }) => {
      component.entryMode = 'manual';
      fixture.detectChanges();
    });

    cy.contains('Información Personal').should('exist');
  });
});

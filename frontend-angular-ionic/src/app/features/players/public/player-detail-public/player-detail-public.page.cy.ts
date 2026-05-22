import { PlayerDetailPublicPage } from './player-detail-public.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { PlatformService } from '../../../../core/services/system/platform.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NavController, ModalController } from '@ionic/angular/standalone';
import { ConfettiService } from '../../../../core/services/ui/confetti.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LocationPlugin } from '../../../../core/plugins/location-plugin';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Player } from '../../../../core/models/player.model';

describe('PlayerDetailPublicPage Component Tests with Cypress', () => {
  let playerServiceMock: any;
  let authServiceMock: any;
  let navCtrlMock: any;
  let layoutServiceMock: any;
  let modalCtrlMock: any;
  let confettiServiceMock: any;
  let toastServiceMock: any;
  let locationPluginMock: any;

  const mockPlayer = {
    _id: '1',
    name: 'Alex Oxlade-Chamberlain',
    position: 'Centrocampista',
    team: 'Besiktas',
    league: 'Süper Lig',
    nationality: 'Inglaterra',
    age: 30,
    user_id: 'user-1',
    image_url: 'https://example.com/photo.jpg',
    images: {
      cutout: 'https://example.com/cutout.jpg'
    },
    number: 15,
    stats: {
      partidos: 20,
      goles: 5,
      asistencias: 8,
      tarjetas_amarillas: 2,
      tarjetas_rojas: 0
    },
    scouting_report: {
      overall_rating: 4,
      strengths: ['Pase largo', 'Visión de juego'],
      weaknesses: ['Velocidad', 'Defensa'],
      tactical_notes: 'Jugador muy técnico con buena visión.'
    }
  } as unknown as Player;

  const mockComments = [
    {
      id: 'c1',
      authorName: 'Juan Pérez',
      content: 'Gran jugador, excelente visión de juego.',
      rating: 5,
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    playerServiceMock = {
      getPublicPlayer: (cy.stub().returns(of(mockPlayer)) as any).as('getPlayerStub'),
      getLeagueDetails: (cy.stub().returns(of({ id: 'l1', name: 'Süper Lig' })) as any).as('getLeagueStub'),
      getPlayerTeams: (cy.stub().returns(of([])) as any).as('getTeamsStub'),
      getComments: (cy.stub().returns(of(mockComments)) as any).as('getCommentsStub'),
      addComment: (cy.stub().returns(of({ id: 'c2', authorName: 'Invitado', content: 'Nuevo comentario', rating: 4 })) as any).as('addCommentStub')
    };
    authServiceMock = {
      currentUser: (cy.stub().returns(null) as any).as('currentUserStub'),
      userData: (cy.stub().returns(null) as any).as('userDataStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateRootStub')
    };
    layoutServiceMock = {
      setHeader: cy.stub().as('setHeaderStub'),
      setBreadcrumbs: cy.stub().as('setBreadcrumbsStub')
    };
    modalCtrlMock = {
      create: cy.stub().as('modalCreateStub')
    };
    confettiServiceMock = {
      triggerConfetti: cy.stub().as('triggerConfettiStub')
    };
    toastServiceMock = {
      showSuccess: cy.stub().as('toastSuccessStub'),
      showError: cy.stub().as('toastErrorStub')
    };
    locationPluginMock = {
      isGeolocationPermissionGranted: (cy.stub().resolves(false) as any).as('isGeoGrantedStub'),
      requestGeolocationPermission: (cy.stub().resolves(false) as any).as('requestGeoStub')
    };
  });

  it('should display player name, position and team details correctly', () => {
    cy.mount(PlayerDetailPublicPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ConfettiService, useValue: confettiServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LocationPlugin, useValue: locationPluginMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ],
      componentProperties: {
        id: '1'
      }
    });

    cy.get('@getPlayerStub').should('have.been.calledWith', '1');
    cy.contains('Alex Oxlade-Chamberlain').should('exist');
    cy.contains('Centrocampista').should('exist');
    cy.contains('Besiktas').should('exist');
  });

  it('should toggle cutout view when the card action trigger button is clicked', () => {
    cy.mount(PlayerDetailPublicPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ConfettiService, useValue: confettiServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LocationPlugin, useValue: locationPluginMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ],
      componentProperties: {
        id: '1'
      }
    });

    cy.get('@getPlayerStub').should('have.been.calledWith', '1');
    // Validamos que el envoltorio del cutout no sea visible inicialmente o no tenga la clase is-visible
    cy.get('.cutout-wrapper').should('not.have.class', 'is-visible');

    // Pulsamos el botón de flip
    cy.get('.card-action-trigger').click();

    // Ahora el wrapper del cutout debería tener la clase is-visible
    cy.get('.cutout-wrapper').should('have.class', 'is-visible');
  });
});

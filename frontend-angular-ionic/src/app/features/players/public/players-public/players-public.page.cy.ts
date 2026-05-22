import { PlayersPublicPage } from './players-public.page';
import { IonicModule } from '@ionic/angular';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { PlatformService } from '../../../../core/services/system/platform.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Player } from '../../../../core/models/player.model';

describe('PlayersPublicPage Component Tests with Cypress', () => {
  let playerServiceMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;
  let authServiceMock: any;
  let navCtrlMock: any;

  const mockPlayers: Player[] = [
    {
      _id: '1',
      name: 'Alex Oxlade-Chamberlain',
      position: 'Centrocampista',
      team: 'Besiktas',
      league: 'Süper Lig',
      nationality: 'Inglaterra',
      age: 30,
      user_id: 'user-1',
      image_url: '',
      number: 15,
      images: { cutout: '' }
    },
    {
      _id: '2',
      name: 'Lionel Messi',
      position: 'Delantero',
      team: 'Inter Miami',
      league: 'MLS',
      nationality: 'Argentina',
      age: 36,
      user_id: 'user-2',
      image_url: '',
      number: 10,
      images: { cutout: '' }
    }
  ];

  beforeEach(() => {
    playerServiceMock = {
      getPublicPlayers: (cy.stub().returns(of(mockPlayers)) as any).as('getPublicPlayersStub')
    };
    layoutServiceMock = {
      setHeader: cy.stub().as('setHeaderStub'),
      setBreadcrumbs: cy.stub().as('setBreadcrumbsStub')
    };
    platformServiceMock = {
      isMobileApp: false,
      isDesktop: true
    };
    authServiceMock = {
      currentUser: (cy.stub().returns(null) as any).as('currentUserStub'),
      userData: (cy.stub().returns(null) as any).as('userDataStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateRootStub')
    };
  });

  it('should render the public players page with listing and mock players', () => {
    cy.mount(PlayersPublicPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    });

    // Validamos que se muestren solo las tarjetas reales de jugadores
    cy.get('ion-card.player-premium-card').should('have.length', 2);
    cy.contains('Alex Oxlade-Chamberlain').should('exist');
    cy.contains('Lionel Messi').should('exist');
  });

  it('should filter players based on search query', () => {
    cy.mount(PlayersPublicPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    });

    // Escribimos "Lionel" en el buscador real del componente Ionic
    cy.get('ion-searchbar input').type('Lionel');

    // Confirmamos que solo quede 1 tarjeta de jugador con Messi y no Chamberlain
    cy.get('ion-card.player-premium-card').should('have.length', 1);
    cy.contains('Lionel Messi').should('exist');
    cy.contains('Alex Oxlade-Chamberlain').should('not.exist');
  });
});

import { AiTeamPage } from './ai-team.page';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/players/player.service.token';
import { AI_SERVICE_TOKEN } from '../../core/services/ai/ai.service.token';
import { LayoutService } from '../../core/services/ui/layout.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { of, delay } from 'rxjs';

describe('AiTeamPage Component Cypress Tests', () => {
  let playerServiceMock: any;
  let aiServiceMock: any;
  let layoutServiceMock: any;
  let authServiceMock: any;
  let toastServiceMock: any;

  const mockPlayers = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Jugador ${i + 1}`,
    position: i === 0 ? 'PO' : i < 5 ? 'DF' : i < 9 ? 'MC' : 'DL',
    image_url: ''
  }));

  beforeEach(() => {
    playerServiceMock = {
      getPlayers: cy.stub().as('getPlayers').returns(of(mockPlayers))
    };

    aiServiceMock = {
      analyzeMyTeam: cy.stub().as('analyzeMyTeam').returns(of({
        analysis: 'Análisis detallado de IA para pruebas.',
        formation: '4-3-3',
        starPlayer: 'Jugador Estrella',
        justification: 'Justificación táctica premium.',
        idealEleven: mockPlayers.map(p => ({
          name: p.name,
          position: p.position,
          role: 'Titular de Gala'
        })),
        tacticalRecommendations: ['Presión alta coordinada', 'Salida limpia de balón']
      }))
    };

    layoutServiceMock = {
      setHeader: () => {},
      setBreadcrumbs: () => {},
      setAILoading: () => {}
    };

    authServiceMock = {
      currentUser: () => null,
      userData: () => null,
      firstName: () => '',
      isAdmin: () => false,
      isMasterAdmin: () => false,
      logout: () => Promise.resolve(),
      isLoggedIn$: of(false)
    };

    toastServiceMock = {
      showError: () => {},
      showSuccess: () => {},
      showWarning: () => {}
    };
  });

  const commonProviders = () => [
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
    { provide: AI_SERVICE_TOKEN, useValue: aiServiceMock },
    { provide: LayoutService, useValue: layoutServiceMock },
    { provide: AuthService, useValue: authServiceMock },
    { provide: ToastService, useValue: toastServiceMock }
  ];

  it('should render the loading state first', () => {
    playerServiceMock.getPlayers.returns(of([]).pipe(delay(100)));

    cy.mount(AiTeamPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: commonProviders()
    });

    cy.get('ion-content').should('exist');
  });

  it('should show warning if there are no players', () => {
    playerServiceMock.getPlayers.returns(of([]));

    cy.mount(AiTeamPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: commonProviders()
    });

    cy.get('.warning-box').should('contain', 'Para que la IA funcione correctamente, debes tener jugadores cargados');
  });

  it('should show warning if there are insufficient players (< 11)', () => {
    playerServiceMock.getPlayers.returns(of(mockPlayers.slice(0, 5)));

    cy.mount(AiTeamPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: commonProviders()
    });

    cy.get('.warning-box').should('contain', 'Necesitas al menos 11 jugadores');
  });

  it('should enable and trigger AI generation if we have 11 or more players', () => {
    cy.mount(AiTeamPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: commonProviders()
    });

    cy.get('ion-button').contains('Mi equipo ideal').should('not.be.disabled').click();

    cy.get('.star-player-card').should('contain', 'ESTRELLA DE LA PLANTILLA');
    cy.get('h2').should('contain', 'Jugador Estrella');
    cy.get('h3').should('contain', 'Once Ideal Sugerido');
  });
});

describe('Home Page (Dashboard)', () => {
  before(() => {
    Cypress.on('uncaught:exception', (err) => {
      if (err.message.includes("Cannot read properties of undefined (reading 'contains')")) {
        return false;
      }
    });
  });

  const loginUser = () => {
    cy.visit('/auth/login');
    cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
    cy.typeIntoIonInput('password', '1q2w3e4r');
    cy.contains('ion-button', 'Iniciar Sesión').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/home');
    cy.dismissUiBlockers();
  });

  it('should display the main dashboard sections', () => {
    // Tarjeta del estado de Football AI
    cy.get('.ai-scout-card').should('exist');

    // El widget puede variar por estado del usuario/datos, pero al menos el layout debe existir
    cy.get('ion-content, ion-card').should('exist');

    cy.get('tv-schedule-widget', { timeout: 12000 }).should('exist');
  });

  it('should display the Stencil player-list widget', () => {
    cy.get('body').then(($body) => {
      if ($body.find('player-list').length > 0) {
        cy.get('player-list').shadow().find('h3').should('contain', 'Mis Fichajes');
      } else {
        cy.get('.empty-state-card').should('exist');
      }
    });
  });

  it('should display the Stencil tv-schedule-widget', () => {
    cy.get('tv-schedule-widget').should('exist');
    cy.get('tv-schedule-widget', { timeout: 12000 }).shadow().find('h3').should('contain', 'Próximos partidos de Fútbol');
    cy.get('tv-schedule-widget').shadow().find('.date-navigator').should('exist');
  });

  it('should allow navigating the TV schedule days', () => {
    cy.get('tv-schedule-widget', { timeout: 12000 }).shadow().find('.nav-btn').last().as('nextBtn');
    
    // Verificamos si el botón existe y permite la interacción
    cy.get('@nextBtn').then($btn => {
      if (!$btn.is(':disabled')) {
        cy.get('@nextBtn').click({ force: true });
        cy.get('tv-schedule-widget').shadow().find('.date-text').should('exist');
      }
    });
  });

  it('should redirect to Fútbol AI analysis page when AI status card is clicked', () => {
    cy.get('.ai-scout-card').scrollIntoView().click({ force: true });
    cy.url().should('include', '/ai-team');
  });

  it('should show empty state or handle list redirection to add player', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.empty-state-card').length > 0) {
        // Si no hay jugadores, probamos que el botón de vacío redirija a la creación
        cy.get('.empty-state-card ion-button').click();
        cy.url().should('include', '/player-add');
      } else {
        // Si hay jugadores, probamos que el botón de "Ver más" de la lista redirija a /players
        if ($body.find('player-list').length > 0) {
          cy.get('player-list').shadow().then(($shadow) => {
            const hasViewMore = $shadow.find('.view-more-btn').length > 0;

            if (hasViewMore) {
              cy.wrap($shadow).find('.view-more-btn').click({ force: true });
              cy.url().should('include', '/players');
            } else {
              cy.wrap($shadow).find('h3').should('exist');
            }
          });
        }
      }
    });
  });
});

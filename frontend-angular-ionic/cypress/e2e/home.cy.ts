describe('Home Page (Dashboard)', () => {
  beforeEach(() => {
    // Entramos directamente al Home para iniciar las pruebas
    cy.visit('/home');
  });

  it('should display the main dashboard sections', () => {
    // Carrusel de noticias principales
    cy.get('.news-swiper-wrapper').should('exist');
    
    // Tarjeta del estado de Football AI
    cy.get('.ai-scout-card').should('exist');

    // Widgets de Stencil
    cy.get('player-list').should('exist');
    cy.get('tv-schedule-widget').should('exist');
  });

  it('should display the Stencil player-list widget', () => {
    cy.get('player-list').should('exist');
    cy.get('player-list').shadow().find('h3').should('contain', 'Mis Fichajes');
    cy.get('player-list').shadow().find('.stencil-tag').should('contain', 'by Stencil');
  });

  it('should display the Stencil tv-schedule-widget', () => {
    cy.get('tv-schedule-widget').should('exist');
    cy.get('tv-schedule-widget').shadow().find('h3').should('contain', 'Próximos partidos de Fútbol');
    cy.get('tv-schedule-widget').shadow().find('.date-navigator').should('exist');
  });

  it('should allow navigating the TV schedule days', () => {
    cy.get('tv-schedule-widget').shadow().find('.nav-btn').last().as('nextBtn');
    
    // Verificamos si el botón existe y permite la interacción
    cy.get('@nextBtn').then($btn => {
      if (!$btn.is(':disabled')) {
        cy.get('@nextBtn').click();
        cy.get('tv-schedule-widget').shadow().find('.date-text').should('exist');
      }
    });
  });

  it('should redirect to Fútbol AI analysis page when AI status card is clicked', () => {
    cy.get('.ai-scout-card').click();
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
        cy.get('player-list').shadow().find('.view-more-btn').then($btn => {
          if ($btn.length > 0) {
            cy.wrap($btn).click({ force: true });
            cy.url().should('include', '/players');
          }
        });
      }
    });
  });
});

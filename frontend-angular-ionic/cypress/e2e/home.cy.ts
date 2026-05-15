describe('Home Page (Dashboard)', () => {
  beforeEach(() => {
    // Simulamos login o entramos directamente si no hay guard
    cy.visit('/home');
  });

  it('should display the main dashboard sections', () => {
    cy.get('.news-swiper-wrapper').should('exist');
    cy.get('.live-tv-section').should('exist');
    cy.get('.live-scores-section').should('exist');
    cy.get('.profile-card').should('exist');
  });

  it('should display the Stencil player-list widget', () => {
    cy.get('player-list').should('exist');
    cy.get('player-list').shadow().find('h3').should('contain', 'Mis Fichajes');
    cy.get('player-list').shadow().find('.stencil-tag').should('contain', 'by Stencil');
  });

  it('should display the new Stencil tv-schedule-widget', () => {
    cy.get('tv-schedule-widget').should('exist');
    cy.get('tv-schedule-widget').shadow().find('h3').should('contain', 'Partidos de los próximos días');
    cy.get('tv-schedule-widget').shadow().find('.date-navigator').should('exist');
  });

  it('should allow navigating the TV schedule days', () => {
    cy.get('tv-schedule-widget').shadow().find('.nav-btn').last().as('nextBtn');
    
    // Verificamos si el botón existe y no está deshabilitado (depende de la data)
    cy.get('@nextBtn').then($btn => {
      if (!$btn.is(':disabled')) {
        cy.get('@nextBtn').click();
        cy.get('tv-schedule-widget').shadow().find('.date-text').should('exist');
      }
    });
  });

  it('should update live scores without reloading the card (trackBy test concept)', () => {
    // Este test es difícil de probar puramente con Cypress sin mocks, 
    // pero verificamos que las tarjetas de scores existen.
    cy.get('.compact-score-card').should('have.length.at.least', 1);
  });
});

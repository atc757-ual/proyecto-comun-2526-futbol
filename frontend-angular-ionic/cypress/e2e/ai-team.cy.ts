describe('Futbol AI Page E2E Tests', () => {
  beforeEach(() => {
    // Visitamos la página de Futbol AI
    cy.visit('/ai-team');
  });

  it('should display the main Futbol AI page title and layout', () => {
    cy.contains('Futbol AI').should('be.visible');
    cy.get('ion-card').should('exist');
  });

  it('should display conditional messages based on player presence', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.warning-box').length > 0) {
        // Si hay advertencias por falta de jugadores, se visualizan correctamente
        cy.get('.warning-box').should('be.visible');
      } else {
        // Si hay suficientes jugadores, el botón de acción de la IA está presente y habilitado
        cy.get('ion-button').contains('Mi equipo ideal').should('be.visible').and('not.be.disabled');
      }
    });
  });

  it('should redirect properly to recommended side actions', () => {
    // 1. Probar redirección a Crear Jugadores
    cy.get('ion-item').contains('Crear Jugadores').click();
    cy.url().should('include', '/player-add');

    // Regresar a la página de la IA
    cy.visit('/ai-team');

    // 2. Probar redirección a Mi Plantilla
    cy.get('ion-item').contains('Mi Plantilla').click();
    cy.url().should('include', '/players');
  });
});

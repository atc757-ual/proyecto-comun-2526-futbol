describe('Futbol AI Page E2E Tests', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.get('ion-input[name="email"] input').clear().type('atc757@inlumine.ual.es');
    cy.get('ion-input[name="password"] input').clear().type('1q2w3e4r');
    cy.get('ion-button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/ai-team');
  });

  it('should display the main Futbol AI page title and layout', () => {
    cy.get('ion-card').first().should('contain.text', 'Futbol AI');
    cy.contains('div', '¡Hola, soy Futbol AI!').should('be.visible');
    cy.get('ion-card').should('exist');
  });

  it('should display conditional messages based on player presence', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.warning-box').length > 0) {
        // Si hay advertencias por falta de jugadores, se visualizan correctamente
        cy.get('.warning-box').should('be.visible');
      } else {
        // Si hay suficientes jugadores, el botón de acción de la IA está presente
        cy.contains('ion-button', 'Mi equipo ideal').should('be.visible');
      }
    });
  });

  it('should redirect properly to recommended side actions', () => {
    // 1. Probar redirección a Crear Jugadores
    cy.contains('ion-item', 'Crear Jugadores').click();
    cy.url().should('include', '/player-add');

    // Regresar a la página de la IA
    cy.visit('/ai-team');

    // 2. Probar redirección a Mi Plantilla
    cy.contains('ion-item', 'Mi Plantilla').click();
    cy.url().should('include', '/players');
  });
});

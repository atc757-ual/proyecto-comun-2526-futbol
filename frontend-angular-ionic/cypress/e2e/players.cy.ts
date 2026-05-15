describe('Players Page', () => {
  beforeEach(() => {
    cy.visit('/players');
  });

  it('should display the players list grid', () => {
    cy.get('.players-grid').should('exist');
    cy.get('ion-searchbar').should('exist');
  });

  it('should allow filtering players by name', () => {
    cy.get('ion-searchbar').type('Messi');
    // Verificamos que se filtran o cargan resultados
    cy.get('.player-card-container').should('exist');
  });

  it('should navigate to add player page when clicking the FAB', () => {
    cy.get('ion-fab-button').click();
    cy.url().should('include', '/players/add');
  });

  it('should navigate to player details when clicking a card', () => {
    cy.get('.player-card-container').first().click();
    cy.url().should('match', /\/players\/[a-zA-Z0-9]+/);
  });
});

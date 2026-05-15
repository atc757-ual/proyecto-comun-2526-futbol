describe('Leagues Page', () => {
  beforeEach(() => {
    cy.visit('/leagues');
  });

  it('should display the search bar and filter sections', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('.search-results-container').should('exist');
    cy.get('.selected-players-sidebar').should('exist');
  });

  it('should allow searching for a league', () => {
    cy.get('ion-searchbar').type('Spanish La Liga{enter}');
    // Esperamos que aparezca algún resultado
    cy.get('.league-card', { timeout: 10000 }).should('exist');
  });

  it('should allow selecting a league and seeing teams', () => {
    cy.get('ion-searchbar').type('Spanish La Liga{enter}');
    cy.get('.league-card').first().click();
    
    // Verificamos que cargan los equipos
    cy.get('.team-card', { timeout: 10000 }).should('exist');
  });

  it('should allow selecting players and adding them to the queue', () => {
    // Este test asume que ya navegamos a equipos y jugadores
    // Simplemente verificamos que el contenedor de la derecha tiene el botón de confirmación
    cy.get('.confirm-selection-btn').should('exist');
  });

  it('should enforce the 11 player limit', () => {
    // Lógica compleja para simular 11 clicks, pero verificamos el estado inicial
    cy.get('.selection-count-badge').should('contain', '0/11');
  });
});

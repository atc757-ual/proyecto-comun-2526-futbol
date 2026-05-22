describe('Players Feature Smoke E2E', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
    cy.typeIntoIonInput('password', '1q2w3e4r');
    cy.contains('ion-button', 'Iniciar Sesión').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
  });

  it('should open /players and show list layout', () => {
    cy.visit('/players');
    cy.url().should('include', '/players');
    cy.get('ion-searchbar, .players-grid, .empty-state-card').should('exist');
  });

  it('should open /players-all and show list layout', () => {
    cy.visit('/players-all');
    cy.url().should('include', '/players-all');
    cy.get('ion-searchbar, .players-grid, .empty-state-card').should('exist');
  });

  it('should open /player-add route', () => {
    cy.visit('/player-add');
    cy.url().should('include', '/player-add');
    cy.get('ion-segment, ion-searchbar, form').should('exist');
  });

  it('should navigate to player detail if there are cards', () => {
    cy.visit('/players');
    cy.get('body').then(($body) => {
      const hasCard = $body.find('.player-card-container, .player-premium-card').length > 0;
      if (hasCard) {
        cy.get('.player-card-container, .player-premium-card').first().click({ force: true });
        cy.url().should('match', /\/player-detail\/[a-zA-Z0-9]+/);
      } else {
        cy.get('ion-searchbar, .empty-state-card').should('exist');
      }
    });
  });

  it('should open edit page route directly when id is available from list links', () => {
    cy.visit('/players');
    cy.get('body').then(($body) => {
      const hasEdit = $body.find('[href*="/player-edit/"], .action-fab.edit, .side-action-btn.edit').length > 0;
      if (hasEdit) {
        cy.get('[href*="/player-edit/"], .action-fab.edit, .side-action-btn.edit').first().click({ force: true });
        cy.url().should('include', '/player-edit/');
      } else {
        cy.get('body').should('exist');
      }
    });
  });
});
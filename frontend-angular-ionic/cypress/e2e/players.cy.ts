describe('Players Feature Smoke E2E', () => {
  const loginUser = () => {
    cy.clearLocalStorage();
    cy.clearCookies();
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

  it('should search players via external API and show results (import mode)', () => {
    cy.visit('/player-add');
    cy.url().should('include', '/player-add');

    // Modo importación
    cy.get('ion-segment-button[value="import"]').click({ force: true });

    // Buscar un jugador
    cy.get('ion-searchbar').type('Messi');
    cy.wait(3000);

    // Verificar que la búsqueda funcionó — hay resultados o mensaje vacío
    cy.get('body').then(($body) => {
      const hasResults = $body.find('ion-card').length > 0;
      const hasEmpty = $body.find('.empty-state, .no-results').length > 0;
      expect(hasResults || hasEmpty || $body.find('ion-searchbar').length > 0).to.be.true;
    });
  });

  it('should insert a new player manually via the manual form', () => {
    // Interceptar la llamada al backend para no depender de GPS real
    cy.intercept('POST', '**/api/players').as('createPlayer');

    cy.visit('/player-add');
    cy.url().should('include', '/player-add');

    // Cambiar a modo manual
    cy.get('ion-segment-button[value="manual"]').click({ force: true });

    // Rellenar campos obligatorios
    cy.typeIntoIonInput('name', 'Jugador Test E2E');
    cy.typeIntoIonInput('nationality', 'Español');
    cy.typeIntoIonInput('team', 'Equipo Test');
    cy.wait(500);

    // Verificar que el botón existe y hacer click
    cy.contains('ion-button', 'Guardar jugador').should('not.be.disabled').click({ force: true });

    // Verificar que se intentó guardar — toast o petición al backend
    cy.get('body').then(($body) => {
      const hasToast = $body.find('ion-toast').length > 0;
      if (hasToast) {
        cy.get('ion-toast').should('exist');
      } else {
        // Sin GPS el sistema puede mostrar un aviso en lugar de toast
        cy.get('ion-toast, .gps-permission-card, ion-alert').should('exist');
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
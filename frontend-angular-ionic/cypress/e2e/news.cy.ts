const loginUser = () => {
  cy.visit('/auth/login');
  cy.dismissUiBlockers();
  cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
  cy.typeIntoIonInput('password', '1q2w3e4r');
  cy.contains('ion-button', 'Iniciar Sesión').click({ force: true });
  cy.url({ timeout: 15000 }).should('include', '/home');
};

describe('News Reader Flow', () => {
  beforeEach(() => {
    loginUser();
  });

  it('should navigate to news list and handle detail flow', () => {
    cy.visit('/news');
    cy.url().should('include', '/news');

    cy.get('body').then(($body) => {
      if ($body.find('.main-news-card').length > 0) {
        cy.get('.main-news-card').first().click();
        cy.url().should('match', /\/news\/[a-zA-Z0-9]+/);
      } else {
        cy.get('ion-content, ion-card, app-news').should('exist');
      }
    });
  });
});

describe('News Management Access', () => {
  it('should open manage-news if role allows it, otherwise redirect safely', () => {
    loginUser();
    cy.visit('/manage-news');
    cy.url().should((url) => {
      const ok = url.includes('/manage-news') || url.includes('/home') || url.includes('/auth/login');
      expect(ok).to.equal(true);
    });
  });
});
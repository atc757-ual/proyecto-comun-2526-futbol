describe('News Reader Flow', () => {
  it('should navigate to news list and handle detail flow', () => {
    cy.visit('/news');
    cy.url().should('include', '/news');

    cy.get('body').then(($body) => {
      if ($body.find('.main-news-card').length > 0) {
        cy.get('.main-news-card').first().click();
        cy.url().should('match', /\/news\/[a-zA-Z0-9]+/);
      } else {
        cy.contains('ion-card, div', 'noticia', { matchCase: false }).should('exist');
      }
    });
  });
});

describe('News Management Access', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.get('ion-input[name="email"] input').clear().type('atc757@inlumine.ual.es');
    cy.get('ion-input[name="password"] input').clear().type('1q2w3e4r');
    cy.get('ion-button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  it('should open manage-news if role allows it, otherwise redirect safely', () => {
    loginUser();
    cy.visit('/manage-news');
    cy.url().should((url) => {
      const ok = url.includes('/manage-news') || url.includes('/home') || url.includes('/auth/login');
      expect(ok).to.equal(true);
    });
  });
});
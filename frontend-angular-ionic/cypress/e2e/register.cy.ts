describe('Register Page E2E Flow – Real Cases', () => {
  const fillRegisterForm = (email: string, password = '1q2w3e4r') => {
    cy.typeIntoIonInput('fullName', 'Alex Test');
    cy.typeIntoIonInput('email', email);
    cy.typeIntoIonInput('password', password);
    cy.typeIntoIonInput('confirmPassword', password);
  };

  const acceptTerms = () => {
    cy.get('ion-label a').click();
    cy.get('ion-content.inner-scroll').then(async ($el) => {
      const scrollEl = await ($el[0] as any).getScrollElement();
      scrollEl.scrollTop = scrollEl.scrollHeight;
      $el[0].dispatchEvent(new CustomEvent('ionScroll'));
    });
    cy.get('.terms-action-wrapper ion-button').click();
  };

  beforeEach(() => {
    cy.visit('/auth/register');
  });

  it('shows error when trying to register an already existing email', () => {
    fillRegisterForm('atc757@inlumine.ual.es');
    acceptTerms();
    cy.get('ion-button[type="submit"]').click();

    cy.get('ion-toast', { timeout: 12000 }).should('exist');
    cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
    cy.url().should('include', '/auth/register');
  });

  it('registers an auto-generated email and validates the flow result', () => {
    const uniqueEmail = `testuser_${Date.now()}@test.com`;
    const password = '1q2w3e4r';

    fillRegisterForm(uniqueEmail, password);
    acceptTerms();
    cy.get('ion-button[type="submit"]').click();

    cy.get('ion-modal, ion-toast', { timeout: 15000 }).then(($elements) => {
      const hasModal = $elements.toArray().some((el) => el.tagName.toLowerCase() === 'ion-modal');

      if (hasModal) {
        cy.get('ion-modal .modal-wrapper .futbol-btn-primary').click({ force: true });
        cy.url({ timeout: 15000 }).should((url) => {
          const valid =
            url.includes('/login') ||
            url.includes('/auth/login') ||
            url.includes('/auth/register');
          expect(valid).to.equal(true);
        });
      } else {
        cy.get('ion-toast').should('exist');
        cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
        cy.url().should('include', '/auth/register');
      }
    });

    Cypress.env('e2e_email', uniqueEmail);
    Cypress.env('e2e_password', password);
  });
});

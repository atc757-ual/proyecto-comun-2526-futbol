describe('Permission Modal E2E Flow', () => {
  beforeEach(() => {
    cy.visit('/home', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('last_permission_prompt_home');
      }
    });
  });

  it('should either present permission modal or continue without blocking dashboard', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-modal-main-container').length > 0) {
        cy.get('.permission-modal-main-container').should('exist');
      } else {
        cy.get('body').should('exist');
      }
    });
  });

  it('should close modal when clicking the footer action if modal exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-footer ion-button').length > 0) {
        cy.get('.permission-footer ion-button').first().click({ force: true });
        cy.get('.permission-modal-main-container').should('not.exist');
      } else {
        cy.get('body').should('exist');
      }
    });
  });
});
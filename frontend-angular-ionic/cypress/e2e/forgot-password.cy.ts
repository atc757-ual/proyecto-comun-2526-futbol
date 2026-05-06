describe('Forgot Password Flow', () => {
  beforeEach(() => {
    cy.visit('/forgot-password');
  });

  it('should send reset link and show countdown', () => {
    cy.get('ion-input[name="email"] input').type('alex@test.com');
    cy.get('ion-button').contains('Enviar enlace').click();
    
    // Check if step 2 is visible
    cy.contains('Revisa tu bandeja de entrada').should('be.visible');
    cy.contains('Reintenta en').should('be.visible');
  });

  it('should navigate back to login', () => {
    cy.get('ion-icon[name="arrow-back-outline"]').click();
    cy.url().should('include', '/login');
  });
});

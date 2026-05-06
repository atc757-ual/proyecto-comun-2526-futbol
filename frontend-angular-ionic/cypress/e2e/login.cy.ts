describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should show error message with invalid credentials', () => {
    cy.get('ion-input[name="email"] input').type('wrong@email.com');
    cy.get('ion-input[name="password"] input').type('wrongpassword');
    cy.get('ion-button[type="submit"]').click();
    
    // Check if toast appears
    cy.get('ion-toast').shadow().find('.toast-message').should('exist');
  });

  it('should navigate to register page', () => {
    cy.contains('¿No tienes cuenta?').click();
    cy.url().should('include', '/register');
  });

  it('should toggle password visibility', () => {
    cy.get('ion-input[name="password"] input').should('have.attr', 'type', 'password');
    cy.get('ion-input-password-toggle').click();
    cy.get('ion-input[name="password"] input').should('have.attr', 'type', 'text');
  });
});

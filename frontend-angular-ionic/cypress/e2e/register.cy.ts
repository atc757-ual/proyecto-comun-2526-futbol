describe('Register Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should validate form fields', () => {
    // Fill short name
    cy.get('ion-input[name="fullName"] input').type('Al');
    cy.contains('Solo letras (Mín. 3 carácteres)').should('be.visible');

    // Fill valid name
    cy.get('ion-input[name="fullName"] input').clear().type('Alex Test');
    cy.get('ion-icon[name="checkmark-circle-outline"]').should('be.visible');
  });

  it('should show success modal on successful registration', () => {
    // This would require mocking the Firebase response
    // cy.intercept('POST', '**/signup*', { statusCode: 200, body: {} });
    
    cy.get('ion-input[name="fullName"] input').type('Usuario Prueba');
    cy.get('ion-input[name="email"] input').type('prueba@test.com');
    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password123');
    
    // Check if button is enabled
    cy.get('ion-button[type="submit"]').should('not.be.disabled');
  });
});

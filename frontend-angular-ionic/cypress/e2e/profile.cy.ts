describe('Profile Page E2E Tests', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
    cy.typeIntoIonInput('password', '1q2w3e4r');
    cy.contains('ion-button', 'Iniciar Sesión').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/profile');
  });

  it('should display the profile page with account and system sections', () => {
    cy.contains('Seguridad y Acceso').should('be.visible');
    cy.contains('Preferencias del Sistema').should('be.visible');
    cy.get('.profile-name').should('be.visible');
    cy.get('.profile-email').should('contain.text', '@');
  });

  it('should show the display name capitalized by words', () => {
    cy.get('.profile-name')
      .invoke('text')
      .then((text) => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        expect(words.length).to.be.greaterThan(0);
        words.forEach((word) => {
          expect(word.charAt(0)).to.equal(word.charAt(0).toUpperCase());
        });
      });
  });

  it('should open the password reset action without breaking the page', () => {
    cy.contains('.action-item', 'Cambiar Contraseña').click({ force: true });
    cy.get('.profile-page').should('exist');
  });
});
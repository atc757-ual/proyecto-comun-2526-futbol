describe('Login Flow – Real Cases', () => {
  const emailInputSelector = 'ion-input[name="email"] input:not([disabled]):visible';
  const passwordInputSelector = 'ion-input[name="password"] input:not([disabled]):visible';

  const fillAndSubmitLogin = (email: string, password: string) => {
    cy.get(emailInputSelector).should('be.visible').clear().type(email);
    cy.get(passwordInputSelector).should('be.visible').clear().type(password);
    cy.get('ion-button[type="submit"]').should('exist');
    cy.contains('ion-button', 'Iniciar Sesión').click();
  };

  const assertErrorToast = () => {
    cy.get('ion-toast', { timeout: 12000 }).should('exist');
    cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
  };

  const assertErrorToastContains = (text: string) => {
    cy.get('ion-toast', { timeout: 12000 }).should('exist');
    cy.get('ion-toast').shadow().find('.toast-message').should('contain.text', text);
  };

  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('shows error when email does not exist (no@existe.com)', () => {
    fillAndSubmitLogin('no@existe.com', 'password123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('shows error when email exists but password is wrong', () => {
    fillAndSubmitLogin('alex142407@gmail.com', 'clave-inventada-123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('shows error for disabled user (juanperez@gmail.com)', () => {
    fillAndSubmitLogin('juanperez@gmail.com', 'clave-inventada-123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('shows error for unverified user (testuser_1779357123840@test.com)', () => {
    fillAndSubmitLogin('testuser_1779357123840@test.com', '1q2w3e4r');
    assertErrorToastContains('Debes verificar tu correo electrónico antes de iniciar sesión');
    cy.url().should('include', '/auth/login');
  });

  it('allows login with a valid existing user', () => {
    fillAndSubmitLogin('atc757@inlumine.ual.es', '1q2w3e4r');
    cy.url({ timeout: 15000 }).should('include', '/home');
  });
});

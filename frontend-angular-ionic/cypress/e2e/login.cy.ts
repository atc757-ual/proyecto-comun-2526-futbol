describe('Login Flow - Casos Reales', () => {
  const fillAndSubmitLogin = (email: string, password: string) => {
    cy.get('ion-input[name="email"] input').clear().type(email);
    cy.get('ion-input[name="password"] input').clear().type(password);
    cy.get('ion-button[type="submit"]').click();
  };

  const assertErrorToast = () => {
    cy.get('ion-toast', { timeout: 12000 }).should('exist');
    cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
  };

  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('muestra error cuando el correo no existe (no@existe.com)', () => {
    fillAndSubmitLogin('no@existe.com', 'password123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('muestra error cuando el correo existe pero la clave es incorrecta', () => {
    fillAndSubmitLogin('alex142407@gmail.com', 'clave-inventada-123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('muestra error para usuario inhabilitado (juanperez@gmail.com)', () => {
    fillAndSubmitLogin('juanperez@gmail.com', 'clave-inventada-123');
    assertErrorToast();
    cy.url().should('include', '/auth/login');
  });

  it('permite continuar con usuario existente válido', () => {
    fillAndSubmitLogin('atc757@inlumine.ual.es', '1q2w3e4r');
    cy.url({ timeout: 15000 }).should('include', '/home');
  });
});

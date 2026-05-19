describe('Register Page E2E Flow', () => {

  beforeEach(() => {
    // Visito la pantalla de registro
    cy.visit('/auth/register');
  });

  // --- 1. Validación de Formatos de Inputs ---

  it('should validate format rules and error messages for each input field', () => {
    // A. Nombre Completo
    cy.get('ion-input[name="fullName"] input').type('Al').blur();
    cy.get('ion-input[name="fullName"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Solo letras (Mín. 3 carácteres)');

    cy.get('ion-input[name="fullName"] input').clear().type('Alex123').blur();
    cy.get('ion-input[name="fullName"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Solo letras (Mín. 3 carácteres)');

    cy.get('ion-input[name="fullName"] input').clear().type('Alex Test').blur();
    cy.get('ion-input[name="fullName"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');

    // B. Correo Electrónico
    cy.get('ion-input[name="email"] input').type('correo-incorrecto').blur();
    cy.get('ion-input[name="email"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Ingresa un email válido');

    cy.get('ion-input[name="email"] input').clear().type('alex@test.com').blur();
    cy.get('ion-input[name="email"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');

    // C. Contraseña
    cy.get('ion-input[name="password"] input').type('12345').blur();
    cy.get('ion-input[name="password"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Debe tener al menos 8 caracteres');

    cy.get('ion-input[name="password"] input').clear().type('password123').blur();
    cy.get('ion-input[name="password"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');

    // D. Confirmación de Contraseña
    cy.get('ion-input[name="confirmPassword"] input').type('password321').blur();
    cy.get('ion-input[name="confirmPassword"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Las contraseñas deben coincidir');

    cy.get('ion-input[name="confirmPassword"] input').clear().type('password123').blur();
    cy.get('ion-input[name="confirmPassword"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');
  });

  // --- 2. Validación de Errores del Servidor (Email en Uso) ---

  it('should display error toast when email is already in use', () => {
    // Intercepto la petición de registro a Firebase Authentication y simulo error de email duplicado
    cy.intercept('POST', '**/accounts:signUp*', {
      statusCode: 400,
      body: {
        error: {
          code: 400,
          message: 'EMAIL_EXISTS'
        }
      }
    }).as('signUpRequest');

    // Lleno el formulario con datos válidos
    cy.get('ion-input[name="fullName"] input').type('Alex Test');
    cy.get('ion-input[name="email"] input').type('duplicado@test.com');
    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password123');

    // Acepto términos haciendo scroll
    cy.get('ion-label a').click();
    cy.get('ion-content.inner-scroll').then(async ($el) => {
      const scrollEl = await ($el[0] as any).getScrollElement();
      scrollEl.scrollTop = scrollEl.scrollHeight;
      $el[0].dispatchEvent(new CustomEvent('ionScroll'));
    });
    cy.get('.terms-action-wrapper ion-button').click();

    // Hago submit
    cy.get('ion-button[type="submit"]').click();

    // Espero la petición interceptada
    cy.wait('@signUpRequest');

    // Verifico que aparezca el Toast de error indicando la coincidencia
    cy.get('.toast-error', { timeout: 8000 }).should('be.visible');
    cy.get('.toast-error').should('contain', 'El email ya está registrado.');
  });

  // --- 3. Validación de Registro Exitoso ---

  it('should register successfully, show premium confirmation modal, and navigate to home', () => {
    // Intercepto el alta en Firebase devolviendo una respuesta de éxito mockeada
    cy.intercept('POST', '**/accounts:signUp*', {
      statusCode: 200,
      body: {
        idToken: 'mock-id-token',
        email: 'nuevo@test.com',
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        localId: 'mock-uid-123'
      }
    }).as('signUpSuccess');

    // Cargo el formulario
    cy.get('ion-input[name="fullName"] input').type('Alex Test');
    cy.get('ion-input[name="email"] input').type('nuevo@test.com');
    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password123');

    // Acepto los términos con scroll
    cy.get('ion-label a').click();
    cy.get('ion-content.inner-scroll').then(async ($el) => {
      const scrollEl = await ($el[0] as any).getScrollElement();
      scrollEl.scrollTop = scrollEl.scrollHeight;
      $el[0].dispatchEvent(new CustomEvent('ionScroll'));
    });
    cy.get('.terms-action-wrapper ion-button').click();

    // Registro
    cy.get('ion-button[type="submit"]').click();

    // Espero la respuesta exitosa del servidor
    cy.wait('@signUpSuccess');

    // Verifico la aparición del modal de confirmación con el título de felicitaciones
    cy.get('ion-modal').should('exist');
    cy.get('ion-modal h2').should('contain', '¡Enhorabuena, Alex!');

    // Pulso en ingresar ahora
    cy.get('ion-modal ion-button').contains('Ingresar ahora').click();

    // Verifico la navegación al home
    cy.url().should('include', '/home');
  });
});

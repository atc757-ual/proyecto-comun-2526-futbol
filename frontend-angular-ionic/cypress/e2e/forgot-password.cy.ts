describe('Forgot Password E2E Flow', () => {

  // --- Flujo A: Solicitud de Restablecimiento ---

  it('should complete the email recovery request flow', () => {
    // Ingreso a la pantalla de recuperación de contraseña
    cy.visit('/auth/forgot-password');

    // Compruebo que nos encontremos en el primer paso (Solicitud)
    cy.get('.step-item.active').should('contain', 'Solicitud');
    
    // Pruebo formato de email inválido
    cy.get('ion-input[name="email"] input').type('correo-incorrecto').blur();
    cy.get('ion-input[name="email"]')
      .should('have.class', 'input-error');

    // Corrijo por un correo válido
    cy.get('ion-input[name="email"] input').clear().type('admin@test.com').blur();
    cy.get('ion-input[name="email"]').should('not.have.class', 'input-error');

    // Hago click en Enviar enlace
    cy.get('ion-button[type="submit"]').click();

    // Verifico que la UI transicione al paso 2 (Enviado) y muestre la confirmación
    cy.get('.step-item.active').should('contain', 'Enviado');
    cy.contains('CÓDIGO ENVIADO').should('be.visible');
    cy.contains('admin@test.com').should('be.visible');

    // Confirmo la presencia del temporizador de reintento
    cy.contains('Reintenta en').should('be.visible');
  });

  // --- Flujo B: Restablecimiento de Clave con oobCode ---

  it('should present the reset form when oobCode is in the URL and handle validation errors', () => {
    // Simulo la llegada del usuario desde su bandeja de correo con el código temporal de Firebase
    cy.visit('/auth/forgot-password?oobCode=codigo_de_prueba_firebase');

    // Verifico que las etiquetas se modifiquen al modo de restauración
    cy.get('.step-item.active').should('contain', 'Nueva Clave');
    cy.contains('Introduce tu nueva contraseña para acceder a tu cuenta.').should('be.visible');

    // Escribo una clave muy corta en Nueva Contraseña
    cy.get('ion-input[name="newPassword"] input').type('12345').blur();
    cy.get('ion-input[name="newPassword"]')
      .should('have.class', 'input-error');

    // Escribo una clave válida pero discrepante en Confirmar Contraseña
    cy.get('ion-input[name="newPassword"] input').clear().type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password321').blur();
    cy.get('ion-input[name="confirmPassword"]')
      .should('have.class', 'input-error');

    // Corrijo ambas claves para que coincidan
    cy.get('ion-input[name="confirmPassword"] input').clear().type('password123');
    cy.get('ion-input[name="confirmPassword"]').should('not.have.class', 'input-error');

    // Envío el formulario
    cy.get('ion-button[type="submit"]').click();

    // Como el código es ficticio, Firebase responderá con un error. Verifico el Toast de alerta
    cy.get('ion-toast', { timeout: 12000 }).should('exist');
    cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
  });
});

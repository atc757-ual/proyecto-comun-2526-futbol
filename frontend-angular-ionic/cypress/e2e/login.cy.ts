describe('Login Flow', () => {
  beforeEach(() => {
    // Redirecciono a la pantalla de login antes de cada prueba
    cy.visit('/login');
  });

  // --- Validación visual e interactiva de campos del formulario ---

  it('should validate email format and show errors', () => {
    // Verifico que el botón de ingresar inicie deshabilitado
    cy.get('ion-button[type="submit"]').should('be.disabled');

    // Digito un formato de correo inválido y simulo pérdida de foco (blur)
    cy.get('ion-input[name="email"] input').type('correo-incorrecto').blur();

    // Compruebo que el input se marque con la clase de error y el texto esperado
    cy.get('ion-input[name="email"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Ingresa un email válido');

    // Confirmo que el botón continúa deshabilitado
    cy.get('ion-button[type="submit"]').should('be.disabled');

    // Corrijo el correo y compruebo que desaparece el error
    cy.get('ion-input[name="email"] input').clear().type('admin@test.com').blur();
    cy.get('ion-input[name="email"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');
  });

  it('should validate password length and show errors', () => {
    // Escribo una contraseña muy corta (menos de 8 caracteres) y pierdo foco
    cy.get('ion-input[name="password"] input').type('12345').blur();

    // Verifico la marca de error en el input de contraseña
    cy.get('ion-input[name="password"]')
      .should('have.class', 'input-error')
      .and('have.attr', 'error-text', 'Debe tener más de 8 dígitos');

    // Confirmo que no se puede enviar el formulario
    cy.get('ion-button[type="submit"]').should('be.disabled');

    // Ingreso una contraseña de longitud válida (mínimo 8 caracteres)
    cy.get('ion-input[name="password"] input').clear().type('admin123456').blur();
    cy.get('ion-input[name="password"]')
      .should('not.have.class', 'input-error')
      .and('have.attr', 'error-text', '');
  });

  // --- Flujos de autenticación e interactividad ---

  it('should show error message with invalid credentials', () => {
    cy.get('ion-input[name="email"] input').type('wrong@email.com');
    cy.get('ion-input[name="password"] input').type('wrongpassword');
    cy.get('ion-button[type="submit"]').click();
    
    // Verifico que el toast de error aparezca en el shadow DOM
    cy.get('ion-toast').shadow().find('.toast-message').should('exist');
  });

  it('should login successfully with valid credentials and navigate to home', () => {
    cy.get('ion-input[name="email"] input').type('admin@test.com');
    cy.get('ion-input[name="password"] input').type('admin123456');
    cy.get('ion-button[type="submit"]').click();

    // Verifico el toast de bienvenida y que se navegue al home
    cy.get('ion-toast').shadow().find('.toast-message').should('exist');
    cy.url().should('include', '/home');
  });

  it('should toggle password visibility', () => {
    cy.get('ion-input[name="password"] input').should('have.attr', 'type', 'password');
    cy.get('ion-input-password-toggle').click();
    cy.get('ion-input[name="password"] input').should('have.attr', 'type', 'text');
  });

  // --- Validación de navegación y redirecciones ---

  it('should navigate to register page', () => {
    cy.contains('Regístrate aquí').click();
    cy.url().should('include', '/auth/register');
  });

  it('should navigate to forgot password page', () => {
    cy.contains('¿Olvidaste tu contraseña?').click();
    cy.url().should('include', '/auth/forgot-password');
  });

  it('should navigate to public players page', () => {
    cy.contains('Ver jugadores').click();
    cy.url().should('include', '/players-public');
  });

  // --- Validación de características de infraestructura ---

  it('should toggle the backend switcher dynamically', () => {
    // Compruebo que el panel del switch de backend existe
    cy.get('.backend-switcher-login').should('exist');
    
    // Evalúo el texto inicial y hago click en el toggle de Ionic
    cy.get('.backend-switcher-login').then(($el) => {
      const isJavaActive = $el.text().includes('Java Microservicios');
      
      // Hago click en el control toggle
      cy.get('.backend-switcher-login ion-toggle').click();
      
      // Verifico que el texto descriptivo cambie al backend alterno
      if (isJavaActive) {
        cy.get('.backend-switcher-login').should('contain', 'Node.js Express');
      } else {
        cy.get('.backend-switcher-login').should('contain', 'Java Microservicios');
      }
    });
  });
});

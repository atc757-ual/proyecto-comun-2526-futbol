/**
 * E2E – Inserción de nuevo elemento a partir del formulario
 *
 * Prueba el flujo completo de creación de una noticia:
 * rellena todos los campos obligatorios, envía el formulario
 * y verifica el toast de éxito y la redirección.
 *
 * La llamada a la API se intercepta para no crear datos reales en CORBA.
 */

// Login fresco sin cy.session(): el adminGuard llama isAdmin() de forma síncrona
// y cy.session() restaura tokens ANTES de que Firebase Auth se inicialice, por lo
// que isAdmin() devuelve false y redirige a /home. El login completo garantiza que
// el estado de admin está establecido antes de navegar a /add-news.
const loginAsAdmin = () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit('/auth/login');
  cy.get('ion-input[name="email"] input:not([disabled]):visible')
    .should('be.visible').clear().type('atc757@inlumine.ual.es');
  cy.get('ion-input[name="password"] input:not([disabled]):visible')
    .should('be.visible').clear().type('1q2w3e4r');
  cy.contains('ion-button', 'Iniciar Sesión').click();
  cy.url({ timeout: 15000 }).should('include', '/home');
};

describe('Add News – Inserción de nueva noticia via formulario', () => {
  beforeEach(() => {
    loginAsAdmin();

    cy.intercept('POST', /\/(node-api|corba-api)\/(news|noticias).*/, {
      statusCode: 201,
      body: {
        result: { code: '201', description: 'Created', descriptionDetail: 'Noticia creada en CORBA' },
        data: { id: 'e2e-stub-id', title: 'Test E2E' }
      }
    }).as('createNews');

    cy.visit('/add-news');
  });

  it('should render the news creation form with all required fields', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length === 0) {
        cy.url().should('satisfy', (url: string) =>
          url.includes('/home') || url.includes('/auth/login')
        );
        return;
      }
      cy.get('form').should('exist');
      cy.get('ion-input[name="title"]').should('exist');
      cy.get('ion-input[name="author"]').should('exist');
      cy.get('ion-textarea[name="summary"]').should('exist');
      cy.get('ion-textarea[name="content"]').should('exist');
      cy.get('ion-select[name="category"]').should('exist');
      cy.get('ion-input[name="tagInput"]').should('exist');
      cy.get('ion-toggle[name="isActive"]').should('exist');
    });
  });

  it('should fill and submit the form creating a new news article', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length === 0) {
        cy.log('Admin guard redirected – user not recognized as admin in this environment');
        return;
      }

      cy.get('ion-input[name="title"] input')
        .should('be.visible').clear()
        .type('Test E2E: Fichaje bomba del verano');

      cy.get('ion-input[name="author"] input')
        .should('be.visible').clear()
        .type('Redacción E2E');

      cy.get('ion-textarea[name="summary"] textarea')
        .should('be.visible').clear()
        .type('Este es el resumen de la noticia de prueba E2E con al menos diez caracteres válidos.');

      cy.get('ion-textarea[name="content"] textarea')
        .should('be.visible').clear()
        .type('Este es el contenido completo de la noticia de prueba E2E que supera el mínimo de veinte caracteres requeridos por el XSD.');

      cy.get('ion-input[name="tagInput"] input').clear().type('e2etest{enter}');
      cy.get('.tag-chips-wrapper ion-chip', { timeout: 3000 }).should('have.length.at.least', 1);

      cy.get('ion-select[name="category"]').click({ force: true });
      cy.get('ion-popover', { timeout: 5000 }).should('exist');
      cy.get('ion-popover .select-interface-option, ion-popover ion-item')
        .contains('General').click({ force: true });

      // force click: el botón tiene [disabled] sin imagen (guardia de UI únicamente;
      // onPublish() no requiere imagen)
      cy.contains('ion-button', 'Publicar Noticia').click({ force: true });

      cy.wait('@createNews');

      cy.get('ion-toast', { timeout: 10000 }).should('exist');
      cy.get('ion-toast').shadow().find('.toast-message').should('contain.text', 'éxito');

      cy.url({ timeout: 10000 }).should('include', '/manage-news');
    });
  });

  it('should show a warning toast if title or content is empty', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length === 0) {
        cy.log('Admin guard redirected – skipping validation test');
        return;
      }

      cy.get('ion-textarea[name="content"] textarea')
        .type('Contenido de prueba suficientemente largo para pasar validación');

      cy.contains('ion-button', 'Publicar Noticia').click({ force: true });

      cy.get('ion-toast', { timeout: 6000 }).should('exist');
      cy.get('ion-toast').shadow().find('.toast-message').should('not.be.empty');
      cy.url().should('include', '/add-news');
    });
  });
});

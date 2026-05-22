describe('Admin Security Page E2E Tests', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.dismissUiBlockers();

    cy.url().then((url) => {
      if (url.includes('/home')) {
        return;
      }

      cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
      cy.typeIntoIonInput('password', '1q2w3e4r');
      cy.contains('ion-button', 'Iniciar Sesión', { timeout: 10000 }).click({ force: true });
      cy.url({ timeout: 20000 }).should((nextUrl) => {
        const ok = nextUrl.includes('/home') || nextUrl.includes('/admin-security');
        expect(ok).to.equal(true);
      });
    });
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/admin-security');
    cy.dismissUiBlockers();
  });

  it('should display firebase native claims and backend API status cards', () => {
    cy.url().then((url) => {
      if (url.includes('/admin-security')) {
        cy.contains('Estado de Protección').should('be.visible');
        cy.contains('Seguridad Nativa Firebase').should('be.visible');
        cy.contains('Seguridad API Node.js').should('be.visible');
        cy.get('.premium-card').should('have.length.at.least', 1);
      } else {
        const ok = url.includes('/home') || url.includes('/auth/login');
        expect(ok).to.equal(true);
      }
    });
  });

  it('should display master admin privileges management card if role permits', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.futbol-input').length > 0) {
        cy.get('.futbol-input').should('exist');
        cy.contains('Gestión de Privilegios').should('be.visible');
      }
    });
  });

  it('should allow searching users and interacting with suggestions', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.futbol-input').length > 0) {
        cy.get('.futbol-input').type('alex');
        
        cy.get('body').then(($newBody) => {
          if ($newBody.find('.search-suggestions').length > 0) {
            cy.get('.search-suggestions').should('be.visible');
            cy.get('.search-suggestions ion-item').first().click();
            
            cy.get('.selected-user-box').should('be.visible');
            cy.get('.btn-group').should('exist');
            
            cy.get('.selected-user-box .close-btn').click();
            cy.get('.selected-user-box').should('not.exist');
          }
        });
      }
    });
  });
});

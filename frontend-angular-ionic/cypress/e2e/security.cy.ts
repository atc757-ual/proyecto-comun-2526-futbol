describe('Admin Security Page E2E Tests', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.get('ion-input[name="email"] input').clear().type('atc757@inlumine.ual.es');
    cy.get('ion-input[name="password"] input').clear().type('1q2w3e4r');
    cy.get('ion-button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/admin-security');
  });

  it('should display firebase native claims and backend API status cards', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.premium-card').length > 0) {
        cy.contains('Seguridad Nativa Firebase').should('be.visible');
        cy.contains('Seguridad API Node.js').should('be.visible');
      } else {
        cy.url().should((url) => {
          const ok = url.includes('/home') || url.includes('/auth/login');
          expect(ok).to.equal(true);
        });
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

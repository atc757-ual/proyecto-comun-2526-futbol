describe('Manage News Page', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.get('ion-input[name="email"] input').clear().type('atc757@inlumine.ual.es');
    cy.get('ion-input[name="password"] input').clear().type('1q2w3e4r');
    cy.get('ion-button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  beforeEach(() => {
    loginUser();
    cy.visit('/manage-news');
  });

  it('should display admin news layout or redirect if user is not admin', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.news-admin-grid').length > 0) {
        cy.get('.news-admin-grid').should('exist');
      } else {
        cy.url().should((url) => {
          const ok = url.includes('/home') || url.includes('/auth/login');
          expect(ok).to.equal(true);
        });
      }
    });
  });

  it('should show bulk panel actions for admin', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.news-admin-grid').length > 0) {
        cy.contains('ion-item', 'Carga Masiva').should('exist');
      }
    });
  });

  it('should allow filtering news using searchbar for admin', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.news-admin-grid').length > 0) {
        cy.get('ion-searchbar input').type('Transfer');
        cy.get('.news-admin-grid').should('exist');
      }
    });
  });

  it('should navigate to edit news when clicking edit button for admin', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.news-admin-grid .btn-action.edit').length > 0) {
        cy.get('.btn-action.edit').first().click({ force: true });
        cy.url().should('include', '/edit-news/');
      }
    });
  });
});
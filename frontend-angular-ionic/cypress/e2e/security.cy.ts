describe('Admin Security Page', () => {
  beforeEach(() => {
    // Simulamos ser Master/Admin
    cy.visit('/admin-security');
  });

  it('should display the users list', () => {
    cy.get('.users-list-section').should('exist');
    cy.get('ion-searchbar').should('exist');
  });

  it('should display user roles and status', () => {
    cy.get('.user-card').first().within(() => {
      cy.get('.role-badge').should('exist');
      cy.get('.status-badge').should('exist');
    });
  });

  it('should show action buttons for Master users', () => {
    // Verificamos botones de toggle status o change role
    cy.get('.action-btn-group').should('exist');
  });
});

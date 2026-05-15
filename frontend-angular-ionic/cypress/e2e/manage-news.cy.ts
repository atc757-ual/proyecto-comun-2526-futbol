describe('Manage News Page', () => {
  beforeEach(() => {
    cy.visit('/manage-news');
  });

  it('should display the news management list', () => {
    cy.get('.news-list-container').should('exist');
  });

  it('should show bulk actions if admin', () => {
    cy.get('.bulk-actions-toolbar').should('exist');
  });

  it('should allow filtering news', () => {
    cy.get('ion-searchbar').type('Transfer');
    cy.get('.news-row').should('exist');
  });

  it('should navigate to edit news when clicking edit button', () => {
    cy.get('.edit-news-btn').first().click();
    cy.url().should('include', '/edit-news/');
  });
});

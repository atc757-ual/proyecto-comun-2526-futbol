describe('News Management Flow', () => {
  beforeEach(() => {
    // 1. Login como admin
    cy.visit('/login');
    cy.get('ion-input[name="email"] input').type('admin@test.com');
    cy.get('ion-input[name="password"] input').type('admin123456');
    cy.get('ion-button[type="submit"]').click();
    
    // Esperar a estar en el Home
    cy.url().should('include', '/home');
    
    // Navegar a Gestión de Noticias
    cy.visit('/manage-news');
    cy.url().should('include', '/manage-news');
  });

  it('should create a new news article successfully', () => {
    cy.get('ion-item[routerLink="/add-news"]').click();
    cy.url().should('include', '/add-news');

    // Llenar formulario
    cy.get('ion-input[name="title"] input').type('Noticia de Prueba E2E');
    cy.get('ion-input[name="author"] input').type('Admin Tester');
    cy.get('ion-textarea[name="summary"] textarea').type('Este es un resumen generado por una prueba automatizada.');
    cy.get('ion-textarea[name="content"] textarea').type('Este es el contenido completo de la noticia de prueba. Debe tener al menos veinte caracteres para ser válida.');
    
    // Seleccionar categoría
    cy.get('ion-select[name="category"]').click();
    cy.get('ion-popover ion-item').first().click();

    // Nota: La subida de imagen en E2E requiere adjuntar un archivo al input oculto
    const fixtureFile = 'news-placeholder.png';
    cy.get('input[type="file"]').last().selectFile({
      contents: Cypress.Buffer.from('fake-image-data'),
      fileName: fixtureFile,
      lastModified: Date.now(),
    }, { force: true });

    // Publicar
    cy.get('ion-button').contains('Publicar Noticia').should('not.be.disabled').click();

    // Verificar redirección y éxito
    cy.url().should('include', '/manage-news');
    cy.contains('Noticia de Prueba E2E').should('exist');
  });

  it('should edit an existing news article', () => {
    // Buscar la noticia creada (usamos el buscador)
    cy.get('ion-searchbar input').type('Noticia de Prueba E2E');
    cy.wait(500); // Esperar filtrado

    // Click en editar
    cy.get('.btn-action.edit').first().click();
    cy.url().should('include', '/edit-news');

    // Modificar título
    cy.get('ion-input[name="title"] input').clear().type('Noticia Editada E2E');
    cy.get('ion-button').contains('Guardar Cambios').click();

    // Verificar cambio
    cy.url().should('include', '/manage-news');
    cy.contains('Noticia Editada E2E').should('exist');
  });

  it('should delete a news article', () => {
    cy.get('ion-searchbar input').type('Noticia Editada E2E');
    
    // Click en borrar
    cy.get('.btn-action.delete').first().click();

    // Confirmar en el Alert de Ionic
    cy.get('ion-alert').should('exist');
    cy.get('button').contains('Eliminar').click({ force: true });

    // Verificar que ya no existe
    cy.contains('Noticia Editada E2E').should('not.exist');
  });

  it('should download news as JSON', () => {
    cy.get('ion-item').contains('Descargar Noticias').should('exist').click();
  });

  it('should perform bulk upload from JSON file', () => {
    // Abrir panel
    cy.get('ion-item').contains('Carga Masiva').click();
    cy.get('.bulk-upload-panel').should('be.visible');

    // Adjuntar archivo mock
    const bulkData = JSON.stringify([{
      title: 'Noticia Masiva 1',
      content: 'Contenido masivo 1...',
      category: 'NACIONAL',
      author: 'Bulk Bot'
    }]);

    cy.get('.bulk-upload-panel input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(bulkData),
      fileName: 'news_bulk.json',
      mimeType: 'application/json'
    }, { force: true });

    // Confirmar
    cy.get('.confirm-btn').should('not.be.disabled').click();
  });
});

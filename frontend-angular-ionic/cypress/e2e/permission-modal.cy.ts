describe('Permission Modal E2E Flow', () => {
  
  beforeEach(() => {
    // Visito el Home inyectando mocks de hardware para simular respuestas afirmativas
    cy.visit('/home', {
      onBeforeLoad(win) {
        // Elimino la marca temporal para obligar a que aparezca el modal de permisos en el Home
        win.localStorage.removeItem('last_permission_prompt_home');

        // Defino el mock para la API de Geolocalización nativa
        const mockGeolocation = {
          getCurrentPosition: (success: Function, error?: Function, options?: any) => {
            // Devuelvo coordenadas simuladas de inmediato
            success({
              coords: {
                latitude: 40.416775,
                longitude: -3.70379
              }
            });
          }
        };

        // Redefino la propiedad en el objeto navigator de la ventana
        Object.defineProperty(win.navigator, 'geolocation', {
          value: mockGeolocation,
          configurable: true,
          writable: true
        });

        // Defino el mock para la API de Dispositivos Multimedia (Cámara)
        const mockMediaDevices = {
          getUserMedia: (constraints: any) => {
            // Resuelvo con un Stream simulado que tiene una pista que se puede detener
            return Promise.resolve({
              getTracks: () => [
                { stop: () => { console.log('Mock Camera Stream Stopped'); } }
              ]
            });
          }
        };

        // Redefino mediaDevices en navigator
        Object.defineProperty(win.navigator, 'mediaDevices', {
          value: mockMediaDevices,
          configurable: true,
          writable: true
        });
      }
    });
  });

  it('should present the onboarding permission modal automatically on dashboard entry', () => {
    // Compruebo que el contenedor del modal de permisos esté montado en el DOM
    cy.get('.permission-modal-main-container').should('exist');
    cy.get('.permission-header h1').should('contain', 'Mejora tu experiencia');

    // Compruebo que el botón inferior empiece en "Quizás más tarde" porque no hay permisos aceptados aún
    cy.get('.permission-footer ion-button').should('contain', 'Quizás más tarde');
  });

  it('should complete the location and camera activation flow and close the modal', () => {
    // Compruebo presencia inicial de los ítems de permisos
    cy.get('.permission-item').should('have.length', 2);

    // 1. Activo el permiso de Ubicación
    cy.get('.permission-item.mb-base').first().within(() => {
      cy.get('ion-button').click();
    });

    // Verifico que el ítem de ubicación cambie de estado a aceptado (con el check verde)
    cy.get('.permission-item.mb-base').first().should('have.class', 'accepted');
    cy.get('.permission-item.mb-base').first().find('ion-icon[name="checkmark-circle-outline"]').should('exist');

    // 2. Activo el permiso de Cámara
    cy.get('.permission-item.is-blue').within(() => {
      cy.get('ion-button').click();
    });

    // Verifico que el ítem de cámara cambie de estado a aceptado (con el check azul)
    cy.get('.permission-item.is-blue').should('have.class', 'accepted');
    cy.get('.permission-item.is-blue').find('ion-icon[name="checkmark-circle-outline"]').should('exist');

    // 3. Compruebo que el botón del footer cambie a "Listo" al concederse accesos
    cy.get('.permission-footer ion-button').should('contain', 'Listo');

    // 4. Hago click en Listo y verifico que el modal se retire del DOM
    cy.get('.permission-footer ion-button').click();
    cy.get('.permission-modal-main-container').should('not.exist');
  });

  it('should close the modal immediately when clicking "Quizás más tarde"', () => {
    // Simulo descartar el modal pulsando el botón de descarte directo
    cy.get('.permission-footer ion-button').contains('Quizás más tarde').click();

    // Verifico que se retire el modal
    cy.get('.permission-modal-main-container').should('not.exist');
  });
});

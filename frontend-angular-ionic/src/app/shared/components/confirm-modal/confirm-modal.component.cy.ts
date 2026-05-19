import { ConfirmModalComponent } from './confirm-modal.component';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';

describe('ConfirmModalComponent Component Tests with Cypress', () => {
  let modalCtrlMock: any;

  beforeEach(() => {
    // Configuro el mock para interceptar las invocaciones de cierre del modal
    modalCtrlMock = {
      dismiss: cy.stub().as('dismissStub')
    };
  });

  // --- Verificación del renderizado del componente ---

  it('should mount with default values and verify layout', () => {
    // Monto el modal con sus valores base
    cy.mount(ConfirmModalComponent, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    });

    // Compruebo la correcta visualización de los textos estándar
    cy.get('h2').should('contain', 'Confirmar Acción');
    cy.get('p').should('contain', '¿Estás seguro de que deseas realizar esta acción?');
    cy.get('.futbol-btn-primary').should('contain', 'Confirmar');
    
    // Verifico que al no pasar cancelText, no se dibuje el botón de cancelar
    cy.get('.btn-cancel').should('not.exist');
    
    // Confirmo la asignación de clase e icono del tipo por defecto (info)
    cy.get('ion-icon').should('have.attr', 'icon', 'information-circle-outline');
    cy.get('.modal-wrapper').should('have.class', 'type-info');
  });

  it('should render custom input configurations correctly', () => {
    // Monto el modal asignándole propiedades de confirmación de borrado
    cy.mount(ConfirmModalComponent, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock }
      ],
      componentProperties: {
        title: '¿Eliminar Jugador?',
        message: 'Esta acción borrará al jugador de forma permanente.',
        confirmText: 'Sí, borrar',
        cancelText: 'No, cancelar',
        type: 'delete'
      }
    });

    // Valido que las propiedades personalizadas se rendericen en el DOM
    cy.get('h2').should('contain', '¿Eliminar Jugador?');
    cy.get('p').should('contain', 'Esta acción borrará al jugador de forma permanente.');
    cy.get('.futbol-btn-primary').should('contain', 'Sí, borrar');
    
    // Confirmo la aparición del botón de cancelar con su texto
    cy.get('.btn-cancel').should('exist').and('contain', 'No, cancelar');
    
    // Verifico el ajuste visual y el icono del tipo de eliminación
    cy.get('ion-icon').should('have.attr', 'icon', 'trash-outline');
    cy.get('.modal-wrapper').should('have.class', 'type-delete');
  });

  // --- Verificación de interactividad y flujos de salida ---

  it('should dismiss with true when clicking primary confirm button', () => {
    // Monto el componente
    cy.mount(ConfirmModalComponent, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    });

    // Simulo la pulsación del botón de confirmar
    cy.get('.futbol-btn-primary').click();

    // Verifico que invoque a dismiss del ModalController pasando true
    cy.get('@dismissStub').should('have.been.calledWith', true);
  });

  it('should dismiss with false when clicking secondary cancel button', () => {
    // Monto el componente inyectando un botón de cancelar
    cy.mount(ConfirmModalComponent, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock }
      ],
      componentProperties: {
        cancelText: 'Atrás'
      }
    });

    // Simulo la pulsación del botón de cancelar
    cy.get('.btn-cancel').click();

    // Verifico que invoque a dismiss del ModalController pasando false
    cy.get('@dismissStub').should('have.been.calledWith', false);
  });
});

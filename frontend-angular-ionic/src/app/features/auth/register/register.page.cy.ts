import { RegisterPage } from './register.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { PlatformService } from '../../../core/services/system/platform.service';

describe('RegisterPage Component Tests with Cypress', () => {
  let authServiceMock: any;
  let navCtrlMock: any;
  let toastServiceMock: any;
  let modalCtrlMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;

  beforeEach(() => {
    // Configuro los mocks de los servicios necesarios en primera persona
    authServiceMock = {
      register: cy.stub().as('registerStub'),
      // Simulo el retorno de datos del documento app_config/terms de Firestore
      getTermsAndConditions: (cy.stub().resolves({
        title: 'Términos y Condiciones de Prueba',
        content: `
          <p>Línea de términos número 1</p>
          <p>Línea de términos número 2</p>
          <p>Línea de términos número 3</p>
          <p>Línea de términos número 4</p>
          <p>Línea de términos número 5</p>
          <p>Línea de términos número 6</p>
          <p>Línea de términos número 7</p>
          <p>Línea de términos número 8</p>
          <p>Línea de términos número 9</p>
          <p>Línea de términos número 10</p>
          <p>Línea de términos número 11</p>
          <p>Línea de términos número 12</p>
          <p>Línea de términos número 13</p>
          <p>Línea de términos número 14</p>
          <p>Línea de términos número 15</p>
        `
      }) as any).as('getTermsStub')
    };

    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };

    toastServiceMock = {
      showSuccess: cy.stub().as('toastSuccessStub'),
      showError: cy.stub().as('toastErrorStub')
    };

    modalCtrlMock = {
      create: cy.stub().resolves({
        present: cy.stub().resolves(),
        onWillDismiss: cy.stub().resolves({ data: true })
      })
    };

    layoutServiceMock = {
      setAuth: cy.stub().as('setAuthStub')
    };

    platformServiceMock = {
      isDesktop: () => true
    };
  });

  // --- Validación del Formulario de Registro ---

  it('should validate character length for full name', () => {
    cy.mount(RegisterPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    });

    // Verifico que nombres cortos muestren el aviso correspondiente
    cy.get('ion-input[name="fullName"] input').type('Al').blur();
    cy.get('ion-input[name="fullName"]')
      .should('have.class', 'input-error');
    
    // Corrijo por un nombre válido
    cy.get('ion-input[name="fullName"] input').clear().type('Alex Test').blur();
    cy.get('ion-input[name="fullName"]')
      .should('not.have.class', 'input-error');
  });

  it('should show error if passwords do not match', () => {
    cy.mount(RegisterPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    });

    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password321').blur();

    // Verifico la alerta de discrepancia en la UI
    cy.get('ion-input[name="confirmPassword"]')
      .should('have.class', 'input-error');
  });

  // --- Validación del Modal de Términos con Scroll ---

  it('should open terms modal, keep accept button disabled until scrolled to bottom, and then enable it', () => {
    cy.mount(RegisterPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    });

    // 1. Compruebo que el checkbox principal en el formulario empiece inactivo y deshabilitado
    cy.get('ion-checkbox[name="acceptTerms"]').should('have.attr', 'aria-disabled', 'true');

    // 2. Abro la overlay haciendo click en el enlace
    cy.get('ion-label a').click();

    // 3. Verifico que el contenedor del modal se presente
    cy.get('.custom-overlay').should('exist');
    cy.get('.f-semibold.fs-20').should('contain', 'Términos y Condiciones de Prueba');

    // 4. Aseguro que el botón interno esté inicialmente deshabilitado (ya que no se ha hecho scroll)
    cy.get('.terms-action-wrapper ion-button').should('have.class', 'button-disabled');

    // 5. Simulo hacer scroll hasta el final del contenido interno de Ionic
    cy.get('ion-content.inner-scroll').then(async ($el) => {
      const scrollEl = await ($el[0] as any).getScrollElement();
      // Desplazo el puntero hasta el fondo
      scrollEl.scrollTop = scrollEl.scrollHeight;
      // Disparo el evento de scroll en el DOM para actualizar la vista de Angular
      $el[0].dispatchEvent(new CustomEvent('ionScroll'));
    });

    // 6. Verifico que el botón de aceptación se habilite de inmediato
    cy.get('.terms-action-wrapper ion-button').should('not.be.disabled');

    // 7. Hago click en aceptar
    cy.get('.terms-action-wrapper ion-button').click();

    // 8. Confirmo que el modal se cierre y que el checkbox del formulario principal ya no esté bloqueado
    cy.get('.custom-overlay').should('not.exist');
    cy.get('ion-checkbox[name="acceptTerms"]').should('have.class', 'checkbox-checked');
  });
});

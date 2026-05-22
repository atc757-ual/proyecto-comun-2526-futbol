import { ForgotPasswordPage } from './forgot-password.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/services/ui/toast.service';
import { of } from 'rxjs';

describe('ForgotPasswordPage Component Tests with Cypress', () => {
  let authServiceMock: any;
  let navCtrlMock: any;
  let activatedRouteMock: any;
  let toastServiceMock: any;

  beforeEach(() => {
    // Configuro los mocks de los servicios necesarios en primera persona
    authServiceMock = {
      sendResetPasswordEmail: (cy.stub().resolves() as any).as('sendEmailStub'),
      confirmReset: (cy.stub().resolves() as any).as('confirmResetStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };
    activatedRouteMock = {
      queryParams: of({})
    };
    toastServiceMock = {
      showSuccess: cy.stub().as('toastSuccessStub'),
      showError: cy.stub().as('toastErrorStub')
    };
  });

  it('should start on step 1 (Email Request)', () => {
    // Monto el componente
    cy.mount(ForgotPasswordPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });

    // Verifico que el stepper bar indique el paso inicial de solicitud
    cy.get('.step-item.active').should('contain', 'Solicitud');
    cy.get('ion-button').contains('Enviar enlace').should('be.visible');
  });

  it('should show countdown after sending email', () => {
    // Monto el componente
    cy.mount(ForgotPasswordPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });

    // Digito un correo válido en el campo correspondiente
    cy.get('ion-input[name="email"] input').type('alex@test.com');
    // Hago click en el botón para enviar el enlace
    cy.get('ion-button').contains('Enviar enlace').click();
    
    // Verifico la llamada al servicio de autenticación con el correo ingresado
    cy.get('@sendEmailStub').should('have.been.calledWith', 'alex@test.com');
    // Verifico que muestre el toast de éxito
    cy.get('@toastSuccessStub').should('have.been.calledWith', '¡Enlace enviado! Revisa tu correo.');

    // Confirmo que la UI transiciona al paso 2
    cy.get('.step-item.active').should('contain', 'Enviado');
    cy.contains('CÓDIGO ENVIADO').should('be.visible');
    cy.contains('Reintenta en').should('be.visible');
  });
});

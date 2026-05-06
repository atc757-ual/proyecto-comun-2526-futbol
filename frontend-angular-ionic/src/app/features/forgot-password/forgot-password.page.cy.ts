import { ForgotPasswordPage } from './forgot-password.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ForgotPasswordPage', () => {
  let authServiceMock: any;
  let navCtrlMock: any;
  let activatedRouteMock: any;

  beforeEach(() => {
    authServiceMock = {
      sendResetPasswordEmail: cy.stub().resolves().as('sendEmailStub'),
      confirmReset: cy.stub().resolves().as('confirmResetStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };
    activatedRouteMock = {
      queryParams: of({})
    };
  });

  it('should start on step 1 (Email Request)', () => {
    cy.mount(ForgotPasswordPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    });

    cy.contains('Recuperar contraseña').should('be.visible');
    cy.get('ion-button').contains('Enviar enlace').should('be.visible');
  });

  it('should show countdown after sending email', () => {
    cy.mount(ForgotPasswordPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    });

    cy.get('ion-input[name="email"] input').type('alex@test.com');
    cy.get('ion-button').contains('Enviar enlace').click();
    
    // Check if it moved to Step 2
    cy.contains('Revisa tu bandeja de entrada').should('be.visible');
    cy.contains('Reintenta en').should('be.visible');
  });
});

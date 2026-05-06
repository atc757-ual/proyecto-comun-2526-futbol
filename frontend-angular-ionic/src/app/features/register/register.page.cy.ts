import { RegisterPage } from './register.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { NavController } from '@ionic/angular/standalone';

describe('RegisterPage', () => {
  let authServiceMock: any;
  let navCtrlMock: any;

  beforeEach(() => {
    authServiceMock = {
      register: cy.stub().as('registerStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };
  });

  it('should validate character length for full name', () => {
    cy.mount(RegisterPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('ion-input[name="fullName"] input').type('Al');
    cy.get('.error-container').should('contain', 'Mín. 3 carácteres');
    
    cy.get('ion-input[name="fullName"] input').type('ex Test');
    cy.get('.error-container').should('not.exist');
    cy.get('ion-icon[name="checkmark-circle-outline"]').should('be.visible');
  });

  it('should show error if passwords do not match', () => {
    cy.mount(RegisterPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-input[name="confirmPassword"] input').type('password321');
    cy.get('.error-container').should('contain', 'Las contraseñas deben coincidir');
  });
});

import { LoginPage } from './login.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';
import { NavController } from '@ionic/angular/standalone';

describe('LoginPage', () => {
  let authServiceMock: any;
  let navCtrlMock: any;

  beforeEach(() => {
    authServiceMock = {
      login: cy.stub().as('loginStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };
  });

  it('should disable login button if form is invalid', () => {
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('ion-button[type="submit"]').should('be.disabled');
    
    cy.get('ion-input[name="email"] input').type('invalid-email');
    cy.get('ion-button[type="submit"]').should('be.disabled');
  });

  it('should enable login button if form is valid', () => {
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('ion-input[name="email"] input').type('alex@test.com');
    cy.get('ion-input[name="password"] input').type('password123');
    cy.get('ion-button[type="submit"]').should('not.be.disabled');
  });
});

import { LoginPage } from './login.page';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { PlatformService } from '../../../core/services/system/platform.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

const emailInputSelector = 'ion-input[name="email"] input';
const passwordInputSelector = 'ion-input[name="password"] input:not([disabled])';

describe('LoginPage Component Tests with Cypress', () => {
  let authServiceMock: any;
  let navCtrlMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;
  let toastServiceMock: any;

  beforeEach(() => {
    // Inicializo los stubs y mocks en primera persona
    authServiceMock = {
      login: cy.stub().as('loginStub')
    };
    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateStub')
    };
    layoutServiceMock = {
      setAuth: cy.stub().as('setAuthStub')
    };
    platformServiceMock = {
      getUseJavaBackend: (cy.stub().returns(false) as any).as('getUseJavaBackendStub'),
      toggleBackend: cy.stub().as('toggleBackendStub')
    };
    toastServiceMock = {
      showSuccess: cy.stub().as('toastSuccessStub'),
      showError: cy.stub().as('toastErrorStub')
    };
  });

  // --- Compruebo el comportamiento de validación del formulario ---

  it('should disable login button if form is invalid', () => {
    // Monto el componente con sus dependencias mockeadas
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Verifico que el botón inicie deshabilitado
    cy.get('ion-button[type="submit"]').should('have.class', 'button-disabled');
    
    // Escribo un email incompleto y confirmo que sigue deshabilitado
    cy.get(emailInputSelector).type('correo-invalido');
    cy.get('ion-button[type="submit"]').should('have.class', 'button-disabled');
  });

  it('should enable login button if form is valid', () => {
    // Monto el componente
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Relleno credenciales válidas y confirmo la habilitación del botón
    cy.get(emailInputSelector).type('alex@test.com');
    cy.get(passwordInputSelector).type('password123');
    cy.get('ion-button[type="submit"]').should('not.be.disabled');
  });

  it('should validate email format and show errors in component UI', () => {
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Digito un correo incorrecto y hago perder el foco (blur)
    cy.get(emailInputSelector).type('correo-incorrecto').blur();

    // Verifico que tenga la clase de error y el atributo error-text
    cy.get('ion-input[name="email"]')
      .should('have.class', 'input-error');

    // Limpio y digito un correo válido
    cy.get(emailInputSelector).clear().type('admin@test.com').blur();
    cy.get('ion-input[name="email"]')
      .should('not.have.class', 'input-error');
  });

  it('should validate password length and show errors in component UI', () => {
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Digito una contraseña muy corta y salgo del foco
    cy.get(passwordInputSelector).type('12345').blur();

    // Compruebo las señales de error en el componente
    cy.get('ion-input[name="password"]')
      .should('have.class', 'input-error');

    // Digito una longitud aceptada
    cy.get(passwordInputSelector).clear().type('admin123456').blur();
    cy.get('ion-input[name="password"]')
      .should('not.have.class', 'input-error');
  });

  // --- Evalúo la ejecución del flujo de autenticación ---

  it('should call login on authService and navigate to home on success', () => {
    // Configuro el mock para resolver exitosamente
    authServiceMock.login.resolves();

    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Digito las credenciales
    cy.get(emailInputSelector).type('alex@test.com');
    cy.get(passwordInputSelector).type('password123');

    // Hago click en el botón de ingresar
    cy.get('ion-button[type="submit"]').click();

    // Verifico que invoque a AuthService con los datos correctos
    cy.get('@loginStub').should('have.been.calledWith', 'alex@test.com', 'password123');
    // Confirmo la creación del Toast de éxito y la redirección
    cy.get('@toastSuccessStub').should('have.been.calledWith', '¡Sesión iniciada con éxito!');
    cy.get('@navigateStub').should('have.been.calledWith', '/home', { animated: false });
  });

  it('should display error toast when credentials are invalid', () => {
    // Configuro el mock de login para registrar fallos
    const error = { code: 'auth/invalid-credential', message: 'Credenciales inválidas' };
    authServiceMock.login.rejects(error);

    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    cy.get(emailInputSelector).type('alex@test.com');
    cy.get(passwordInputSelector).type('password123');
    cy.get('ion-button[type="submit"]').click();

    // Verifico que llame a login y que cree un Toast de error
    cy.get('@loginStub').should('have.been.called');
    cy.get('@toastErrorStub').should('have.been.calledWith', 'El correo o la contraseña son incorrectos.');
  });

  // --- Evalúo la alternancia de backend ---

  it('should toggle backend switcher on ionChange', () => {
    cy.mount(LoginPage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, paramMap: { get: () => null } } } }
      ]
    });

    // Interactúo con el toggle de backend
    cy.get('ion-toggle').click();

    // Valido que invoque a toggleBackend del PlatformService
    cy.get('@toggleBackendStub').should('have.been.called');
  });
});

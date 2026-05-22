import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { ProfilePage } from './profile.page';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';

describe('ProfilePage Component Tests', () => {
  let authServiceMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;
  let toastServiceMock: any;
  let toastSuccessStub: any;
  let toastErrorStub: any;
  let modalCtrlMock: any;
  let actionSheetCtrlMock: any;

  const authMock = {
    currentUser: {
      email: 'alex@test.com',
      metadata: {
        lastSignInTime: '2026-05-21T18:30:00.000Z'
      }
    }
  };

  beforeEach(() => {
    toastSuccessStub = cy.stub().resolves();
    toastErrorStub = cy.stub().resolves();

    authServiceMock = {
      isAdmin: cy.stub().returns(false),
      isMasterAdmin: cy.stub().returns(false),
      userData: cy.stub().returns({ name: 'Alex taquila Camasca', email: 'alex@test.com' }),
      syncUserWithBackend: cy.stub().resolves(),
      sendResetPasswordEmail: cy.stub().resolves(),
      logout: cy.stub().resolves()
    };
    layoutServiceMock = {
      setHeader: cy.stub(),
      setBreadcrumbs: cy.stub()
    };
    platformServiceMock = {
      isDesktop: true,
      getUseJavaBackend: cy.stub().returns(false),
      toggleBackend: cy.stub()
    };
    toastServiceMock = {
      showSuccess: toastSuccessStub,
      showError: toastErrorStub
    };
    modalCtrlMock = {
      create: cy.stub().resolves({
        present: cy.stub().resolves(),
        onWillDismiss: cy.stub().resolves({ data: true })
      })
    };
    actionSheetCtrlMock = {
      create: cy.stub().resolves({ present: cy.stub().resolves() })
    };
  });

  const mountProfile = () => {
    cy.mount(ProfilePage, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Auth, useValue: authMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ActionSheetController, useValue: actionSheetCtrlMock }
      ]
    });
  };

  it('should render the capitalized user name and profile sections', () => {
    mountProfile();

    cy.contains('.profile-name', 'Alex Taquila Camasca').should('be.visible');
    cy.contains('Seguridad y Acceso').should('be.visible');
    cy.contains('Preferencias del Sistema').should('be.visible');
  });

  it('should send the reset password email when the card is clicked', () => {
    mountProfile();

    cy.contains('.action-item', 'Cambiar Contraseña').click({ force: true });

    cy.wrap(authServiceMock.sendResetPasswordEmail).should('have.been.calledWith', 'alex@test.com');
    cy.wrap(toastSuccessStub).should('have.been.calledWith', '¡Enlace enviado! Revisa tu bandeja de entrada.', 5000);
  });

  it('should open the desktop logout confirmation flow', () => {
    mountProfile();

    cy.contains('ion-button', 'Cerrar Sesión').first().click();

    cy.wrap(modalCtrlMock.create).should('have.been.called');
    cy.wrap(authServiceMock.logout).should('have.been.called');
  });
});
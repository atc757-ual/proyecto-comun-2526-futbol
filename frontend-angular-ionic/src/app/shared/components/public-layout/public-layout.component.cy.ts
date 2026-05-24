import { PublicLayoutComponent } from './public-layout.component';
import { IonicModule } from '@ionic/angular';
import { MenuController, ModalController, NavController } from '@ionic/angular/standalone';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';

describe('PublicLayoutComponent Component Cypress Tests', () => {
  let authServiceMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;
  let menuCtrlMock: any;
  let navCtrlMock: any;

  beforeEach(() => {
    authServiceMock = {
      currentUser: () => null,
      userData: () => null,
      logout: () => Promise.resolve()
    };

    layoutServiceMock = {
      showHero: () => false,
      title: () => 'Public Test',
      subtitle: () => '',
      breadcrumbs: () => [{ label: 'Fichajes Publicos', url: '/public/players' }]
    };

    platformServiceMock = {
      isDesktop: true,
      isMobileApp: false
    };

    menuCtrlMock = {
      enable: cy.stub().as('menuEnable')
    };

    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateRoot')
    };
  });

  function mountComponent() {
    const modalCtrlMock = {
      create: cy.stub().resolves({
        present: cy.stub().resolves(),
        onWillDismiss: cy.stub().resolves({ data: null })
      })
    };

    cy.mount(PublicLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    });
  }

  it('should mount successfully and render public layout', () => {
    mountComponent();

    cy.get('.main-wrapper').should('exist');
    cy.get('.main-header').should('exist');
    cy.get('.logo-box').should('exist');
  });

  it('should redirect to login if header logo is clicked without session', () => {
    mountComponent();

    cy.get('.logo-box').should('exist').click();
    cy.get('@navigateRoot').should('have.been.calledWith', '/login');
  });
});

import { PublicLayoutComponent } from './public-layout.component';
import { IonicModule, MenuController, NavController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
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
      logout: () => Promise.resolve()
    };

    layoutServiceMock = {
      breadcrumbs: () => [{ label: 'Fichajes Públicos', url: '/public/players' }]
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

  it('should mount successfully and render public page details', () => {
    cy.mount(PublicLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('ion-content').should('exist');
    cy.get('ion-breadcrumbs').should('exist');
    cy.get('ion-breadcrumb').should('contain', 'Fichajes Públicos');
  });

  it('should redirect to login if header logo is clicked without session', () => {
    cy.mount(PublicLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });

    cy.get('.header-logo-container').should('exist').click();
    cy.get('@navigateRoot').should('have.been.calledWith', '/login');
  });
});

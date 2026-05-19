import { MainLayoutComponent } from './main-layout.component';
import { IonicModule, MenuController, NavController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';

describe('MainLayoutComponent Component Cypress Tests', () => {
  let authServiceMock: any;
  let layoutServiceMock: any;
  let platformServiceMock: any;
  let menuCtrlMock: any;
  let navCtrlMock: any;

  beforeEach(() => {
    authServiceMock = {
      currentUser: () => ({ id: '123', email: 'user@test.com', name: 'Juan' }),
      firstName: () => 'Juan',
      isAdmin: () => true,
      logout: () => Promise.resolve()
    };

    layoutServiceMock = {
      showHero: () => false,
      breadcrumbs: () => [{ label: 'Inicio', url: '/home' }],
      title: () => 'Test Panel',
      subtitle: () => 'Subtítulo del layout',
      setHeader: () => {},
      setBreadcrumbs: () => {}
    };

    platformServiceMock = {
      isDesktop: true,
      isMobileApp: false
    };

    menuCtrlMock = {
      enable: cy.stub().as('menuEnable'),
      close: cy.stub().as('menuClose')
    };

    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateRoot')
    };
  });

  it('should mount successfully with custom title and breadcrumbs', () => {
    cy.mount(MainLayoutComponent, {
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

    cy.get('ion-menu').should('exist');
    cy.get('ion-breadcrumbs').should('exist');
    cy.get('ion-breadcrumb').should('contain', 'Inicio');
  });

  it('should display desktop side panel links', () => {
    cy.mount(MainLayoutComponent, {
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

    cy.get('.desktop-nav-links').should('exist');
    cy.get('.desktop-nav-link').should('have.length.at.least', 2);
  });
});

import { MainLayoutComponent } from './main-layout.component';
import { IonicModule } from '@ionic/angular';
import { ActionSheetController, MenuController, ModalController, NavController } from '@ionic/angular/standalone';
import { RouterTestingModule } from '@angular/router/testing';
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
  let modalCtrlMock: any;
  let actionSheetCtrlMock: any;

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
      subtitle: () => 'Subtitulo del layout',
      aiLoading: () => false,
      aiThinkingText: () => '',
      isHome: () => false,
      setHeader: () => {},
      setBreadcrumbs: () => {}
    };

    platformServiceMock = {
      isDesktop: true,
      isMobileApp: false,
      isWebMobile: false
    };

    menuCtrlMock = {
      enable: cy.stub().as('menuEnable'),
      close: cy.stub().as('menuClose')
    };

    navCtrlMock = {
      navigateRoot: cy.stub().as('navigateRoot')
    };

    modalCtrlMock = {
      create: cy.stub().resolves({
        present: cy.stub().resolves(),
        onWillDismiss: cy.stub().resolves({ data: false })
      })
    };

    actionSheetCtrlMock = {
      create: cy.stub().resolves({ present: cy.stub().resolves() })
    };
  });

  function mountComponent() {
    cy.mount(MainLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ActionSheetController, useValue: actionSheetCtrlMock }
      ]
    });
  }

  it('should mount successfully with breadcrumbs in desktop mode', () => {
    mountComponent();

    cy.get('ion-menu').should('exist');
    cy.get('ion-breadcrumbs').should('exist');
    cy.contains('ion-breadcrumb', 'Inicio').should('exist');
    cy.get('.main-header').should('exist');
  });

  it('should display desktop navigation items', () => {
    mountComponent();

    cy.get('.nav-header-row').should('exist');
    cy.get('.nav-links-centered li').should('have.length.at.least', 4);
    cy.contains('.nav-links-centered li', 'AI').should('exist');
  });
});

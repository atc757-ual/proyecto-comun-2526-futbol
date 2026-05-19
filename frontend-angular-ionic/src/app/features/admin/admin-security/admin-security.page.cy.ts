import { AdminSecurityPage } from './admin-security.page';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Auth } from '@angular/fire/auth';
import { LayoutService } from 'src/app/core/services/ui/layout.service';

describe('AdminSecurityPage Component Cypress Tests', () => {
  let authServiceMock: any;
  let layoutServiceMock: any;
  let mockAuth: any;

  beforeEach(() => {
    authServiceMock = {
      currentUser: () => ({ uid: 'admin123', email: 'admin@test.com' }),
      isAdmin: () => true,
      isMasterAdmin: () => true,
      promoteUserToAdmin: cy.stub().as('promoteUserToAdmin').resolves({}),
      removeAdminRole: cy.stub().as('removeAdminRole').resolves({}),
      toggleUserStatus: cy.stub().as('toggleUserStatus').resolves({}),
      searchUsers: cy.stub().as('searchUsers').resolves({ data: [] })
    };

    layoutServiceMock = {
      setHeader: () => {},
      setBreadcrumbs: () => {}
    };

    mockAuth = {
      currentUser: {
        email: 'admin@test.com',
        getIdTokenResult: cy.stub().as('getIdTokenResult').resolves({ claims: { admin: true } })
      }
    };
  });

  it('should mount the security page with native claim information', () => {
    cy.mount(AdminSecurityPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: Auth, useValue: mockAuth }
      ]
    });

    cy.get('ion-card-title').should('contain', 'Seguridad Nativa Firebase');
    cy.get('ion-badge').should('contain', 'Activo');
  });

  it('should render the role management card for master admins', () => {
    cy.mount(AdminSecurityPage, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: Auth, useValue: mockAuth }
      ]
    });

    cy.get('ion-card-title').should('contain', 'Gestión de Privilegios');
    cy.get('ion-input').should('exist');
  });
});

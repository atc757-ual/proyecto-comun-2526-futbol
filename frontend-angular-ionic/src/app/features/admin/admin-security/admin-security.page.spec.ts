import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AdminSecurityPage } from './admin-security.page';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AdminSecurityPage Unit Tests', () => {
  let component: AdminSecurityPage;
  let fixture: ComponentFixture<AdminSecurityPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastCtrlSpy: jasmine.SpyObj<ToastController>;
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;
  let mockAuth: any;

  beforeEach(waitForAsync(() => {
    const authServiceMock = jasmine.createSpyObj('AuthService', [
      'currentUser', 'isAdmin', 'isMasterAdmin',
      'promoteUserToAdmin', 'removeAdminRole', 'toggleUserStatus', 'searchUsers'
    ]);
    const toastCtrlMock = jasmine.createSpyObj('ToastController', ['create']);
    const layoutServiceMock = jasmine.createSpyObj('LayoutService', ['setHeader', 'setBreadcrumbs']);

    authServiceMock.currentUser.and.returnValue({ uid: 'admin123', email: 'admin@test.com' });
    authServiceMock.isAdmin.and.returnValue(true);
    authServiceMock.isMasterAdmin.and.returnValue(true);

    mockAuth = {
      currentUser: {
        email: 'admin@test.com',
        getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
          Promise.resolve({ claims: { admin: true } })
        )
      }
    };

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        AdminSecurityPage
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastController, useValue: toastCtrlMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: Auth, useValue: mockAuth },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSecurityPage);
    component = fixture.componentInstance;

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastCtrlSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;

    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastCtrlSpy.create.and.returnValue(Promise.resolve(mockToast));

    fixture.detectChanges();
  }));

  it('should create the admin security page', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize header and breadcrumbs on init', () => {
    expect(component.breadcrumbs).toBeDefined();
    // No comprobamos llamadas al servicio ya que la vinculación es por @Input en el HTML
  });

  it('should verify security status and set claims', async () => {
    await component.checkSecurityStatus();
    expect(mockAuth.currentUser.getIdTokenResult).toHaveBeenCalled();
    expect(component.firebaseClaims()).toEqual({ admin: true });
    expect(component.backendIsAdmin()).toBeTrue();
  });

  it('should promote user when promoteUser is called', async () => {
    authServiceSpy.promoteUserToAdmin.and.returnValue(Promise.resolve({}));
    component.targetEmail = 'newadmin@test.com';

    await component.promoteUser();

    expect(authServiceSpy.promoteUserToAdmin).toHaveBeenCalledWith('newadmin@test.com');
    expect(toastCtrlSpy.create).toHaveBeenCalled();
    expect(component.targetEmail).toBe('');
  });

  it('should revoke user privileges when revokeUser is called', async () => {
    authServiceSpy.removeAdminRole.and.returnValue(Promise.resolve({}));
    component.targetEmail = 'revoked@test.com';

    await component.revokeUser();

    expect(authServiceSpy.removeAdminRole).toHaveBeenCalledWith('revoked@test.com');
    expect(toastCtrlSpy.create).toHaveBeenCalled();
    expect(component.targetEmail).toBe('');
  });

  it('should toggle user account status', async () => {
    authServiceSpy.toggleUserStatus.and.returnValue(Promise.resolve({}));
    component.targetEmail = 'toggle@test.com';

    await component.toggleUserStatus(true);

    expect(authServiceSpy.toggleUserStatus).toHaveBeenCalledWith('toggle@test.com', true);
    expect(toastCtrlSpy.create).toHaveBeenCalled();
  });

  it('should promote self if currentUser email is present', async () => {
    authServiceSpy.promoteUserToAdmin.and.returnValue(Promise.resolve({}));
    spyOn(component, 'promoteUser').and.callThrough();

    await component.promoteSelf();

    expect(component.promoteUser).toHaveBeenCalled();
  });
});

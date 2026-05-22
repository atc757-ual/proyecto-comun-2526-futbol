import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { ProfilePage } from './profile.page';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let layoutServiceMock: jasmine.SpyObj<LayoutService>;
  let platformServiceMock: jasmine.SpyObj<PlatformService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let modalCtrlMock: jasmine.SpyObj<ModalController>;
  let actionSheetCtrlMock: jasmine.SpyObj<ActionSheetController>;
  let routerMock: jasmine.SpyObj<Router>;

  const authMock = {
    currentUser: {
      email: 'alex@test.com',
      metadata: {
        lastSignInTime: '2026-05-21T18:30:00.000Z'
      }
    }
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'isAdmin',
      'isMasterAdmin',
      'syncUserWithBackend',
      'sendResetPasswordEmail',
      'logout'
    ], {
      userData: jasmine.createSpy('userData').and.returnValue({
        name: 'Alex taquila Camasca',
        email: 'alex@test.com'
      })
    });

    layoutServiceMock = jasmine.createSpyObj('LayoutService', ['setHeader', 'setBreadcrumbs']);
    platformServiceMock = jasmine.createSpyObj('PlatformService', ['getUseJavaBackend', 'toggleBackend'], {
      isDesktop: true
    });
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    modalCtrlMock = jasmine.createSpyObj('ModalController', ['create']);
    actionSheetCtrlMock = jasmine.createSpyObj('ActionSheetController', ['create']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    authServiceMock.isAdmin.and.returnValue(false);
    authServiceMock.isMasterAdmin.and.returnValue(false);
    authServiceMock.syncUserWithBackend.and.resolveTo();
    authServiceMock.sendResetPasswordEmail.and.resolveTo();
    authServiceMock.logout.and.resolveTo();
    platformServiceMock.getUseJavaBackend.and.returnValue(false);
    toastServiceMock.showSuccess.and.resolveTo();
    toastServiceMock.showError.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Auth, useValue: authMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ActionSheetController, useValue: actionSheetCtrlMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('reset_cooldown_end');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should capitalize the displayed user name', () => {
    expect(component.currentUserInfo.name).toBe('Alex Taquila Camasca');
  });

  it('should configure header and breadcrumbs on init', () => {
    expect(layoutServiceMock.setHeader).toHaveBeenCalled();
    expect(layoutServiceMock.setBreadcrumbs).toHaveBeenCalledWith([
      { label: '', url: '/', icon: 'home-outline' },
      { label: 'Mi Perfil', url: '/profile' }
    ]);
  });

  it('should toggle backend and show success toast', async () => {
    platformServiceMock.getUseJavaBackend.and.returnValues(false, true);

    await component.toggleBackend();

    expect(authServiceMock.syncUserWithBackend).toHaveBeenCalledWith(true);
    expect(platformServiceMock.toggleBackend).toHaveBeenCalled();
    expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('Backend cambiado a Java al instante');
    expect(component.useSpringBoot).toBeTrue();
  });

  it('should send password reset and start cooldown on success', async () => {
    await component.sendPasswordReset();

    expect(authServiceMock.sendResetPasswordEmail).toHaveBeenCalledWith('alex@test.com');
    expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('¡Enlace enviado! Revisa tu bandeja de entrada.', 5000);
    expect(component.resetCooldown).toBeTrue();
  });

  it('should show error toast when password reset fails', async () => {
    authServiceMock.sendResetPasswordEmail.and.rejectWith(new Error('fail'));

    await component.sendPasswordReset();

    expect(toastServiceMock.showError).toHaveBeenCalledWith('Error al enviar el enlace.', 3000);
    expect(component.isSendingReset).toBeFalse();
  });

  it('should logout after desktop modal confirmation', async () => {
    const modalMock = {
      present: jasmine.createSpy('present').and.resolveTo(),
      onWillDismiss: jasmine.createSpy('onWillDismiss').and.resolveTo({ data: true })
    };
    modalCtrlMock.create.and.resolveTo(modalMock as any);

    await component.confirmLogout();

    expect(modalCtrlMock.create).toHaveBeenCalled();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
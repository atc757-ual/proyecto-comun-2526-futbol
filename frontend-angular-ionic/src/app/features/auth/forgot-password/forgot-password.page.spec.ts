import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordPage } from './forgot-password.page';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/ui/toast.service';
import { of, BehaviorSubject } from 'rxjs';

describe('ForgotPasswordPage Karma Unit Tests', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let navCtrlMock: jasmine.SpyObj<NavController>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let routerMock: jasmine.SpyObj<Router>;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Configuro los espías de los servicios en primera persona
    authServiceMock = jasmine.createSpyObj('AuthService', ['sendResetPasswordEmail', 'confirmReset']);
    navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Lógica de Creación e Inicialización ---

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should configure step labels and state when loading without oobCode', () => {
    // El queryParams inicial está vacío por defecto en el mock
    expect(component.oobCode).toBeNull();
    expect(component.step1Label).toBe('Solicitud');
    expect(component.step2Label).toBe('Enviado');
    expect(component.currentStep).toBe(1);
  });

  it('should configure step labels for reset password when oobCode is present in URL', () => {
    // Simulo la entrada de un código de restauración a través de la URL
    queryParamsSubject.next({ oobCode: 'firebase-restore-code' });
    fixture.detectChanges();

    expect(component.oobCode).toBe('firebase-restore-code');
    expect(component.step1Label).toBe('Nueva Clave');
    expect(component.step2Label).toBe('Éxito');
  });

  // --- Lógica de Validaciones Unitarias ---

  it('should evaluate email validity correctly', () => {
    component.userEmail = 'incorrecto';
    expect(component.isEmailValid()).toBeFalse();

    component.userEmail = 'alex@test.com';
    expect(component.isEmailValid()).toBeTrue();
  });

  it('should validate password parameters and matches', () => {
    component.newPass = '12345';
    expect(component.isPasswordValid()).toBeFalse(); // Menos de 8 caracteres

    component.newPass = 'password123';
    expect(component.isPasswordValid()).toBeTrue();

    component.confirmPass = 'password321';
    expect(component.doPasswordsMatch()).toBeFalse(); // No coinciden

    component.confirmPass = 'password123';
    expect(component.doPasswordsMatch()).toBeTrue();
  });

  // --- Lógica de Procesos de Autenticación ---

  it('should send reset link successfully and change step', async () => {
    component.userEmail = 'alex@test.com';
    authServiceMock.sendResetPasswordEmail.and.returnValue(Promise.resolve());

    await component.sendResetLink();

    expect(authServiceMock.sendResetPasswordEmail).toHaveBeenCalledWith('alex@test.com');
    expect(component.currentStep).toBe(2);
    expect(component.isEmailSent).toBeTrue();
    expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('¡Enlace enviado! Revisa tu correo.');
  });

  it('should show error toast if sending reset link fails', async () => {
    component.userEmail = 'alex@test.com';
    authServiceMock.sendResetPasswordEmail.and.returnValue(Promise.reject(new Error('Firebase Error')));

    await component.sendResetLink();

    expect(toastServiceMock.showError).toHaveBeenCalledWith('Error al enviar el email. Inténtalo de nuevo.');
    expect(component.currentStep).toBe(1); // No cambia de paso
  });

  it('should change password successfully when oobCode and form are valid', async () => {
    queryParamsSubject.next({ oobCode: 'firebase-restore-code' });
    fixture.detectChanges();

    component.newPass = 'password123';
    component.confirmPass = 'password123';
    authServiceMock.confirmReset.and.returnValue(Promise.resolve());

    await component.resetPassword();

    expect(authServiceMock.confirmReset).toHaveBeenCalledWith('firebase-restore-code', 'password123');
    expect(component.isPasswordChanged).toBeTrue();
    expect(component.currentStep).toBe(2);
    expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('Contraseña actualizada correctamente');
  });
});

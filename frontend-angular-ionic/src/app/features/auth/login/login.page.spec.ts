import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';
import { Router, provideRouter } from '@angular/router';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';

fdescribe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let navCtrlMock: jasmine.SpyObj<NavController>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let layoutServiceMock: jasmine.SpyObj<LayoutService>;
  let platformServiceMock: jasmine.SpyObj<PlatformService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['login']);
    navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    layoutServiceMock = jasmine.createSpyObj('LayoutService', ['setAuth']);
    platformServiceMock = jasmine.createSpyObj('PlatformService', ['toggleBackend', 'getUseJavaBackend']);

    platformServiceMock.getUseJavaBackend.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Realizo pruebas de validación de campos ---

  it('should validate email formats correctly', () => {
    component.userEmail = 'valido@correo.com';
    expect(component.isEmailValid()).toBeTrue();

    component.userEmail = 'invalido-email';
    expect(component.isEmailValid()).toBeFalse();

    component.userEmail = '';
    expect(component.isEmailValid()).toBeFalse();
  });

  it('should validate password length correctly', () => {
    component.userPass = '12345678';
    expect(component.isPasswordValid()).toBeTrue();

    component.userPass = '1234567';
    expect(component.isPasswordValid()).toBeFalse();

    component.userPass = '';
    expect(component.isPasswordValid()).toBeFalse();
  });

  it('should validate form correctly when fields change', () => {
    component.userEmail = 'alex@test.com';
    component.userPass = '12345678';
    expect(component.isFormValid()).toBeTrue();

    component.userEmail = 'invalid';
    component.userPass = '12345678';
    expect(component.isFormValid()).toBeFalse();

    component.userEmail = 'alex@test.com';
    component.userPass = 'short';
    expect(component.isFormValid()).toBeFalse();
  });

  // --- Verifico las interacciones de los estados de foco ---

  it('should manage email focus states', () => {
    component.onFocusEmail();
    expect(component.emailFocused).toBeTrue();

    component.markEmailTouched();
    expect(component.emailTouched).toBeTrue();
    expect(component.emailFocused).toBeFalse();
  });

  it('should manage password focus states', () => {
    component.onFocusPass();
    expect(component.passFocused).toBeTrue();

    component.markPassTouched();
    expect(component.passTouched).toBeTrue();
    expect(component.passFocused).toBeFalse();
  });

  it('should toggle backend switcher', () => {
    component.toggleBackend();
    expect(platformServiceMock.toggleBackend).toHaveBeenCalled();
  });

  // --- Evalúo los flujos de inicio de sesión ---

  it('should show success toast and navigate to home on successful login', async () => {
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    authServiceMock.login.and.returnValue(Promise.resolve({} as any));

    await component.onLogin();

    expect(authServiceMock.login).toHaveBeenCalledWith('alex@test.com', 'password123');
    expect(toastServiceMock.showSuccess).toHaveBeenCalledWith('¡Sesión iniciada con éxito!');
    expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/home', { animated: false });
    expect(component.isLoading).toBeFalse();
  });

  it('should show error toast for invalid credentials', async () => {
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    const error = { code: 'auth/invalid-credential', message: 'Credenciales inválidas' };
    authServiceMock.login.and.returnValue(Promise.reject(error));

    await component.onLogin();

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(toastServiceMock.showError).toHaveBeenCalledWith('El correo o la contraseña son incorrectos.');
    expect(component.isLoading).toBeFalse();
  });

  it('should show error toast for user not found', async () => {
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    const error = { code: 'auth/user-not-found', message: 'Usuario no encontrado' };
    authServiceMock.login.and.returnValue(Promise.reject(error));

    await component.onLogin();

    expect(toastServiceMock.showError).toHaveBeenCalledWith('El correo ingresado no está registrado.');
  });

  it('should show generic error toast for unexpected errors', async () => {
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    const error = new Error('Conexión perdida con el servidor');
    authServiceMock.login.and.returnValue(Promise.reject(error));

    await component.onLogin();

    expect(toastServiceMock.showError).toHaveBeenCalledWith('Conexión perdida con el servidor');
  });
});

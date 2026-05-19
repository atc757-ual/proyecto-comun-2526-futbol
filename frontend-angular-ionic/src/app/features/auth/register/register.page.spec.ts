import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NavController, ModalController } from '@ionic/angular/standalone';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { PlatformService } from '../../../core/services/system/platform.service';

describe('RegisterPage Karma Unit Tests', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let navCtrlMock: jasmine.SpyObj<NavController>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let layoutServiceMock: jasmine.SpyObj<LayoutService>;
  let modalCtrlMock: jasmine.SpyObj<ModalController>;
  let platformServiceMock: jasmine.SpyObj<PlatformService>;

  beforeEach(async () => {
    // Configuro los espías de los servicios implicados en primera persona
    authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'logout', 'getTermsAndConditions']);
    navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    layoutServiceMock = jasmine.createSpyObj('LayoutService', ['setAuth']);
    modalCtrlMock = jasmine.createSpyObj('ModalController', ['create']);
    platformServiceMock = jasmine.createSpyObj('PlatformService', ['isCordova', 'isCapacitor']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Lógica de Creación e Inicialización ---

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should configure auth layout title on init', () => {
    expect(layoutServiceMock.setAuth).toHaveBeenCalledWith({
      title: 'Únete al equipo',
      subtitle: 'Crea tu cuenta para empezar a gestionar jugadores.',
      isLogin: false
    });
  });

  // --- Lógica de Validaciones Unitarias del Formulario ---

  it('should validate full name format and length', () => {
    component.userName = 'Al'; // Muy corto
    expect(component.isNameValid()).toBeFalse();

    component.userName = 'Alex123'; // Contiene números
    expect(component.isNameValid()).toBeFalse();

    component.userName = 'Alex Test'; // Válido
    expect(component.isNameValid()).toBeTrue();
  });

  it('should validate email format accurately', () => {
    component.userEmail = 'test@com'; // Formato incorrecto
    expect(component.isEmailValid()).toBeFalse();

    component.userEmail = 'alex@test.com'; // Válido
    expect(component.isEmailValid()).toBeTrue();
  });

  it('should validate password length and matches', () => {
    component.userPass = '12345';
    expect(component.isPasswordValid()).toBeFalse();

    component.userPass = 'password123';
    expect(component.isPasswordValid()).toBeTrue();

    component.confirmPass = 'password321';
    expect(component.doPasswordsMatch()).toBeFalse();

    component.confirmPass = 'password123';
    expect(component.doPasswordsMatch()).toBeTrue();
  });

  // --- Lógica de Términos y Condiciones ---

  it('should fetch and load terms content on openTermsOverlay()', async () => {
    const termsPayload = { title: 'Términos Mock', content: '<p>Contenido Mock</p>' };
    authServiceMock.getTermsAndConditions.and.returnValue(Promise.resolve(termsPayload));

    await component.openTermsOverlay();

    expect(component.showTermsOverlay).toBeTrue();
    expect(authServiceMock.getTermsAndConditions).toHaveBeenCalled();
    expect(component.termsTitle).toBe('Términos Mock');
    expect(component.termsContent).toBe('<p>Contenido Mock</p>');
  });

  // --- Lógica de Procesos de Autenticación ---

  it('should register successfully and display confirmation modal', async () => {
    // Configuro el formulario válido
    component.userName = 'Alex Test';
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    component.confirmPass = 'password123';
    component.acceptTerms = true;

    authServiceMock.register.and.returnValue(Promise.resolve());
    
    // Configuro el spy del ModalController para retornar una promesa resuelta
    const modalSpy = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onWillDismiss']);
    modalSpy.onWillDismiss.and.returnValue(Promise.resolve({ data: true }));
    modalCtrlMock.create.and.returnValue(Promise.resolve(modalSpy));

    await component.onRegister();

    expect(authServiceMock.register).toHaveBeenCalledWith('alex@test.com', 'password123', 'Alex Test');
    expect(modalCtrlMock.create).toHaveBeenCalled();
    expect(modalSpy.present).toHaveBeenCalled();
  });

  it('should display error toast if registration service fails', async () => {
    component.userName = 'Alex Test';
    component.userEmail = 'alex@test.com';
    component.userPass = 'password123';
    component.confirmPass = 'password123';
    component.acceptTerms = true;

    authServiceMock.register.and.returnValue(Promise.reject({ code: 'auth/email-already-in-use' }));

    await component.onRegister();

    expect(toastServiceMock.showError).toHaveBeenCalledWith('El email ya está registrado.');
    expect(component.isLoading).toBeFalse();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionModalComponent } from './permission-modal.component';
import { ModalController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';

describe('PermissionModalComponent Karma Unit Tests', () => {
  let component: PermissionModalComponent;
  let fixture: ComponentFixture<PermissionModalComponent>;
  let modalCtrlMock: jasmine.SpyObj<ModalController>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let locationPluginMock: jasmine.SpyObj<LocationPlugin>;

  beforeEach(async () => {
    modalCtrlMock = jasmine.createSpyObj('ModalController', ['dismiss']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    locationPluginMock = jasmine.createSpyObj('LocationPlugin', [
      'isGeolocationPermissionGranted',
      'requestGeolocationPermission'
    ]);
    locationPluginMock.isGeolocationPermissionGranted.and.returnValue(Promise.resolve(false));
    locationPluginMock.requestGeolocationPermission.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [PermissionModalComponent],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocationPlugin, useValue: locationPluginMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Lógica de inicialización ---

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should set default state variables upon creation', () => {
    // Compruebo que el modo base sea commenting y los accesos inicien inactivos
    expect(component.mode).toBe('commenting');
    expect(component.locationAccepted).toBeFalse();
    expect(component.cameraAccepted).toBeFalse();
    expect(component.isLoadingLocation).toBeFalse();
    expect(component.isLoadingCamera).toBeFalse();
  });

  // --- Lógica del controlador y salida ---

  it('should call dismiss with combined permission state when dismiss() is executed', () => {
    // Simulo que se ha concedido el acceso a geolocalización
    component.locationAccepted = true;
    component.cameraAccepted = false;
    
    // Invoco el cierre del modal
    component.dismiss();

    // Verifico que invoque a dismiss enviando true al combinar los estados
    expect(modalCtrlMock.dismiss).toHaveBeenCalledWith(true);
  });
});

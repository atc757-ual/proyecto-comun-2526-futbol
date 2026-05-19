import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';
import { ModalController } from '@ionic/angular/standalone';

describe('ConfirmModalComponent Karma Unit Tests', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let modalCtrlMock: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    // Configuro el espía del controlador del modal en primera persona
    modalCtrlMock = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
      providers: [
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Lógica de inicialización ---

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with standard default input properties', () => {
    // Verifico que los valores por defecto del modal estén correctamente cargados
    expect(component.title).toBe('Confirmar Acción');
    expect(component.message).toBe('¿Estás seguro de que deseas realizar esta acción?');
    expect(component.confirmText).toBe('Confirmar');
    expect(component.cancelText).toBe('');
    expect(component.type).toBe('info');
  });

  // --- Lógica del controlador y salida ---

  it('should trigger modal dismissal with true upon calling dismiss(true)', () => {
    // Invoco el cierre positivo del modal
    component.dismiss(true);

    // Valido la interacción directa con el servicio de Ionic
    expect(modalCtrlMock.dismiss).toHaveBeenCalledWith(true);
  });

  it('should trigger modal dismissal with false upon calling dismiss(false)', () => {
    // Invoco el cierre negativo del modal
    component.dismiss(false);

    // Valido la interacción directa con el servicio de Ionic
    expect(modalCtrlMock.dismiss).toHaveBeenCalledWith(false);
  });
});

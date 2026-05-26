import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let toastCtrlMock: jasmine.SpyObj<ToastController>;

  const mockToast = { present: jasmine.createSpy('present').and.returnValue(Promise.resolve()) };

  beforeEach(() => {
    toastCtrlMock = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrlMock.create.and.returnValue(Promise.resolve(mockToast as any));

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: ToastController, useValue: toastCtrlMock }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('showSuccess should create a toast with success config', async () => {
    await service.showSuccess('Operación exitosa');

    expect(toastCtrlMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Operación exitosa',
      position: 'top',
      cssClass: 'toast-success',
      icon: 'checkmark-circle-outline'
    }));
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('showSuccess should use default duration of 2000ms', async () => {
    await service.showSuccess('ok');
    expect(toastCtrlMock.create).toHaveBeenCalledWith(jasmine.objectContaining({ duration: 2000 }));
  });

  it('showSuccess should accept custom duration', async () => {
    await service.showSuccess('ok', 5000);
    expect(toastCtrlMock.create).toHaveBeenCalledWith(jasmine.objectContaining({ duration: 5000 }));
  });

  it('showError should create a toast with error config', async () => {
    await service.showError('Algo salió mal');

    expect(toastCtrlMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Algo salió mal',
      position: 'top',
      cssClass: 'toast-error',
      icon: 'alert-circle-outline'
    }));
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('showError should use default duration of 4000ms', async () => {
    await service.showError('error');
    expect(toastCtrlMock.create).toHaveBeenCalledWith(jasmine.objectContaining({ duration: 4000 }));
  });
});

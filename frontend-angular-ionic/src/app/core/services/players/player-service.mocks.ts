import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../system/logger.service';

export const storageMock = {
  uploadImage: jasmine.createSpy().and.returnValue(Promise.resolve('https://img.url')),
  deleteImageByUrl: jasmine.createSpy().and.returnValue(Promise.resolve()),
};

export const authServiceMock = {
  currentUser: () => ({ uid: 'uid-1', email: 'test@test.com' }),
  getUID: () => 'uid-1',
  isAdmin: () => false,
};

export const loggerMock = {
  log: jasmine.createSpy(),
  warn: jasmine.createSpy(),
  error: jasmine.createSpy(),
};

export function configurePlayerTestBed(ServiceClass: any): void {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      ServiceClass,
      { provide: StorageService, useValue: storageMock },
      { provide: AuthService, useValue: authServiceMock },
      { provide: LoggerService, useValue: loggerMock },
    ]
  });
}

export function runCommonPlayerContractTests(
  getService: () => any,
  getHttp: () => HttpTestingController,
  baseUrl: string
): void {
  afterEach(() => getHttp().verify());

  it('should be created', () => {
    expect(getService()).toBeTruthy();
  });

  it('getPublicPlayers() should call /players/public', () => {
    getService().getPublicPlayers().subscribe((res: any) => expect(res).toEqual([]));
    getHttp().expectOne(`${baseUrl}/public`).flush({ data: [] });
  });
}
